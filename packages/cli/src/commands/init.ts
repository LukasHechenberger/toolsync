import { logger } from '@toolsync/logger';
import type { Command } from 'commander';
import nodePlop, { type CustomActionConfig, type PromptQuestion } from 'node-plop';
import { getPackages } from '@toolsync/core';
import tools from '@toolsync/builtin/tools.json';
import { execa } from 'execa';
import { styleText } from 'util';
import { isNodeError } from '../lib/utilities';
import terminalLink from 'terminal-link';
import { isatty } from 'tty';
import type { Package } from '@toolsync/core/types';

const log = logger.child('cli:init');

type InitAnswers = {
  plugins: string[];
};

type RunCommandActionConfig = {
  title: string;
  command: string;
};

type RunCommandAction = RunCommandActionConfig & CustomActionConfig<'runCommand'>;

const promptsSupported = isatty(process.stdin.fd);
log.debug(`Prompts supported: ${promptsSupported}`);

export type InitOptions = {
  /** Init project in this directory */
  cwd?: string;
  /** Overwrite existing files @default false */
  force?: boolean;
  /** Defaults to true @default true */
  useDefaults?: boolean;
  /** Override versions of installed packages */
  versions?: Record<string, string>;
  /** Throw errors instead of returning failures @default true */
  throw?: boolean;
};

type InitResult = {
  results: {
    changes: { type: string; path: string }[];
    failures: { type: string; path: string; error: string; message: string }[];
  };
  answers: InitAnswers;
};

class AppError extends Error {
  code: string;

  constructor(message: string, { code, ..._options }: { code: string }) {
    super(message);

    this.code = code;
  }
}

function detectPackageManager(rootPackage?: Package) {
  const pmField = rootPackage?.packageJson.packageManager;
  if (pmField) {
    const [pm] = pmField.split('@');
    if (!['bun', 'pnpm', 'yarn', 'npm'].includes(pm!)) {
      throw new AppError(
        `Detected package manager "${pm}" from packageManager field is not supported.`,
        { code: 'UNSUPPORTED_PACKAGE_MANAGER' },
      );
    }

    log.debug(`Detected package manager from packageManager field: ${pm}`);

    return pm!;
  }

  log.debug('No packageManager field found in root package.json, detecting from user agent');
  const userAgent = process.env.npm_config_user_agent;
  if (userAgent?.startsWith('bun/')) return 'bun';
  if (userAgent?.startsWith('pnpm/')) return 'pnpm';
  if (userAgent?.startsWith('yarn/')) return 'yarn';

  return 'npm';
}

export async function init({
  cwd = process.cwd(),
  force = false,
  useDefaults = true,
  versions,
  throw: shouldThrow = true,
}: InitOptions): Promise<InitResult> {
  // NOTE: This is probably not necessary, as we pass cwd to plop, but just in case
  if (cwd) {
    try {
      log.debug(`Changing working directory to ${cwd}`);

      process.chdir(cwd);
      log.info(`Working directory changed to ${styleText('magenta', process.cwd())}`);
    } catch (error) {
      if (isNodeError(error) && error.code === 'ENOENT') {
        throw new AppError(`The directory "${cwd}" does not exist.`, { code: error.code });
      }

      throw error;
    }
  }

  const { rootDir, rootPackage, tool, packages, ...packagesInfo } = await getPackages();
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

  const isMonorepo = tool.type !== 'root';
  const packageManager = tool.type === 'root' ? detectPackageManager(rootPackage) : tool.type;
  log.info(`Using package manager: ${styleText('cyan', packageManager)}`);
  log.debug(`Resolved package manager from @manypkg tool: ${tool.type}`);
  log.debug(`Detected monorepo: ${isMonorepo}`);

  const init = plop.setGenerator('init', {
    prompts,
    actions: (answers) => {
      // TODO: Support other package managers
      const { plugins } = answers as InitAnswers;

      const pm = {
        bun: {
          runPackageCommand: 'bun',
          installCommand: 'bun install',
          runScriptCommand: 'bun run',
          installPackageCommand: 'bun add -D',
        },
        pnpm: {
          runPackageCommand: 'pnpm',
          installCommand: 'pnpm install',
          runScriptCommand: 'pnpm run',
          installPackageCommand: isMonorepo ? 'pnpm add -Dw' : 'pnpm add -D',
        },
        yarn: {
          runPackageCommand: 'yarn',
          installCommand: 'yarn install',
          runScriptCommand: 'yarn',
          installPackageCommand: isMonorepo ? 'yarn add -DW' : 'yarn add -D',
        },
        npm: {
          runPackageCommand: 'npx',
          installCommand: 'npm install',
          runScriptCommand: 'npm run',
          installPackageCommand: 'npm install -D',
        },
      }[packageManager];

      if (!pm?.installPackageCommand) {
        throw new AppError(
          `The package manager "${tool.type}" is not supported by the init command yet.`,
          { code: 'UNSUPPORTED_PACKAGE_MANAGER' },
        );
      }

      const { installCommand, installPackageCommand, runPackageCommand, runScriptCommand } = pm;

      const dependencies = [
        '@toolsync/cli',
        ...(plugins.length > 0 ? ['@toolsync/builtin'] : []),
      ].map((plugin) => {
        const versionOverride = versions?.[plugin];

        if (versionOverride) {
          log.debug(`Using version override for plugin ${plugin}: ${versionOverride}`);
          return `${plugin}@${versionOverride}`;
        }

        return `${plugin}@latest`;
      });

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
          title: 'Installing new dependencies...',
          type: 'runCommand',
          command: `${installPackageCommand} ${dependencies.join(' ')}`,
        } as RunCommandAction,
        {
          title: 'Syncing config files...',
          type: 'runCommand',
          command: `${runPackageCommand} toolsync prepare --config toolsync.json`,
        } as RunCommandAction,
        {
          title: 'Installing updated dependencies...',
          type: 'runCommand',
          command: `${installCommand}`,
        } as RunCommandAction,
        {
          title: 'Running first toolsync...',
          type: 'runCommand',
          command: `${runScriptCommand} prepare`,
        } as RunCommandAction,
      ];
    },
  });

  const answers = useDefaults
    ? Object.fromEntries(prompts.map((p) => [p.name, p.default]))
    : !promptsSupported
      ? { plugins: [] } // TODO: Use plugins from options
      : await init.runPrompts([]);

  const results = await init.runActions(answers, {
    onFailure: (fail) => {
      if (fail.error.includes('previous action failure')) log.debug(fail.error);
      else log.error(fail.error);
    },
    onSuccess: (success) => log.debug(success.path),
  });

  if (shouldThrow && results.failures.length) {
    throw new Error(
      'Init failed due to errors: ' + results.failures.map((f) => f.error).join('; '),
    );
  }

  return { results, answers };
}

async function confirmRetry() {
  log.debug('Running plop for retry confirmation');
  const { retryWithForce } = await (
    await nodePlop(undefined, {
      // Shouldn't really matter here
      destBasePath: process.cwd(),
      force: false,
    })
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
    .argument('[cwd]', 'init in a specific directory')
    .option('-y, --yes', 'accept all default options', false)
    .option('-f, --force', 'overwrite existing files etc.', false)
    .action(async (cwd, { yes, force }) => {
      log.debug('Running plop');

      let { results, answers } = await init({ force, useDefaults: yes, cwd, throw: false });
      if (results.failures.length && !force && promptsSupported) {
        const retryWithForce = await confirmRetry();

        if (retryWithForce) {
          console.debug('TODO: Add answers', answers);
          results = (await init({ force: true, useDefaults: yes, cwd, throw: false })).results;
        } else {
          log.debug('User chose not to retry with force, exiting');
          log.info('Cancelling...');
        }
      }

      if (results.failures.length) {
        command.error('Init failed due to errors.', { code: 'INIT_FAILED' });
      } else {
        log.debug('Plop has been executed successfully', { results });

        log.info(`${styleText(['bold', 'green'], 'All done!')}
        
  Next, ${terminalLink(styleText('cyan', 'configure your project'), 'https://toolsync.vercel.app/docs/configuration')} if needed.
                                                           `);
      }
    });
}
