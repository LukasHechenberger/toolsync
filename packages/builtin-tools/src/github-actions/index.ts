import { writeFile, mkdir } from 'fs/promises';
import YAML from 'yaml';
import { definePlugin } from '@toolsync/core/plugins';
import { join } from 'path';

interface GithubActionsWorkflowStepOptions {
  id?: string;
  if?: string;
  name?: string;
  uses?: string;
  with?: Record<string, any>;
  run?: string;
  env?: Record<string, string>;
}

interface GithubActionsJobOptions {
  name?: string;
  'timeout-minutes'?: number;
  'runs-on': string;
  env?: Record<string, string>;
  steps: GithubActionsWorkflowStepOptions[];
}

interface GithubActionsWorkflowOptions {
  name: string;
  on: string[] | Record<string, any>;
  jobs: Record<string, GithubActionsJobOptions>;
}

interface GithubActionsPluginOptions {
  workflows?: Record<string, GithubActionsWorkflowOptions>;
}

export const defaultOptions = {
  workflows: {
    ci: {
      name: 'CI',
      on: ['push'],
      jobs: {
        build: {
          name: 'Code Quality',
          'timeout-minutes': 15,
          'runs-on': 'ubuntu-latest',
          env: {
            DO_NOT_TRACK: '1',
          },
          steps: [
            {
              name: 'Check out code',
              uses: 'actions/checkout@v4',
              with: {
                'fetch-depth': 2,
                lfs: true,
              },
            },
            {
              id: 'setup-node',
              name: 'Setup Node.js environment',
              uses: 'actions/setup-node@v4',
              with: {
                'node-version': 22,
              },
            },
            {
              id: 'install',
              name: 'Install dependencies',
              // NOTE: run is set by e.g. pnpm plugin
            },
            {
              name: 'Code Quality Checks',
              run: 'pnpm turbo check lint check-types test build',
            },
            {
              name: 'Ensure there are no uncommitted changes',
              run: 'git diff --exit-code || (echo "There are uncommitted changes!" && exit 1)',
            },
            {
              if: 'github.ref_name == github.event.repository.default_branch',
              name: 'Changesets',
              uses: 'changesets/action@v1',
              with: {
                commit: 'chore: Update versions',
                title: 'chore: Update versions',
                publish: 'pnpm changeset publish',
              },
              env: {
                GITHUB_TOKEN: '${{ secrets.GITHUB_TOKEN }}',
                NPM_TOKEN: '${{ secrets.NPM_TOKEN }}',
              },
            },
          ],
        },
      },
    },
  },
} satisfies GithubActionsPluginOptions;

const pluginName = '@toolsync/builtin/github-actions';

declare global {
  namespace Toolsync {
    interface ConfigMap {
      [pluginName]: GithubActionsPluginOptions;
    }
  }
}

const githubActionsPlugin = definePlugin({
  name: pluginName,
  loadConfig: () => ({
    config: {
      '@toolsync/builtin/github-actions': defaultOptions,
      '@toolsync/builtin/vscode': {
        extensions: {
          recommendations: ['github.vscode-github-actions'],
        },
      },
    },
  }),
  async setupPackage(pkg, { log, options }) {
    if (pkg.isRoot) {
      for (const [name, workflow] of Object.entries(options.workflows || {})) {
        const dir = join(pkg.dir, '.github', 'workflows');

        await mkdir(dir, { recursive: true });
        // TODO: Update if file already exists
        await writeFile(
          join(dir, `${name}.yml`),
          YAML.stringify(workflow, {
            // TODO: Get from prettier settings
            singleQuote: true,
          }),
        );
      }
    }
  },
});

export default githubActionsPlugin;
