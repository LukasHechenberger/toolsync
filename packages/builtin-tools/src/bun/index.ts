import { packageManager as defaultPackageManager } from '../../../../package.json';
import { getConfiguredPackageManagerVersion } from '../lib/package-manager';
import { defineBuiltinPlugin } from '../lib/plugins';

export const bunPluginName = '@toolsync/builtin/bun';

declare global {
  namespace Toolsync {
    interface ConfigMap {
      [bunPluginName]: {
        /** Version of bun to use */
        version?: string;
      };
    }
  }
}

const bunPlugin = defineBuiltinPlugin({
  name: bunPluginName,
  description: 'Use bun as a package manager',
  loadConfig(config, { rootPackage, log }) {
    let version = config.version;

    // Detect version from packageManager field in root package.json
    version ??= getConfiguredPackageManagerVersion('bun', defaultPackageManager, rootPackage);
    log.debug(`Using bun version: ${version}`);

    return {
      config: {
        [bunPluginName]: {
          version,
        },
        '@toolsync/builtin/github-actions': {
          workflows: {
            ci: {
              jobs: {
                build: {
                  steps: [
                    {
                      '@update': {
                        id: 'setup-node',
                        name: 'Setup Bun',
                        data: {
                          uses: 'oven-sh/setup-bun@v2',
                          name: 'Setup Bun',
                          with: {
                            'node-version': undefined,
                            'bun-version': version,
                          },
                        },
                      },
                    },
                    { '@update': { id: 'install', data: { run: 'bun install' } } },
                    {
                      '@update': {
                        id: 'checks',
                        data: {
                          run: 'bun --bun turbo check lint test build --continue',
                        },
                      },
                    },
                    {
                      '@update': {
                        id: 'changesets',
                        data: { with: { publish: 'bun changeset publish' } },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
        '@toolsync/builtin/vscode': {
          settings: {
            'search.exclude': {
              '**/bun.lockb?': true,
            },
          },
        },
      },
    };
  },
  setupPackage(pkg, { options }) {
    if (pkg.isRoot) {
      pkg.packageJson.packageManager = `bun@${options.version}`;
    }
  },
});

export default bunPlugin;
