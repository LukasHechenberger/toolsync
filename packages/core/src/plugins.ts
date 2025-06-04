import type { Logger } from '@devtools/logger';
import type { DevtoolsConfig, LoaderReference, MaybePromise } from './types.js';

export interface PluginContext {
  log: Logger;
}

export type Plugin<Options = {}> = {
  name: string;
  loadModule?<T>(reference: string): MaybePromise<T | void>;

  loadConfig?(options: Options, context: PluginContext): MaybePromise<DevtoolsConfig | void>;

};

export function definePlugin<Options = {}>(plugin: Plugin<Options>) {
  // Plugin definition logic goes here
  return plugin;
}
