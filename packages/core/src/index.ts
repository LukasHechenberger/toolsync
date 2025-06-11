import { logger } from '@toolsync/logger';
import type { ToolsyncConfig, Package, Packages } from './types';
import { definePlugin, type Plugin, type PluginContext } from './plugins';
import { getPackages as _getPackages } from '@manypkg/get-packages';
import { createRequire } from 'module';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { modify } from '@toolsync/object-mods';

type FullyImplementedPlugin<K extends keyof Toolsync.ConfigMap = keyof Toolsync.ConfigMap> =
  Required<Plugin<K>>;
type PluginHooks = Omit<FullyImplementedPlugin, 'name' | 'description'>;

const log = logger.child('core');
const pluginLogger = logger.child('plugin');

log.debug('Debug logging is enabled');
log.debug('Toolsync Core initialized');

const require = global.require ?? createRequire(import.meta.url);

declare global {
  namespace Toolsync {
    interface ConfigMap {
      '@toolsync/core': {
        defaultPlugins?: boolean | string[];
      };
    }
  }
}

const corePlugin = definePlugin({
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
  [KK in keyof PluginHooks]: Parameters<PluginHooks[KK]> extends [
    infer P,
    PluginContext<keyof Toolsync.ConfigMap>,
  ]
    ? P
    : never;
};

type RuntimeToolsyncConfig = Omit<ToolsyncConfig, 'plugins'> & {
  plugins: Plugin<keyof Toolsync.ConfigMap>[]; // TODO: {plugin: Plugin, addedBy: Plugin, logger: Logger}[]
};

export async function getPackages(): Promise<Packages> {
  const { rootDir, tool, rootPackage: _rootPackage, packages } = await _getPackages(process.cwd());

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

class Toolsync {
  private log = log.child('api');

  private resolvedConfig: RuntimeToolsyncConfig = { plugins: [corePlugin], config: {} };
  get config() {
    return this.resolvedConfig.config;
  }

  constructor(private readonly _initialConfig: ToolsyncConfig) {
    this.log.trace('Toolsync initialized', { initialConfig: _initialConfig });
  }

  private async loadModule<T>(ref: string): Promise<T> {
    const pkgs = await getPackages();

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
  async loadPlugins(config: ToolsyncConfig = this._initialConfig) {
    this.log.timing('Starting loadPlugins');

    for (const pluginRef of config.plugins) {
      const name = typeof pluginRef === 'string' ? pluginRef : pluginRef.name;

      if (this.resolvedConfig.plugins.some((p) => p.name === name)) {
        this.log.debug(`Plugin ${name} is already loaded, skipping.`);
        continue;
      }

      const plugin =
        typeof pluginRef === 'string'
          ? await this.loadModule<Plugin<keyof Toolsync.ConfigMap>>(pluginRef)
          : pluginRef;

      this.resolvedConfig.plugins.push(plugin);
      this.log.debug('loaded plugin', { plugin });
    }

    this.log.timing('Finished loadPlugins');
  }

  // FIXME: Only once!
  async loadConfig() {
    this.log.timing('Starting loadConfig');

    const pkgs = await getPackages();

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
          modify(this.resolvedConfig.config, remainingConfig ?? {});

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

  private async run<H extends keyof PluginHooks>(
    hook: H,
    payload: PluginHookPayload[H],
    context?: Omit<PluginContext<keyof Toolsync.ConfigMap>, 'log' | 'options'>,
  ): Promise<void> {
    this.log.trace(`Running hook ${hook}`, { payload });

    const baseContext = context ?? (await getPackages());

    for (const plugin of this.resolvedConfig.plugins) {
      if (plugin[hook]) {
        this.log.debug(`Running '${hook}' hook for plugin '${plugin.name}'`);
        await plugin[hook](payload as any, {
          ...baseContext,
          log: pluginLogger.child(plugin.name),
          options: this.resolvedConfig.config[plugin.name] ?? {},
        });
      }
    }

    this.log.debug(`Finished running '${hook}' hook`);
  }

  async runSetup() {
    const pkgs = await getPackages();
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

export async function toolsync(config: ToolsyncConfig = { plugins: [], config: {} }) {
  log.debug('Creating Toolsync instance', { initialConfig: config });

  const instance = new Toolsync(config);
  await instance.loadPlugins();

  return instance;
}
