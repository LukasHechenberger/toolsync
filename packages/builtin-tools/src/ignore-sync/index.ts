import { definePlugin } from '@devtools/core/plugins';
import { devDependencies } from '../../package.json';

const ignoreSyncPlugin = definePlugin<{
  /** Version of ignore-sync to install. */
  version?: string;
}>({
  name: 'ignore-sync',
  loadConfig() {
    return {
      config: {
        '@devtools/cli': {
          prepare: ['ignore-sync .'],
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
  setupPackage(pkg, { log, options }) {
    if (pkg.isRoot) {
      pkg.packageJson.scripts ??= {};
      pkg.packageJson.scripts['ignore-sync'] = 'ignore-sync .';

      pkg.packageJson.devDependencies ??= {};
      pkg.packageJson.devDependencies['ignore-sync'] =
        options.version || devDependencies['ignore-sync'];
    }
  },
});

export default ignoreSyncPlugin;
