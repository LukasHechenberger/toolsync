import { writeFile } from 'fs/promises';
import { defineBuiltinPlugin } from '../lib/plugins';
import type { BaseSchema, PipelineV2 } from '@turbo/types';
import { join } from 'path';

export const turboPluginName = '@toolsync/builtin/turbo';

declare global {
  namespace Toolsync {
    interface ConfigMap {
      [turboPluginName]: BaseSchema & {
        /** @default {false} */
        remoteCaching: boolean;
      };
    }
  }
}

const turboPlugin = defineBuiltinPlugin({
  name: turboPluginName,
  description: 'Integrates with Turborepo',
  loadConfig(config) {
    return {
      config: {
        [turboPluginName]: {
          $schema: 'https://turbo.build/schema.json',
          ui: 'tui',
          tasks: {
            build: {
              dependsOn: ['^build'],
              inputs: ['$TURBO_DEFAULT$', '.env*'],
              outputs: ['.next/**', '!.next/cache/**', 'out/**'],
            },
            dev: {
              cache: false,
              persistent: true,
            },
            lint: {
              dependsOn: ['^lint'],
            },
            'check:types': {
              dependsOn: ['^check:types'],
            },
            check: {
              dependsOn: ['check:types'],
            },
            test: {
              outputs: [],
              dependsOn: ['test:transit'],
            },
            'test:transit': {
              dependsOn: ['^test:transit'],
            },
          },
        },
        ...(config.remoteCaching
          ? {
              '@toolsync/builtin/github-actions': {
                workflows: {
                  ci: {
                    jobs: {
                      build: {
                        env: {
                          TURBO_TEAM: '${{ vars.TURBO_TEAM }}',
                          TURBO_TOKEN: '${{ secrets.TURBO_TOKEN }}',
                        },
                      },
                    },
                  },
                },
              },
            }
          : {}),
      },
    };
  },
  async setupPackage(pkg, { options: { remoteCaching, ...options }, log }) {
    if (pkg.isRoot) {
      await writeFile(join(pkg.dir, 'turbo.json'), JSON.stringify(options, undefined, 2));

      const rootTasks = Object.keys(options.tasks).filter((t) => !t.includes(':'));
      log.debug(`Adding root tasks as workspace scripts: ${rootTasks.join(', ')}`);

      pkg.packageJson.scripts ??= {};
      for (const task of rootTasks) {
        pkg.packageJson.scripts[task] = `turbo run ${task}`;
      }
    }

    // TODO [>=1.0.0]: Handle package-specific tasks
    // else { ... }
  },
});

export default turboPlugin;
