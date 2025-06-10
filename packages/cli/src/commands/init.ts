import { logger } from '@toolsync/logger';
import type { Command } from 'commander';
import nodePlop, { type PromptQuestion } from 'node-plop';
import { getPackages } from '@toolsync/core';
import tools from '@toolsync/builtin/tools.json';

const log = logger.child('cli:init');

async function init({ rootDir, force, yes }: { rootDir: string; force: boolean; yes: boolean }) {
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

  const results = await init.runActions(answers, {
    onFailure: (fail) => log.error(fail.error),
    onSuccess: (success) => log.info(success.path),
  });

  return { results, answers };
}

async function confirmRetry({ rootDir }: { rootDir: string }) {
  log.debug('Running plop for retry confirmation');
  const { retryWithForce } = await (
    await nodePlop(undefined, { destBasePath: rootDir, force: false })
  )
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

  return retryWithForce;
}

export function setupInitCommand(command: Command) {
  return command
    .option('-y, --yes', 'accept all default options', false)
    .option('-f, --force', 'overwrite existing files etc.', false)
    .action(async ({ yes, force }) => {
      const { rootDir } = await getPackages();

      log.debug('Running plop');
      let { results, answers } = await init({ rootDir, force, yes });
      if (results.failures.length && !force) {
        const retryWithForce = await confirmRetry({ rootDir });

        if (retryWithForce) {
          console.log('TODO: Add answers', answers);
          results = (await init({ rootDir, force: true, yes })).results;
        } else {
          log.debug('User chose not to retry with force, exiting');
          log.info('Cancelling...');
        }
      }

      if (results.failures.length) {
        process.exitCode = 1;
      } else {
        log.debug('Plop has been executed successfully', { results });
        log.info('Done!');
      }
    });
}
