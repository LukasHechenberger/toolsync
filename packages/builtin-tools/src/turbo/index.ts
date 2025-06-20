import { defineBuiltinPlugin } from '../lib/plugins';

const pluginName = '@toolsync/builtin/turbo';

declare global {
  namespace Toolsync {
    interface ConfigMap {
      [pluginName]: {
        // TODO: Define plugin options here
      };
    }
  }
}

const turboPlugin = defineBuiltinPlugin({
  name: pluginName,
  description: 'Integrates with Turborepo',
  setupPackage(pkg, { options, log }) {
    if (pkg.isRoot) {
      console.log('SETUP ROOT ');
    }
  },
});

export default turboPlugin;
