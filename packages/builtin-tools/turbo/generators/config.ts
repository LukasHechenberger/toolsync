import { PlopTypes } from '@turbo/gen';

export default function generator(plop: PlopTypes.NodePlopAPI): void {
  plop.setGenerator('plugin', {
    description: 'Create a new builtin plugin',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'What is the name of the new plugin?',
        validate(input) {
          if (!/^[a-z][a-zA-Z0-9]*$/.test(input)) {
            return 'Plugin name must be in camelCase';
          }
          return true;
        },
      },
    ],
    actions: [
      // Create the plugin file
      {
        type: 'add',
        path: './src/{{ dashCase name }}/index.ts',
        template: `import { definePlugin } from '@devtools/core/plugins';

const {{ camelCase name }}Plugin = definePlugin({
  name: '@devtools/builtin/{{ dashCase name }}',
  // Add hooks here...
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
    ],
  });
}
