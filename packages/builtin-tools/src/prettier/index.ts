import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { definePlugin } from '@devtools/core/plugins';
import { devDependencies } from '../../package.json';

export const defaultSettings = { singleQuote: true, printWidth: 100 };

const pluginName = '@devtools/builtin/prettier';

const prettierPlugin = definePlugin<{
  version?: string;
  scriptName?: string;
  settings?: Record<string, any>;
}>({
  name: pluginName,
  loadConfig() {
    return {
      config: {
        '@devtools/builtin/vscode': {
          extensions: {
            recommendations: ['esbenp.prettier-vscode'],
          },
        },
      },
    };
  },
  async setupPackage(pkg, { log, options }) {
    if (pkg.isRoot) {
      pkg.packageJson.scripts ??= {};
      pkg.packageJson.scripts[options.scriptName ?? 'format'] =
        '[ \"${CI+z}\" ] && prettier --check . || prettier --write .';

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
