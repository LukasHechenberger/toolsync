#! /usr/bin/env node

import program from '.';
import { name, version } from '../package.json';

program.name(name).version(version).parse();
