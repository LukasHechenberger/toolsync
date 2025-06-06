import { definePlugin, type Plugin } from '@toolsync/core/plugins';

type BuiltinPlugin<Options> = Plugin<Options> & {
  name: `@toolsync/builtin/${string}`;
  description: string;
};

/** Makes sure the plugin as a name prefixed with `@toolsync/builtin/` */
export const defineBuiltinPlugin = <T>(plugin: BuiltinPlugin<T>) => definePlugin<T>(plugin);
