import { defineBuiltinPlugin } from '../lib/plugins';

const pluginName = '@toolsync/builtin/package-meta';

const packageMetaPlugin = defineBuiltinPlugin<{
  // TODO: Define plugin options here
}>({
  name: pluginName,
  description: 'Sync package metadata like repository etc between workspace packages',
  setupPackage(pkg, { rootPackage, log }) {
    if (pkg.isRoot) {
      // Skip root package

      // Validate root package metadata
      const repository = rootPackage?.packageJson.repository;
      if (!repository) log.warn(`Root package does not have a repository field, skipping sync.`);
      else if (typeof repository === 'string') {
        log.warn(`Repository field is a string, consider using an object instead.`);
      }

      return;
    }

    // Sync package metadata with root package
    const license = rootPackage?.packageJson.license;
    if (license) pkg.packageJson.license = license;

    const engines = rootPackage?.packageJson.engines;
    if (engines) pkg.packageJson.engines = engines;

    const repository = rootPackage?.packageJson.repository;
    if (repository) {
      if (typeof repository === 'string') {
        pkg.packageJson.repository = repository;
      } else {
        pkg.packageJson.repository = {
          ...repository,
          directory: pkg.relativeDir,
        };
      }
    }
  },
});

export default packageMetaPlugin;
