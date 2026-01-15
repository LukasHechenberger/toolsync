import { definePlugin } from '@toolsync/core';

export default definePlugin({
  name: 'simple-plugin',
  getConfigSchema(zod) {
    return zod.object({
      static: zod.string().default('simple value'),
      dynamic: zod.number().default(() => Date.now()),
    });
  },
  setup() {
    console.log('Simple plugin setup executed');
  },
});
