import { logger } from '@toolsync/logger';
import type { Command } from 'commander';
import nodePlop, { type PromptQuestion } from 'node-plop';
import { getPackages } from '@toolsync/core';
import tools from '@toolsync/builtin/tools.json';

const log = logger.child('cli:init');

export function setupInitCommand(command: Command) {
  return command
    .option('-y, --yes', 'accept all default options', false)
    .option('-f, --force', 'overwrite existing files etc.', false)
    .action(async ({ yes, force }) => {
      log.debug('Running plop');

      const { rootDir } = await getPackages();

      const plop = await nodePlop(undefined, { destBasePath: rootDir, force });

      const prompts = [
        {
          type: 'checkbox',
          name: 'plugins',
          message: 'Which builtin plugins do you want to use?',
          // TODO: Inherit from existing toolsync.json
          default: tools.map((t) => t.name),
          choices: tools.map((t) => ({
            name: `${t.slug} - ${t.description}`,
            value: t.name,
            short: t.slug,
          })),
        },
      ] satisfies (PromptQuestion & { name: string })[];

      const init = plop.setGenerator('init', {
        prompts,
        actions: [
          {
            type: 'add',
            path: 'toolsync.json',
            transform(_, data) {
              return `${JSON.stringify(
                Object.fromEntries(data.plugins.map((name: string) => [name, {}])),
                null,
                2,
              )}\n`;
            },
          },
        ],
      });

      const answers = await init.runPrompts(
        yes ? prompts.map((p) => p.default as unknown as string) : [],
      );
      let results = await init.runActions(answers);

      if (results.failures.length) {
        log.error('Plop encountered some errors:');
        results.failures.forEach((failure) => {
          log.error(`- ${failure.error}`);
        });

        const { retryWithForce } = await plop
          .setGenerator('retry', {
            prompts: [
              {
                name: 'retryWithForce',
                type: 'confirm',
                message: 'Do you want to use `--force`?',
              },
            ],
          })
          .runPrompts();

        if (retryWithForce) {
          throw new Error('Not implemented yet: retry with force');
        }
      }

      console.dir({ results }, { colors: true, depth: null });

      log.debug('Plop has been executed successfully', { results });
    });
}
