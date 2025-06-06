import { writeFile, mkdir } from 'fs/promises';
import YAML from 'yaml';
import { definePlugin } from '@toolsync/core/plugins';
import { join } from 'path';

interface GithubActionsWorkflowStepOptions {
  id?: string;
  name: string;
  uses?: string;
  with?: Record<string, any>;
  run: string;
}

interface GithubActionsWorkflowOptions {
  name: string;
  steps: GithubActionsWorkflowStepOptions[];
}

interface GithubActionsPluginOptions {
  workflows?: Record<string, GithubActionsWorkflowOptions>;
}

export const defaultOptions = {
  workflows: {
    ci: {
      name: 'CI',
      steps: [],
    },
  },
} satisfies GithubActionsPluginOptions;

const githubActionsPlugin = definePlugin<GithubActionsPluginOptions>({
  name: '@toolsync/builtin/github-actions',
  loadConfig: () => ({
    config: {
      ['@toolsync/builtin/github-actions']: defaultOptions,
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
          YAML.stringify(
            {
              // FIXME: Insert remaining options, like additional jobs, etc.
              name: workflow.name,
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
                      uses: 'pnpm/action-setup@v4',
                    },
                    {
                      name: 'Setup Node.js environment',
                      uses: 'actions/setup-node@v4',
                      with: {
                        'node-version': 22,
                        cache: 'pnpm',
                      },
                    },
                    // FIXME: Add via (private) repo toolsync plugin
                    {
                      name: 'Prepare toolsync',
                      run: `pnpm install --ignore-scripts && pnpm build`,
                    },
                    {
                      name: 'Install dependencies',
                      run: 'pnpm install',
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
                        version: 'npm run changeset:version',
                        publish: 'npm run changeset:publish',
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
            {
              // TODO: Get from prettier settings
              singleQuote: true,
            },
          ),
        );
      }
    }
  },
});

export default githubActionsPlugin;
