import type { Package } from '@toolsync/core/types';
import { defineBuiltinPlugin } from '../lib/plugins';

const pluginName = '@toolsync/builtin/package-meta';

const packageMetaPlugin = defineBuiltinPlugin<Pick<Package['packageJson'], 'publishConfig'>>({
  name: pluginName,
  description: 'Sync package metadata like repository etc between workspace packages',
  setupPackage(pkg, { rootPackage, log, options }) {
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

    const homepage = rootPackage?.packageJson.homepage;
    if (homepage) pkg.packageJson.homepage = homepage;

    if (options.publishConfig && !pkg.packageJson.private) {
      pkg.packageJson.publishConfig = options.publishConfig;
    } else {
      delete pkg.packageJson.publishConfig;
    }
  },
});

export default packageMetaPlugin;
