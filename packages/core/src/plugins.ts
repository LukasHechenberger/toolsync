import type { Logger } from '@devtools/logger';
import type { DevtoolsConfig, Package, MaybePromise } from './types.js';

export interface PluginContext {
  // rootDir: string;
  log: Logger;
}

export type PluginHooks = {
  /** The setup hook can be used to set up a tool. It's called for each package in the workspace */
  setupPackage?(pkg: Package, context: PluginContext): MaybePromise<void>;
};

export type Plugin<Options = {}> = {
  name: string;
  loadModule?<T>(reference: string, context: PluginContext): MaybePromise<T | void>;
  loadConfig?(options: Options, context: PluginContext): MaybePromise<DevtoolsConfig | void>;
} & PluginHooks;

export function definePlugin<Options = {}>(plugin: Plugin<Options>) {
  // Plugin definition logic goes here
  return plugin;
}
