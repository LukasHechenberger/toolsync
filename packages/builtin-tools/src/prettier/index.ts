import { writeFile } from 'fs/promises';
import { join } from 'path';
import { devDependencies } from '../../package.json';
import { defineBuiltinPlugin } from '../lib/plugins';

export const defaultSettings = { singleQuote: true, printWidth: 100 };

const pluginName = '@toolsync/builtin/prettier';

const prettierPlugin = defineBuiltinPlugin<{
  version?: string;
  scriptName?: Partial<{ write: string; check: string }>;
  settings?: Record<string, any>;
}>({
  name: pluginName,
  description: 'Integrates with Prettier for code formatting',
  loadConfig() {
    return {
      config: {
        '@toolsync/builtin/vscode': {
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
