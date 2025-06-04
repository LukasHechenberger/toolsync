#! /usr/bin/env node

import { Command } from 'commander';
import { devtools } from '@devtools/core';
import { definePlugin } from '@devtools/core/plugins';
import type { DevtoolsConfig } from '@devtools/core/types';
import { name, version } from '../package.json';
import { join } from 'path';
import { readFile } from 'fs/promises';
import { logger } from '@devtools/logger';

const log = logger.child('cli');

// TODO: Also implement a config plugin that checks for "devtools" inside package.json

const resolveJsonFilePlugin = definePlugin<{ configFile: string }>({
  name: '@devtools/cli/resolve-json-config-file',
  async loadConfig({ configFile }, { log }) {
    if (!configFile.endsWith('.json'))
      throw new Error(`Config file must be a JSON file, got: ${configFile}`);

    log.info('Loading config file', { configFile });

    const jsonFile = JSON.parse(await readFile(configFile, 'utf-8').catch(() => 'null'));
    log.debug(`Loaded JSON file:`, { jsonFile });

    return {
      plugins: [],
      config: jsonFile,
    };
  },
});

const programConfig: DevtoolsConfig = {
  plugins: [],
  config: {},
};

const cliPlugin = definePlugin<{ configFile: string }>({
  name: '@devtools/cli',
  loadConfig() {
    return programConfig;
  },
});

const program = new Command()
  .name(name)
  .version(version)
  // .option('--no-default-plugins', 'Disable default plugins')
  .option('--plugin <plugin>', 'Specify a plugin to load')
  .option('--config <config>', 'Specify a config file to load')
  .addHelpText(
    'afterAll',
    `
For usage details see <LINK>` // TODO: Insert repo url
  )
  .on('option:plugin', (loader) => {
    log.debug(`Plugin specified: ${loader}`);
    programConfig.plugins.push(loader.startsWith('.') ? join(process.cwd(), loader) : loader);
  })
  .on('option:config', (config) => {
    log.debug(`Config file specified via --config: ${config}`);

    programConfig.plugins = [...programConfig.plugins, resolveJsonFilePlugin];
    programConfig.config = {
      [resolveJsonFilePlugin.name]: {
        configFile: config,
      },
    };
  });

program
  .command('prepare')
  .description('Prepare the environment for development')

  .action(async (options, args) => {
    log.timing('Starting devtools CLI preparation');
    const tools = await devtools({
      plugins: [cliPlugin],
      config: {
        [cliPlugin.name]: options,
      },
    });
    log.timing('Finished devtools CLI preparation');

    log.timing('Loading loading config');
    const config = await tools.loadConfig();

    log.timing('Finished loading config');

    log.info('Devtools CLI is ready', {
      config: config.config,
    });
  });

program.parse();
