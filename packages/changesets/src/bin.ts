import { findRoot } from '@manypkg/find-root';
import { styleText } from 'node:util';

const root = await findRoot(process.cwd());
if (root && root.rootDir !== process.cwd()) {
  console.log(styleText(['dim'], `👾  Changing working directory to: ${root.rootDir}`));
  process.chdir(root.rootDir);
}

await import('@changesets/cli');
