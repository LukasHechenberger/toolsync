import type { Package as ToolsPackage, Packages as ToolsPackages } from '@manypkg/get-packages';
import type { Plugin } from './plugins.js';

// MARK: Helpers

export type MaybePromise<T> = T | Promise<T>;

// MARK: Devtools Types

/** Probably a module loader plugin's package name */
export type LoaderReference = string;

/** A plugin or a plugin's package name or import path */
export type PluginReference = string | Plugin<any>;

/** Configuration for your devtools */
export interface DevtoolsConfig {
  plugins: PluginReference[];
  config: Record<string, any>;
}

declare module '@manypkg/tools' {
  interface PackageJSON {
    /** Package scripts */
    scripts?: Record<string, string>;

    /** Package Manager [corepack](https://github.com/nodejs/corepack) should use */
    packageManager?: string;
  }
}

/** A package inside the current project */
export interface Package extends ToolsPackage {
  isRoot: boolean;
}

/** A package inside the current project */
export interface Packages extends ToolsPackages {
  rootPackage?: Package;
  packages: Package[];
}
