import setupDebug from 'debug';
import type { DevtoolsConfig } from './types.js';
import { definePlugin, type Plugin } from './plugins.js';

const debug = setupDebug('devtools:core');

const corePlugin = definePlugin({
  name: '@devtools/core',
  async loadModule(reference: string) {
    debug(`Loading module ${reference} as a node module`);
    return await import(reference);
  },
  loadConfig() {
    return {
      plugins: [],
      config: {},
    };
  },
});

type RuntimeDevtoolsConfig = Omit<DevtoolsConfig, 'plugins'> & {
  plugins: Plugin[];
};

class Devtools {
  private debug = debug.extend('api');
  private _resolvedConfig: RuntimeDevtoolsConfig = { plugins: [corePlugin], config: {} };

  constructor(private readonly _initialConfig: DevtoolsConfig) {
    this.debug('Devtools initialized with config:', _initialConfig);
  }

  private async loadModule<T>(ref: string): Promise<T> {
    for (const plugin of [...this._resolvedConfig.plugins].reverse()) {
      if (plugin.loadModule) {
        this.debug(`Trying to load module ${ref} with plugin ${plugin.name}`);
        const module = await plugin.loadModule<T>(ref);

        if (module) {
          return module;
        } else {
          console.warn(`Module ${ref} not found in plugin ${plugin.name}`);
        }
      }
    }

    throw new Error(`Module ${ref} not found`);
  }

  // FIXME: Only once!
  async loadPlugins(config: DevtoolsConfig = this._initialConfig) {
    for (const pluginRef of config.plugins) {
      const plugin =
        typeof pluginRef === 'string' ? await this.loadModule<Plugin>(pluginRef) : pluginRef;

      if (this._resolvedConfig.plugins.some((p) => p.name === plugin.name)) {
        this.debug(`Plugin ${plugin.name} is already loaded, skipping.`);
        continue;
      }

      this._resolvedConfig.plugins.push(plugin);
      this.debug('loaded plugin:', plugin);
    }
  }

  // FIXME: Only once!
  async loadConfig() {
    // Load the config from the plugins
    for (const plugin of this._resolvedConfig.plugins) {
      if (plugin.loadConfig) {
        this.debug(`Loaded config before plugin ${plugin.name}`, this._resolvedConfig);
        const result = await plugin.loadConfig(this._resolvedConfig.config[plugin.name]);
        if (result) {
          const { plugins, config: remainingConfig } = result;
          this.debug(`Loaded config from plugin: ${plugin.name}`, remainingConfig);

          // Merge the loaded config into the resolved config
          Object.assign(this._resolvedConfig.config, remainingConfig);

          if (plugins && plugins.length > 0) {
            this.debug(`Loading plugins from ${plugin.name}:`, plugins);
            await this.loadPlugins(result);
          }
        }
      }
    }

    debug('Final resolved config:', this._resolvedConfig);
  }
}

export async function devtools(config: DevtoolsConfig = { plugins: [], config: {} }) {
  // console.dir({ initialConfig: config }, { depth: null, colors: true });

  const instance = new Devtools(config);
  await instance.loadPlugins();

  return instance;
}
