import { definePlugin } from '@devtools/core/plugins';

const pnpmPlugin = definePlugin<{
  version?: string;
}>({
  name: '@devtools/builtin/pnpm',
  setupPackage(pkg, { options }) {
    if (pkg.isRoot) {
      pkg.packageJson.packageManager = `pnpm@${options.version}`;
    }
  },
});

export default pnpmPlugin;
