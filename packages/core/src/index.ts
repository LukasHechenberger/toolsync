import { logger } from '@toolsync/logger';
import { deepmergeInto } from 'deepmerge-ts';
import type { DevtoolsConfig, Package, Packages } from './types';
import { definePlugin, type Plugin, type PluginContext, type PluginHooks } from './plugins';
import { getPackages } from '@manypkg/get-packages';
import { createRequire } from 'module';
import { writeFile } from 'fs/promises';
import { join } from 'path';

const log = logger.child('core');
const pluginLogger = logger.child('plugin');

log.info('Devtools Core initialized');
log.debug('Debug logging is enabled');

const require = global.require ?? createRequire(import.meta.url);

const corePlugin = definePlugin<{ defaultPlugins?: boolean | string[] }>({
  name: '@toolsync/core',
  async loadModule(reference: string, { log }) {
    log.trace(`Loading module '${reference}' as a node module`, { cwd: process.cwd() });

    // NOTE: Once it's stable, we can use import.meta.resolve
    // const metaResolved = import.meta.resolve(reference, 'file://' + process.cwd());

    // FIXME: Does not work if "exports" does not contain a "default" field - Add a warning!
    const resolved = require.resolve(reference, { paths: [process.cwd()] });
    log.debug(`Resolved module '${reference}' to '${resolved}'`);

    return (await import(resolved)).default;
  },
  loadConfig({ defaultPlugins = true }, { log }) {
    const pluginsToLoad = Array.isArray(defaultPlugins)
      ? defaultPlugins
      : defaultPlugins
        ? [
            /* FIXME: 'some', 'defaults' (?) or remove defaultPlugins option */
          ]
        : [];

    return {
      plugins: pluginsToLoad,
      config: {},
    };
  },
});

/** @internal */
type PluginHookPayload = {
  [K in keyof Required<PluginHooks>]: Parameters<Required<PluginHooks>[K]> extends [
    infer P,
    PluginContext,
  ]
    ? P
    : never;
};

type RuntimeDevtoolsConfig = Omit<DevtoolsConfig, 'plugins'> & {
  plugins: Plugin[]; // TODO: {plugin: Plugin, addedBy: Plugin, logger: Logger}[]
};

class Devtools {
  private log = log.child('api');

  private resolvedConfig: RuntimeDevtoolsConfig = { plugins: [corePlugin], config: {} };
  get config() {
    return this.resolvedConfig.config;
  }

  constructor(private readonly _initialConfig: DevtoolsConfig) {
    this.log.trace('Devtools initialized', { initialConfig: _initialConfig });
  }

  private async loadModule<T>(ref: string): Promise<T> {
    const pkgs = await this.getPackages();

    for (const plugin of [...this.resolvedConfig.plugins].reverse()) {
      if (plugin.loadModule) {
        this.log.trace(`Trying to load module ${ref} with plugin ${plugin.name}`);
        const module = await plugin.loadModule<T>(ref, {
          log: pluginLogger.child(plugin.name),
          options: this.resolvedConfig.config[plugin.name] ?? {},
          ...pkgs,
        });

        if (module) {
          return module;
        } else {
          this.log.debug(`Module ${ref} not found in plugin ${plugin.name}`);
        }
      }
    }

    throw new Error(`Module ${ref} not found`);
  }

  // FIXME: Only once!
  async loadPlugins(config: DevtoolsConfig = this._initialConfig) {
    this.log.timing('Starting loadPlugins');

    for (const pluginRef of config.plugins) {
      const name = typeof pluginRef === 'string' ? pluginRef : pluginRef.name;

      if (this.resolvedConfig.plugins.some((p) => p.name === name)) {
        this.log.debug(`Plugin ${name} is already loaded, skipping.`);
        continue;
      }

      const plugin =
        typeof pluginRef === 'string' ? await this.loadModule<Plugin>(pluginRef) : pluginRef;

      this.resolvedConfig.plugins.push(plugin);
      this.log.debug('loaded plugin', { plugin });
    }

    this.log.timing('Finished loadPlugins');
  }

  // FIXME: Only once!
  async loadConfig() {
    this.log.timing('Starting loadConfig');

    const pkgs = await this.getPackages();

    // Load the config from the plugins
    for (const plugin of this.resolvedConfig.plugins) {
      if (plugin.loadConfig) {
        this.log.trace(`Loaded config before plugin ${plugin.name}`, {
          resolvedConfig: this.resolvedConfig,
        });
        const result = await plugin.loadConfig(this.resolvedConfig.config[plugin.name] ?? {}, {
          log: pluginLogger.child(plugin.name),
          options: this.resolvedConfig.config[plugin.name] ?? {},
          ...pkgs,
        });

        if (result) {
          const { plugins, config: remainingConfig } = result;
          this.log.debug(`Loaded config from plugin: ${plugin.name}`, remainingConfig);

          // Merge the loaded config into the resolved config
          deepmergeInto(this.resolvedConfig.config, remainingConfig ?? {});

          if (plugins && plugins.length > 0) {
            this.log.debug(`Loading plugins from ${plugin.name}:`, plugins);
            await this.loadPlugins({ config: {}, plugins: [], ...result });
          }
        } else {
          this.log.warn(`Plugin '${plugin.name}' did not return a config`);
        }
      }
    }

    this.log.timing('Finished loadConfig');
    this.log.debug('Final resolved config:', { config: this.resolvedConfig });

    return this.resolvedConfig;
  }

  private async run<H extends keyof PluginHookPayload>(
    hook: H,
    payload: PluginHookPayload[H],
    context?: Omit<PluginContext, 'log' | 'options'>,
  ): Promise<void> {
    this.log.trace(`Running hook ${hook}`, { payload });

    const baseContext = context ?? (await this.getPackages());

    for (const plugin of this.resolvedConfig.plugins) {
      if (plugin[hook]) {
        this.log.debug(`Running '${hook}' hook for plugin '${plugin.name}'`);
        await plugin[hook](payload, {
          ...baseContext,
          log: pluginLogger.child(plugin.name),
          options: this.resolvedConfig.config[plugin.name] ?? {},
        });
      }
    }

    this.log.debug(`Finished running '${hook}' hook`);
  }

  private async getPackages(): Promise<Packages> {
    const { rootDir, tool, rootPackage: _rootPackage, packages } = await getPackages(process.cwd());

    const rootPackage: Package | undefined = _rootPackage
      ? { isRoot: true, ..._rootPackage }
      : undefined;

    return {
      rootDir,
      tool,
      rootPackage,
      packages: [
        ...(rootPackage ? [rootPackage] : []),
        ...packages.map((pkg) => ({ ...pkg, isRoot: false })),
      ],
    };
  }

  async runSetup() {
    const pkgs = await this.getPackages();
    this.log.debug('Running setup hook for all packages', {
      packages: pkgs.packages.map((p) => p.packageJson.name),
      plugins: this.resolvedConfig.plugins.map((p) => p.name),
    });

    for (const pkg of pkgs.packages) {
      this.log.debug(`Running setup for package: ${pkg.packageJson.name}`);
      await this.run('setupPackage', pkg, pkgs);

      // TODO: Only write package.json if it was modified
      // TODO: Use prettier etc. to format the package.json
      await writeFile(
        join(pkg.dir, 'package.json'),
        JSON.stringify(pkg.packageJson, null, 2) + '\n',
      );
    }
  }
}

export async function toolsync(config: DevtoolsConfig = { plugins: [], config: {} }) {
  log.debug('Creating Devtools instance', { initialConfig: config });

  const instance = new Devtools(config);
  await instance.loadPlugins();

  return instance;
}
