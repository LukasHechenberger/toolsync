import { Tab, Tabs } from 'fumadocs-ui/components/tabs';

import { getPackages } from '@toolsync/core';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { compileMDX } from '@fumadocs/mdx-remote';
import { getMDXComponents } from '@/mdx-components';

export async function PackageChangelog({ package: name }: { package: string }) {
  const { packages } = await getPackages();
  const pkg = packages.find((pkg) => pkg.packageJson.name === name);
  if (!pkg) {
    throw new Error(`Package ${name} not found`);
  }

  const readme = await readFile(join(pkg.dir, 'CHANGELOG.md'), 'utf-8');
  const { body: Changelog } = await compileMDX({
    source: readme
      // Remove level 1 heading (package name)
      .replace(/^# .+/m, '')
      // Increase heading level
      .replaceAll(/^#/gm, '##'),
  });

  return <Changelog components={getMDXComponents()} />;
}
