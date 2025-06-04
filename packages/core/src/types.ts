// MARK: Helpers

import type { Plugin } from './plugins.js';

export type MaybePromise<T> = T | Promise<T>;

// MARK: Devtools Types

/** Probably a module loader plugin's package name */
export type LoaderReference = string;

/** A plugin or a plugin's package name or import path */
export type PluginReference = string | Plugin<any>;

/** Configuration for your devtools */
export interface DevtoolsConfig {
  // tools: Record<string, any>;
  // plugins: Plugin[];
  // plugins: Record<string, any>;
  // plugins: Record<string, { reference: PluginReference; get plugin(): MaybePromise<Plugin> }>;
  plugins: PluginReference[];
  config: Record<string, any>;
}
