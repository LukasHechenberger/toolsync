#! /usr/bin/env node

import { Command } from 'commander';
import { devtools } from '@devtools/core';
import { definePlugin } from '@devtools/core/plugins';
import type { DevtoolsConfig } from '@devtools/core/types';
import setupDebug from 'debug';
import { name, version } from '../package.json';
import { join } from 'path';
import { readFile } from 'fs/promises';

const debug = setupDebug('devtools:cli');
const timing = debug.extend('timing');

// TODO: Also implement a config plugin that checks for "devtools" inside package.json

const resolveJsonFilePlugin = definePlugin<{ configFile: string }>({
  name: '@devtools/cli/resolve-json-config-file',
  async loadConfig({ configFile }) {
    if (!configFile.endsWith('.json'))
      throw new Error(`Config file must be a JSON file, got: ${configFile}`);

    console.log('CLI: Loading config', configFile);
    // throw new Error('Not implemented');

    const jsonFile = JSON.parse(await readFile(configFile, 'utf-8').catch(() => 'null'));
    debug(`Loaded JSON file:`, jsonFile);

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

  // loadModule(input) {
  //   console.log('Can CLI resolve modules?', input);
  // },
  loadConfig(incoming) {
    // if (!incoming) throw new Error('No incoming config provided');
    // if (incoming?.configFile) {
    //   console.log('TODO:');
    // }

    // Load CLI-specific configuration
    console.log('CLI: Loading config', { programConfig, incoming });

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
  // .on('option:no-default-plugins', () => {
  //   debug(`Default plugins disabled via --no-default-plugins`);
  //   // coreOptions.addDefaultPlugins = false;
  // })
  .on('option:plugin', (loader) => {
    debug(`Plugin specified: ${loader}`);
    programConfig.plugins.push(loader.startsWith('.') ? join(process.cwd(), loader) : loader);
  })
  .on('option:config', (config) => {
    debug(`Config file specified via --config: ${config}`);

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
    console.dir({ options, args }, { depth: null, colors: true });

    timing('Starting devtools CLI preparation');
    const tools = await devtools({
      plugins: [cliPlugin],
      config: {
        [cliPlugin.name]: options,
      },
    });
    timing('Finished devtools CLI preparation');

    timing('Loading loading config');
    const config = await tools.loadConfig();

    timing('Finished loading config');

    // console.dir({ tools, options }, { depth: null, colors: true });
    // console.dir({ config }, { depth: null, colors: true });
  });

program.parse();
