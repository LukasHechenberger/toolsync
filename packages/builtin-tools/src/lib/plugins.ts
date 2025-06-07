import { definePlugin, type Plugin } from '@toolsync/core/plugins';

type BuiltinPlugin<K extends keyof Toolsync.ConfigMap> = Plugin<K> & {
  name: `@toolsync/builtin/${string}`;
  description: string;
};

/** Makes sure the plugin as a name prefixed with `@toolsync/builtin/` */
export const defineBuiltinPlugin = <K extends keyof Toolsync.ConfigMap>(plugin: BuiltinPlugin<K>) =>
  definePlugin<K>(plugin);
