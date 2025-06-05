import { definePlugin } from '@devtools/core/plugins';
import { devDependencies } from '../../package.json';

const prettierPlugin = definePlugin<{ version?: string }>({
  name: '@devtools/builtin/prettier',
  async setupPackage(pkg, { log, options }) {
    if (pkg.isRoot) {
      pkg.packageJson.scripts ??= {};
      pkg.packageJson.scripts['format'] = 'prettier --write .';

      pkg.packageJson.devDependencies ??= {};
      pkg.packageJson.devDependencies['prettier'] = options.version || devDependencies['prettier'];
    }
  },
});

export default prettierPlugin;
