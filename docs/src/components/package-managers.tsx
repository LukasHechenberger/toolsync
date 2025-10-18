import { getMDXComponents } from '@/mdx-components';
import { compileMDX } from '@fumadocs/mdx-remote';
import { CodeBlock, Pre } from 'fumadocs-ui/components/codeblock';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import type { ReactNode } from 'react';

const defaultPackageManagers = ['pnpm' as const, 'npm' as const, 'yarn' as const];
type PackageManager = (typeof defaultPackageManagers)[number];

const execMap = {
  pnpm: 'pnpm',
  npm: 'npx',
  yarn: 'yarn',
} satisfies { [K in PackageManager]: string };

export function PackageManagerTabs({
  children,
  packageManagers = defaultPackageManagers,
}: {
  packageManagers?: PackageManager[];
  children: ReactNode | ((pm: PackageManager, index: number) => ReactNode);
}) {
  return (
    <Tabs groupId="package-manager" persist items={packageManagers}>
      {typeof children === 'function'
        ? packageManagers.map((manager, index) => (
            <Tab key={manager} value={manager}>
              {children(manager, index)}
            </Tab>
          ))
        : children}
    </Tabs>
  );
}

export async function RunPackageBinary({
  packageManager,
  command,
}: {
  packageManager: PackageManager;
  command: string;
}) {
  const rendered = await compileMDX({
    source: '```shell\n' + execMap[packageManager] + ' ' + command + '\n```',
    components: getMDXComponents(),
  });

  return rendered.body({});
}

export function RunPackageTabs({
  packageManagers = defaultPackageManagers,
  command,
}: {
  packageManagers?: PackageManager[];
  command: string;
}) {
  return (
    <PackageManagerTabs packageManagers={packageManagers}>
      {(pm) => <RunPackageBinary packageManager={pm} command={command} />}
    </PackageManagerTabs>
  );
}
