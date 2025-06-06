import type { Logger } from '@devtools/logger';
import type { DevtoolsConfig, Package, MaybePromise, Packages } from './types.js';

export type PluginContext<Options = {}> = Packages & {
  log: Logger;
  options: Options;
};

export type PluginHooks<Options = {}> = {
  /** The setup hook can be used to set up a tool. It's called for each package in the workspace */
  setupPackage?(pkg: Package, context: PluginContext<Options>): MaybePromise<void>;
};

export type Plugin<Options = {}> = {
  name: string;
  loadModule?<T>(reference: string, context: PluginContext): MaybePromise<T | void>;
  loadConfig?(
    options: Options,
    context: PluginContext,
  ): MaybePromise<Partial<DevtoolsConfig> | void>;
} & PluginHooks<Options>;

export function definePlugin<Options = {}>(plugin: Plugin<Options>) {
  // Plugin definition logic goes here
  return plugin;
}
