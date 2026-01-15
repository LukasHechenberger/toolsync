// export interface EngineTypes {}

import type { EnginePlugin } from './lib/engine';

// MARK: Augmentable types
// These are the types intended to be augmented by plugins

interface PluginMap {
  [pluginName: string]: EnginePlugin;
}

export interface EnginePlugins extends PluginMap {}

// MARK: Helpers

export interface EngineTypesWithPlugins<Plugins extends EnginePlugin> extends EngineTypes {
  plugins: {
    [K in Plugins['pluginName']]: Extract<Plugins, { pluginName: K }>;
  };
}

// MARK: Final types

export interface EngineTypes {
  plugins: { [K in keyof EnginePlugins]: EnginePlugins[K] };
}

// FIXME: Probably not needed

/** The plugins ready to be used (not necessarily all will be used in engine) */
export type RegisteredPlugins = { [K in keyof EnginePlugins]: EnginePlugins[K] };

// MARK: Helpers

export type { EngineTypesFromOptions } from './lib/engine';
