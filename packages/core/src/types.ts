import type { Package as ToolsPackage, Packages as ToolsPackages } from '@manypkg/get-packages';
import type { Plugin } from './plugins.js';

// MARK: Helpers

export type MaybePromise<T> = T | Promise<T>;

// MARK: Toolsync Types

/** Probably a module loader plugin's package name */
export type LoaderReference = string;

/** A plugin or a plugin's package name or import path */
export type PluginReference = string | Plugin<keyof Toolsync.ConfigMap>;

interface PluginConfigMap {
  // intentionally empty
}

declare global {
  namespace Toolsync {
    interface ConfigMap extends PluginConfigMap {}
  }
}

/** Configuration for your toolsync project */
export interface ToolsyncConfig {
  plugins: PluginReference[];
  config: {
    [K in keyof Toolsync.ConfigMap]?: Toolsync.ConfigMap[K];
  };
}

type ExportString = `./${string}`;

declare module '@manypkg/tools' {
  interface PackageJSON {
    /** Optional description of the package */
    description?: string;

    /** License of the package */
    license?: string;

    /** Project homepage */
    homepage?: string;

    repository?: /** @deprecated  */
    | string
      | {
          type: string;
          url: string;
          directory?: string;
        };

    /** Package scripts */
    scripts?: Record<string, string>;

    engines?: Record<string, string>;

    /** Package Manager [corepack](https://github.com/nodejs/corepack) should use */
    packageManager?: string;

    /** Entry points for a package @see https://nodejs.org/api/packages.html#package-entry-points */
    exports?:
      | ExportString
      | Record<'.' | ExportString, ExportString | null | Record<string, ExportString | null>>;
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
