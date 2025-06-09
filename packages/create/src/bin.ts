#! /usr/bin/env node

import { Command } from 'commander';
import { name, version, homepage } from '../package.json';
import { logger } from '@toolsync/logger';
import { getPackages } from '@manypkg/get-packages';

const log = logger.child('create');

log.trace('Getting packages in the current directory');
const { tool, rootDir } = await getPackages(process.cwd());
log.debug('Detected tool', { tool: tool.type, rootDir });

const [scope] = name.split('/');
let binName = {
  pnpm: `pnpm create ${scope}`,
  yarn: `yarn create ${scope}`,
  npm: `npm init ${scope}`,
}[tool.type];

const creatingReadme = process.env.npm_package_name === name && process.env.npm_lifecycle_event;
if (!binName || creatingReadme) {
  if (!binName) log.debug('Unknown tool type, using package name');
  binName = name;
}

const program = new Command()
  .name(binName)
  .version(version)
  .description('Setup Toolsync in your repository');

// TODO: Call @toolsync/cli generate

program.parse();
