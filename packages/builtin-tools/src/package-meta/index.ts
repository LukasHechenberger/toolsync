import { defineBuiltinPlugin } from '../lib/plugins';

const pluginName = '@toolsync/builtin/package-meta';

const packageMetaPlugin = defineBuiltinPlugin<{
  // TODO: Define plugin options here
}>({
  name: pluginName,
  description: 'Sync package metadata like repository etc between workspace packages',
  setupPackage(pkg, { rootPackage }) {
    if (pkg.isRoot) {
      // Skip root package
      // TODO: Validate root package metadata?
      return;
    }

    // Sync package metadata with root package
    const license = rootPackage?.packageJson.license;
    if (license) pkg.packageJson.license = license;
  },
});

export default packageMetaPlugin;
