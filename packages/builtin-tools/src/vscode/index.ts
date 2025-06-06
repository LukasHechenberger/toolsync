import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { defineBuiltinPlugin } from '../lib/plugins';

const vscodePlugin = defineBuiltinPlugin<{
  settings?: Record<string, any>;
  extensions?: { recommendations?: string[] };
}>({
  name: '@toolsync/builtin/vscode',
  description: 'Integrates with Visual Studio Code for settings and extensions management',
  async setupPackage(pkg, { log, options }) {
    if (pkg.isRoot) {
      if (options.settings || options.extensions) {
        await mkdir(join(pkg.dir, '.vscode'), { recursive: true });
      }

      if (options.settings) {
        await writeFile(
          join(pkg.dir, '.vscode/settings.json'),
          `${JSON.stringify(options.settings, null, 2)}\n`,
        );
      } else {
        log.debug('No VSCode settings provided, skipping .vscode/settings.json creation');
        // TODO: Remove existing .vscode/settings.json if it exists
      }

      if (options.extensions) {
        await writeFile(
          join(pkg.dir, '.vscode/extensions.json'),
          `${JSON.stringify(options.extensions, null, 2)}\n`,
        );
      } else {
        log.debug('No VSCode extensions provided, skipping .vscode/extensions.json creation');
        // TODO: Remove existing .vscode/extensions.json if it exists
      }
    }
  },
});

export default vscodePlugin;
