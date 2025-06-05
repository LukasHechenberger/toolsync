import { mkdir, writeFile } from 'fs/promises';
import { definePlugin } from '@devtools/core/plugins';
import type { DevtoolsConfig } from '@devtools/core/types';
import { join } from 'path';

const vscodePlugin = definePlugin<{ settings: Record<string, any> }>({
  name: '@devtools/builtin/vscode',
  async setupPackage(pkg, { log, options }) {
    if (pkg.isRoot) {
      if (options.settings) {
        await mkdir(join(pkg.dir, '.vscode'), { recursive: true });
        await writeFile(
          join(pkg.dir, '.vscode/settings.json'),
          `${JSON.stringify(options.settings, null, 2)}\n`
        );
      } else {
        log.debug('No VSCode settings provided, skipping .vscode/settings.json creation');
        // TODO: Remove existing .vscode/settings.json if it exists
      }
    }
  },
});

export default vscodePlugin;
