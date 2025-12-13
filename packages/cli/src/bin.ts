#! /usr/bin/env node

import { logger } from '@toolsync/logger';
import program from '.';
import { name, version } from '../package.json';

const log = logger.child('bin');

log.debug(`Starting ${name} v${version}`);

program.name(name).version(version).parse();
