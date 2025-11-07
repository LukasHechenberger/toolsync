import { PlopTypes } from '@turbo/gen';
import { name as prefix } from '../../package.json';

export default function generator(plop: PlopTypes.NodePlopAPI): void {
  plop.setGenerator('plugin', {
    description: 'Create a new builtin plugin',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'What is the name of the new plugin?',
        validate(input) {
          if (!/^[a-z]+(-[a-z0-9]+)*$/.test(input)) {
            return 'Plugin name must be in dash-case (e.g., my-plugin)';
          }
          return true;
        },
      },
      {
        type: 'input',
        name: 'description',
        message: 'What is the description of the new plugin?',
      },
      {
        type: 'confirm',
        name: 'installInWorkspace',
        message: 'Should this plugin be installed in the workspace?',
        default: true,
      },
    ],
    actions: [
      // Create the plugin file
      {
        type: 'add',
        path: './src/{{ dashCase name }}/index.ts',
        template: `import { defineBuiltinPlugin } from '../lib/plugins';

export const {{ camelCase name }}PluginName = '${prefix}/{{ dashCase name }}';

declare global {
  namespace Toolsync {
    interface ConfigMap {
      [{{ camelCase name }}PluginName]: {
        // TODO: Define plugin options here
      };
    }
  }
}

const {{ camelCase name }}Plugin = defineBuiltinPlugin({
  name: {{ camelCase name }}PluginName,
  description: '{{ description }}',
  // TODO: Add hooks here...
});

export default {{ camelCase name }}Plugin;
`,
      },
      //  Modify package.json to include new package
      {
        type: 'modify',
        path: './package.json',
        transform(current, data) {
          const manifest = JSON.parse(current);
          manifest.exports = {
            ...manifest.exports,
            [`./${data.name}`]: {
              types: `./out/${data.name}/index.d.ts`,
              default: `./out/${data.name}/index.js`,
            },
          };

          return JSON.stringify(manifest, null, 2) + '\n';
        },
      },
      {
        type: 'modify',
        path: '{{ turbo.paths.root }}/toolsync.json',
        transform(current, data) {
          const manifest = JSON.parse(current);
          manifest[`${prefix}/${data.name}`] = {};

          return JSON.stringify(manifest, null, 2) + '\n';
        },
      },
    ],
  });
}
