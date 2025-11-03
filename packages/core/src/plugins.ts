import type { Logger } from '@toolsync/logger';
import type { ToolsyncConfig, Package, MaybePromise, Packages } from './types.js';
import type { WithModifiers } from '@toolsync/object-mods';

export type PluginContext<K extends keyof Toolsync.ConfigMap> = Packages & {
  log: Logger;
  options: Toolsync.ConfigMap[K];
};

export type Plugin<K extends keyof Toolsync.ConfigMap> = {
  /** The name of the plugin */
  name: K;
  /** An (optional) description of the plugin */
  description?: string;

  /** Implement this hook if you need to import non-esm modules */
  loadModule?<T>(reference: string, context: PluginContext<K>): MaybePromise<T | void>;

  /** The loadConfig hook is called to load the plugin's configuration and to configure other plugins */
  loadConfig?(
    config: Toolsync.ConfigMap[K],
    context: PluginContext<K>,
  ): MaybePromise<{
    plugins?: ToolsyncConfig['plugins'];
    config?: WithModifiers<ToolsyncConfig['config']>;
  } | void>;

  /** The setup hook can be used to set up a tool. It's called for each package in the workspace */
  setupPackage?(pkg: Package, context: PluginContext<K>): MaybePromise<void>;
};

export function definePlugin<K extends keyof Toolsync.ConfigMap>(plugin: Plugin<K>) {
  return plugin;
}
