import { getConfiguredPackageManagerVersion } from '../lib/package-manager';
import { defineBuiltinPlugin } from '../lib/plugins';

const pluginName = '@toolsync/builtin/pnpm';
const defaultPackageManager = 'pnpm@10.11.1';

declare global {
  namespace Toolsync {
    interface ConfigMap {
      [pluginName]: {
        /** Version of pnpm to use */
        version?: string;
      };
    }
  }
}

const pnpmPlugin = defineBuiltinPlugin({
  name: pluginName,
  description:
    'Integrates with the pnpm package manager, setting up the root package.json with the specified version.',
  loadConfig(config, { rootPackage, log }) {
    let version = config.version;

    // Detect version from packageManager field in root package.json
    version ??= getConfiguredPackageManagerVersion('pnpm', defaultPackageManager, rootPackage);
    log.debug(`Using pnpm version: ${version}`);

    return {
      config: {
        '@toolsync/builtin/pnpm': {
          version,
        },
        '@toolsync/builtin/github-actions': {
          workflows: {
            ci: {
              jobs: {
                build: {
                  steps: [
                    { '@insert': { before: 'setup-node', data: { uses: 'pnpm/action-setup@v4' } } },
                    { '@update': { id: 'setup-node', data: { with: { cache: 'pnpm' } } } },
                    { '@update': { id: 'install', data: { run: 'pnpm install' } } },
                  ],
                },
              },
            },
          },
        },
        '@toolsync/builtin/vscode': {
          settings: {
            'search.exclude': {
              '**/pnpm-lock*.yaml': true,
            },
          },
        },
      },
    };
  },
  setupPackage(pkg, { options }) {
    if (pkg.isRoot) {
      pkg.packageJson.packageManager = `pnpm@${options.version}`;
    }
  },
});

export default pnpmPlugin;
