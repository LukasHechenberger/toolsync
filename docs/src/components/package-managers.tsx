import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import type { ReactNode } from 'react';

const defaultPackageManagers = ['pnpm', 'npm', 'yarn'];

export function PackageManagerTabs({
  children,
  packageManagers = defaultPackageManagers,
}: {
  packageManagers?: string[];
  children: ReactNode | ((pm: string) => ReactNode);
}) {
  return (
    <Tabs groupId="package-manager" persist items={packageManagers}>
      {typeof children === 'function'
        ? packageManagers.map((manager) => (
            <Tab key={manager} value={manager}>
              {children(manager)}
            </Tab>
          ))
        : children}
    </Tabs>
  );
}
