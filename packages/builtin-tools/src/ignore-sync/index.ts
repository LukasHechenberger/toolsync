import { devDependencies } from '../../package.json';
import { defineBuiltinPlugin } from '../lib/plugins';
import { vscodePluginName } from '../vscode';

const pluginName = '@toolsync/builtin/ignore-sync';

declare global {
  namespace Toolsync {
    interface ConfigMap {
      [pluginName]: {
        /** Version of ignore-sync to install. */
        version?: string;
      };
    }
  }
}

const ignoreSyncPlugin = defineBuiltinPlugin({
  name: pluginName,
  description: `Integrates the 'ignore-sync' tool to manage .gitignore, .prettierignore, etc.`,
  loadConfig() {
    return {
      config: {
        '@toolsync/cli': {
          prepare: ['ignore-sync .'],
        },
        [vscodePluginName]: {
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
