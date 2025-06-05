import { writeFile, mkdir } from 'fs/promises';
import YAML from 'yaml';
import { definePlugin } from '@devtools/core/plugins';
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
  name: '@devtools/builtin/github-actions',
  loadConfig: () => ({
    config: {
      ['@devtools/builtin/github-actions']: defaultOptions,
    },
  }),
  async setupPackage(pkg, { log, options }) {
    if (pkg.isRoot) {
      for (const [name, workflow] of Object.entries(options.workflows || {})) {
        const dir = join(pkg.dir, '.github', 'workflows');

        await mkdir(dir, { recursive: true });
        await writeFile(
          join(dir, `${name}.yml`),
          YAML.stringify({
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
                  // FIXME: Add via (private) repo devtools plugin
                  {
                    name: 'Prepare devtools',
                    run: `pnpm install --ignore-scripts && pnpm build`,
                  },
                  {
                    name: 'Install dependencies',
                    run: 'pnpm install',
                  },
                  {
                    name: 'Code Quality Checks',
                    run: 'pnpm turbo format lint check-types test',
                  },
                ],
              },
            },
          }),
        );
      }
    }
  },
});

export default githubActionsPlugin;
