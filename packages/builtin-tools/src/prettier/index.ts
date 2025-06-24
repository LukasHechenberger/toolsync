import { writeFile } from 'fs/promises';
import { join } from 'path';
import { devDependencies } from '../../package.json';
import { defineBuiltinPlugin } from '../lib/plugins';
import { vscodePluginName } from '../vscode';
import { turboPluginName } from '../turbo';

export const defaultSettings = { singleQuote: true, printWidth: 100 };

const pluginName = '@toolsync/builtin/prettier';

declare global {
  namespace Toolsync {
    export interface ConfigMap {
      [pluginName]: {
        /** The version of prettier to use. */
        version?: string;
        /** By default, a "format" script is set up to run `prettier --write` and a "check" script to run `prettier --check`.
         * @default { write: 'format', check: 'check:format' }
         * @see https://prettier.io/docs/options */
        scriptName?: Partial<{ write: string; check: string }>;
        /** Your prettier settings.
         * @default { singleQuote: true, printWidth: 100 }
         */
        settings?: Record<string, any>;
      };
    }
  }
}

const prettierPlugin = defineBuiltinPlugin({
  name: pluginName,
  description: 'Integrates with Prettier for code formatting',
  loadConfig(c) {
    return {
      config: {
        [vscodePluginName]: {
          extensions: {
            recommendations: ['esbenp.prettier-vscode'],
          },
        },
        [turboPluginName]: {
          tasks: {
            '//#check:format': {},
            check: {
              dependsOn: ['//#check:format'],
            },
          },
        },
      },
    };
  },
  async setupPackage(pkg, { log, options }) {
    if (pkg.isRoot) {
      pkg.packageJson.scripts ??= {};
      pkg.packageJson.scripts[options.scriptName?.write ?? 'format'] = 'prettier --write .';
      pkg.packageJson.scripts[options.scriptName?.check ?? 'check:format'] = 'prettier --check .';

      // FIXME: Move to install action
      pkg.packageJson.devDependencies ??= {};
      pkg.packageJson.devDependencies['prettier'] = options.version || devDependencies['prettier'];

      await writeFile(
        join(pkg.dir, '.prettierrc.json'),
        // TODO: Deep merge with default settings
        `${JSON.stringify(options.settings ?? defaultSettings, null, 2)}\n`,
      );

      // TODO: Add .prettierrc.json to gitignore
    }
  },
});

export default prettierPlugin;
