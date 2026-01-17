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
        /** Pass `true` or an explicit version to also setup Node.js (e.g. for integration tests) */
        setupNode?: boolean | string;
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

    const setupBunStep = {
      id: 'setup-bun',
      name: 'Setup Bun',
      uses: 'oven-sh/setup-bun@v2',
      // Bun version is detected from package.json, no need to specify here
      with: undefined,
    };

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
                    ...(config.setupNode
                      ? [
                          { '@insert': { before: 'setup-node', data: setupBunStep } },
                          ...(typeof config.setupNode === 'string'
                            ? [
                                {
                                  '@update': {
                                    id: 'setup-node',
                                    data: { with: { 'node-version': config.setupNode } },
                                  },
                                },
                              ]
                            : []),
                        ]
                      : [{ '@update': { id: 'setup-node', data: setupBunStep } }]),

                    { '@update': { id: 'install', data: { run: 'bun install' } } },
                    {
                      '@update': {
                        id: 'checks',
                        data: {
                          run: 'bun turbo check lint test build --continue',
                        },
                      },
                    },
                    {
                      '@update': {
                        id: 'changesets',
                        data: {
                          with: {
                            publish: 'bun run changesets:publish',
                            version: 'bun run changesets:version',
                          },
                          env: {
                            NPM_CONFIG_TOKEN: '${{ secrets.NPM_TOKEN }}',
                          },
                        },
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
              '**/bun.lock': true,
              '**/bun.lockb': true,
            },
          },
        },
      },
    };
  },
  setupPackage(pkg, { options }) {
    if (pkg.isRoot) {
      pkg.packageJson.packageManager = `bun@${options.version}`;
      pkg.packageJson.scripts ??= {};

      // TODO: Move to changesets plugin
      pkg.packageJson.scripts['changesets:publish'] =
        'for dir in packages/*; do (cd "$dir" && bun publish || exit 0); done && changeset tag';
      pkg.packageJson.scripts['changesets:version'] = 'changeset version && bun install';
    }
  },
});

export default bunPlugin;
