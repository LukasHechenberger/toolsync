import { definePlugin } from '@toolsync/core/plugins';
import { packageManager as defaultPackageManager } from '../../../../package.json';

const pnpmPlugin = definePlugin<{
  version?: string;
}>({
  name: '@toolsync/builtin/pnpm',
  loadConfig(config, { rootPackage }) {
    let version = config.version;

    // Detect version from packageManger field in root package.json
    if (!version) {
      const packageManager = rootPackage?.packageJson?.packageManager || defaultPackageManager;
      const [tool, versionPart] = packageManager.split('@');

      if (tool !== 'pnpm') {
        throw new Error(
          `Expected packageManager to be 'pnpm', but found '${tool}' in root package.json.`,
        );
      }

      version = versionPart;
    }

    return {
      config: {
        '@toolsync/builtin/pnpm': {
          version,
        },
      },
    };
  },
  setupPackage(pkg, { options }) {
    if (pkg.isRoot) {
      pkg.packageJson.packageManager = `pnpm@${options.version}`;
    }
  },
});

export default pnpmPlugin;
