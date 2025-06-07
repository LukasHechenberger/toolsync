#! /usr/bin/env node

import { Command } from 'commander';
import { toolsync } from '@toolsync/core';
import { definePlugin } from '@toolsync/core/plugins';
import type { ToolsyncConfig } from '@toolsync/core/types';
import { name, version, homepage, repository } from '../package.json';
import { join, relative } from 'path';
import { readFile } from 'fs/promises';
import { logger } from '@toolsync/logger';

const log = logger.child('cli');

// TODO: Also implement a config plugin that checks for "toolsync" inside package.json

const resolveJsonFilePlugin = definePlugin<{ configFile: string }>({
  name: '@toolsync/cli/resolve-json-config-file',
  async loadConfig({ configFile }, { log }) {
    log.trace(`Trying to load config file ${configFile}`);
    if (!configFile.endsWith('.json'))
      throw new Error(`Config file must be a JSON file, got: ${configFile}`);

    log.info(`Loading config file ${configFile}`);

    const jsonFile = JSON.parse(await readFile(configFile, 'utf-8').catch(() => 'null'));
    log.debug(`Loaded JSON file:`, { jsonFile, plugins: jsonFile ? Object.keys(jsonFile) : [] });

    return {
      plugins: Object.keys(jsonFile),
      config: jsonFile,
    };
  },
});

const cliPluginName = '@toolsync/cli';
const programConfig: ToolsyncConfig = {
  plugins: [],
  config: {
    [cliPluginName]: {
      prepare: ['toolsync prepare'],
    },
  },
};

const cliPlugin = definePlugin<{ version?: string; configFile?: string; prepare?: string[] }>({
  name: cliPluginName,
  loadConfig(_, { log }) {
    log.trace('Returning CLI plugin config', { programConfig });
    return programConfig;
  },
  setupPackage(pkg, { log, options }) {
    if (pkg.isRoot) {
      pkg.packageJson.scripts ??= {};

      // TODO: Append if already exists
      pkg.packageJson.scripts['prepare'] = [
        `toolsync prepare${options.configFile ? ` --config ${relative(pkg.dir, join(process.cwd(), options.configFile))}` : ''}`,
        ...(options.prepare ?? []),
      ].join(' && ');

      // FIXME: Move to 'install' hook
      pkg.packageJson.devDependencies ??= {};
      pkg.packageJson.devDependencies['@toolsync/cli'] = options.version ?? version;
    }
  },
});

const program = new Command()
  .name(name)
  .version(version)
  .option('--config <config>', 'Specify a config file to load')
  .option('--plugin <plugin>', 'Specify a plugin to load')
  .option('--no-default-plugins', 'Disable all default plugins') // FIXME: Get description from core plugin
  .addHelpText(
    'afterAll',
    `
For usage details see ${new URL(repository.directory, `${homepage}/tree/main/`)}`,
  )
  .on('option:no-default-plugins', () => {
    log.debug('Disabling default plugins via --no-default-plugins');

    programConfig.config = {
      ...programConfig.config,
      '@toolsync/core': {
        defaultPlugins: false,
      },
    };
  })
  .on('option:plugin', (loader) => {
    log.debug(`Plugin specified: ${loader}`);
    programConfig.plugins.push(loader.startsWith('.') ? join(process.cwd(), loader) : loader);
  })
  .on('option:config', (configFile) => {
    log.debug(`Config file specified via --config: ${configFile}`);

    programConfig.plugins = [...programConfig.plugins, resolveJsonFilePlugin];
    programConfig.config = {
      ...programConfig.config,
      [cliPluginName]: {
        configFile,
      },
      [resolveJsonFilePlugin.name]: { configFile },
    };
  })
  .hook('preAction', (thisCommand, actionCommand) => {
    if (!thisCommand.opts().config) {
      log.info(`No config file specified, using default config`);
      // FIXME: TODO: Default to toolsync.json in the current directory
    }

    log.trace(`About to call action handler for subcommand: ${actionCommand.name()}`, {
      arguments: actionCommand.args,
      options: actionCommand.opts(),
      config: programConfig,
    });
  });

program
  .command('prepare')
  .description('Prepare the environment for development')
  .action(async (options, args) => {
    log.timing('Starting toolsync CLI preparation');
    const tools = await toolsync({
      plugins: [cliPlugin],
      config: {
        [cliPlugin.name]: options,
      },
    });
    log.timing('Finished toolsync CLI preparation');

    log.timing('Start loading config');
    const config = await tools.loadConfig();
    log.timing('Finished loading config');

    log.debug('Toolsync CLI is ready', { config: config.config });

    log.timing('Running setupPackage hooks');
    await tools.runSetup();
    log.timing('Finished running setupPackage hooks');

    log.debug('Setup completed', { config: tools.config });
    log.info('Done');
  });

program
  .command('config')
  .description('Print the fully resolved toolsync config')
  .option('--json', 'Output the config as JSON')
  .action(async (options, args) => {
    log.timing('Starting toolsync CLI preparation');
    const tools = await toolsync({
      plugins: [cliPlugin],
      config: {
        [cliPlugin.name]: options,
      },
    });
    log.timing('Finished toolsync CLI preparation');

    log.timing('Start loading config');
    const config = await tools.loadConfig();
    log.timing('Finished loading config');

    console.log(options.json ? JSON.stringify(config.config, null, 2) : config.config);
  });

program.parse();
