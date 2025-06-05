import { definePlugin } from '@devtools/core/plugins';
import type { DevtoolsConfig } from '@devtools/core/types';

const ignoreSyncPlugin = definePlugin({
  name: 'ignore-sync',
  loadConfig() {
    return {
      config: {
        '@devtools/cli': {
          postinstall: ['ignore-sync .'],
        },
        '@devtools/builtin/vscode': {
          settings: {
            'files.associations': {
              '*-sync': 'ignore',
            },
          },
        },
      },
    };
  },
  setupPackage(pkg, { log }) {
    if (pkg.isRoot) {
      pkg.packageJson.scripts ??= {};
      pkg.packageJson.scripts['ignore-sync'] = 'ignore-sync .';

      pkg.packageJson.devDependencies ??= {};
      pkg.packageJson.devDependencies['ignore-sync'] = '^8.0.0'; // FIXME: Get version from options
    }
  },
});

export default ignoreSyncPlugin;
