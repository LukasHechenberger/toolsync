import { logger } from '@toolsync/logger';
import type { Command } from 'commander';
import nodePlop, { type CustomActionConfig, type PromptQuestion } from 'node-plop';
import { getPackages } from '@toolsync/core';
import tools from '@toolsync/builtin/tools.json';
import { execa } from 'execa';
import { styleText } from 'util';
import { homepage } from '../../package.json';

const log = logger.child('cli:init');

type InitAnswers = {
  plugins: string[];
};

type RunCommandActionConfig = {
  title: string;
  command: string;
};

type RunCommandAction = RunCommandActionConfig & CustomActionConfig<'runCommand'>;

async function init({ rootDir, force, yes }: { rootDir: string; force: boolean; yes: boolean }) {
  const plop = await nodePlop(undefined, { destBasePath: rootDir, force });

  plop.setActionType('runCommand', async (answers, config, plop) => {
    const { plugins } = answers as InitAnswers;
    const { command, title } = config as unknown as RunCommandActionConfig;

    const cwd = plop.getDestBasePath();

    log.info(styleText('bold', title));
    log.info(
      `Running command: ${styleText('cyan', command)} ${styleText('reset', 'inside')} ${styleText('magenta', cwd)}`,
    );

    const prefixLine = function* (line: unknown) {
      yield `  ${styleText('dim', `${line}`)}`;
    };

    await execa(command, { cwd, shell: true, stdout: ['inherit', prefixLine] });

    return styleText('green', 'Done!');
  });

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
    actions: (answers) => {
      // TODO: Support other package managers
      const { plugins } = answers as InitAnswers;

      return [
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

        {
          title: 'Installing dependencies...',
          type: 'runCommand',
          command: [
            'pnpm',
            'add',
            '-Dw',
            '@toolsync/cli',
            ...(plugins.length > 0 ? ['@toolsync/builtin'] : []),
          ].join(' '),
        } as RunCommandAction,
        {
          title: 'Syncing config files...',
          type: 'runCommand',
          command: 'pnpm toolsync prepare --config toolsync.json',
        } as RunCommandAction,
        {
          title: 'Running first toolsync...',
          type: 'runCommand',
          command: 'pnpm prepare',
        } as RunCommandAction,
      ];
    },
  });

  const answers = await init.runPrompts(
    yes ? prompts.map((p) => p.default as unknown as string) : [],
  );

  const results = await init.runActions(answers, {
    onFailure: (fail) => {
      if (fail.error.includes('previous action failure')) log.debug(fail.error);
      else log.error(fail.error);
    },
    onSuccess: (success) => log.debug(success.path),
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

        log.info(`${styleText(['bold', 'green'], 'All done!')}
        
  Visit ${styleText('cyan', homepage)} for more information
                                                           `);
      }
    });
}
