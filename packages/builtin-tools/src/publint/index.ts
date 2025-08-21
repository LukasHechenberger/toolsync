import { defineBuiltinPlugin } from '../lib/plugins';
import { turboPluginName } from '../turbo';
import { devDependencies } from '../../package.json';
import { vscodePluginName } from '../vscode';

const pluginName = '@toolsync/builtin/publint';

declare global {
  namespace Toolsync {
    interface ConfigMap {
      [pluginName]: {
        /** The version of prettier to use. */
        version?: string;
      };
    }
  }
}

const publintPlugin = defineBuiltinPlugin({
  name: pluginName,
  description: 'Validate package exports with publint',
  loadConfig() {
    return {
      config: {
        [vscodePluginName]: {
          extensions: {
            recommendations: ['kravets.vscode-publint'],
          },
        },
        [turboPluginName]: {
          tasks: {
            'check:exports': {
              dependsOn: ['build'],
            },
            check: {
              dependsOn: ['check:exports'],
            },
          },
        },
      },
    };
  },
  async setupPackage(pkg, { options }) {
    if (pkg.isRoot) return;

    if (pkg.packageJson.private) {
      delete pkg.packageJson.scripts?.['check:exports'];
      delete pkg.packageJson.devDependencies?.['publint'];
    } else {
      pkg.packageJson.scripts ??= {};
      pkg.packageJson.scripts['check:exports'] = 'publint';

      // FIXME: Move to install action
      pkg.packageJson.devDependencies ??= {};
      pkg.packageJson.devDependencies['publint'] = options.version || devDependencies['publint'];
    }
  },
});

export default publintPlugin;
