import { packageManager as defaultPackageManager } from '../../../../package.json';
import { defineBuiltinPlugin } from '../lib/plugins';

const pnpmPlugin = defineBuiltinPlugin<{
  version?: string;
}>({
  name: '@toolsync/builtin/pnpm',
  description:
    'Integrates with the pnpm package manager, setting up the root package.json with the specified version.',
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
