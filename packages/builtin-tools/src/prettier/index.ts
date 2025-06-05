import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { definePlugin } from '@devtools/core/plugins';
import { devDependencies } from '../../package.json';

export const defaultSettings = { singleQuote: true, printWidth: 100 };

const prettierPlugin = definePlugin<{ version?: string; settings: Record<string, any> }>({
  name: '@devtools/builtin/prettier',
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
      pkg.packageJson.scripts['format'] = 'prettier --write .';

      pkg.packageJson.devDependencies ??= {};
      pkg.packageJson.devDependencies['prettier'] = options.version || devDependencies['prettier'];

      await writeFile(
        join(pkg.dir, '.prettierrc.json'),
        `${JSON.stringify(options.settings ?? defaultSettings, null, 2)}\n`,
      );
    }
  },
});

export default prettierPlugin;
