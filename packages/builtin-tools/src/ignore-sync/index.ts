import { devDependencies } from '../../package.json';
import { defineBuiltinPlugin } from '../lib/plugins';

const ignoreSyncPlugin = defineBuiltinPlugin<{
  /** Version of ignore-sync to install. */
  version?: string;
}>({
  name: '@toolsync/builtin/ignore-sync',
  description: `Integrates the 'ignore-sync' tool to manage .gitignore, .prettierignore, etc. files across multiple directories.`,
  loadConfig() {
    return {
      config: {
        '@toolsync/cli': {
          prepare: ['ignore-sync .'],
        },
        '@toolsync/builtin/vscode': {
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
