import { definePlugin } from '@devtools/core/plugins';

const ignoreSyncPlugin = definePlugin({
  name: 'ignore-sync',
  setupPackage(pkg, { log }) {
    if (pkg.isRoot) {
      pkg.packageJson.scripts ??= {};
      pkg.packageJson.scripts['ignore-sync'] = 'ignore-sync .';
    }
  },
});

export default ignoreSyncPlugin;
