#! /usr/bin/env node

import { findRoot } from '@manypkg/find-root';
import { styleText } from 'node:util';
import { name, version } from '../package.json';
import { version as changesetsVersion } from '@changesets/cli/package.json';

const log = (message: string) => process.stderr.write(styleText(['dim'], `👾  ${message}\n`));

log(`Using patched ${name} v${version} based on @changesets/cli v${changesetsVersion}`);

async function run() {
  const root = await findRoot(process.cwd());
  if (root && root.rootDir !== process.cwd()) {
    log(`Changing working directory to: ${root.rootDir}`);

    process.chdir(root.rootDir);
  }

  await import('@changesets/cli');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
