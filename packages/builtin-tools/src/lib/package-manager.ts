import type { Package } from '@toolsync/core/types';

export function getConfiguredPackageManagerVersion<T extends string>(
  wantedTool: T,
  defaultPackageManager: string,
  rootPackage?: Package,
) {
  const packageManager = rootPackage?.packageJson?.packageManager || defaultPackageManager;
  const [configuredTool, versionPart] = packageManager.split('@');

  if (configuredTool !== wantedTool) {
    throw new Error(
      `Expected packageManager to be '${wantedTool}', but found '${configuredTool}' in root package.json.`,
    );
  }

  return versionPart;
}
