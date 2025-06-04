import type { DevtoolsConfig, LoaderReference, MaybePromise } from './types.js';

export interface PluginContext {
  rootDir: string;
}

export type Plugin<Options = {}> = {
  name: string;
  loadModule?<T>(reference: string): MaybePromise<T | void>;

  loadConfig?(options: Options): MaybePromise<DevtoolsConfig | void>;

  /** Inside the 'config' hook you can manipulate the incoming config */
  config?(
    incomingConfig: Options,
    context: PluginContext
  ): {} extends Options ? void : MaybePromise<Options>;
};

export function definePlugin<Options = {}>(plugin: Plugin<Options>) {
  // Plugin definition logic goes here
  return plugin;
}
