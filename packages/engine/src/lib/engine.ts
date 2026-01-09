import type { EngineTypes } from '../types';
import { version } from '../../package.json';

/** The API surface of the engine, based on the provided engine types */
type EngineApi<Types extends EngineTypes> = {
  plugins: { [K in keyof Types['plugins']]: Types['plugins'][K] };
};

/** The basis of all @toolsync/engine plugins */
export abstract class EnginePlugin<Types extends EngineTypes = EngineTypes> {
  // FIXME: We need a way to enforce plugin authors to also use 'as const' here
  // Otherwise, safe type inference won't work (for *all* plugins)
  /** A unique name for the plugin. It should also be a valid import specifier, e.g. `import(pluginName)` should work */
  abstract pluginName: string;

  constructor(public readonly engine: EngineApi<Types>) {}
}

export class Engine<Types extends EngineTypes> implements EngineApi<Types> {
  readonly version = version;

  #plugins: EnginePlugin[] = [];
  plugins: EngineApi<Types>['plugins'] = {} as any;

  constructor(options: CreateEngineOptions) {
    // Register plugins
    for (const PluginConstructor of options.plugins) {
      const plugin = new PluginConstructor(this);

      this.#plugins.push(plugin);

      (this.plugins as any)[plugin.pluginName] = plugin;
    }
  }

  /** Used for type inference, always undefined at runtime */
  $inferEngineTypes: Types | undefined;
}

type PluginConstructor = { new (engine: any): EnginePlugin };
type PluginFromConstructor<C extends PluginConstructor> = C extends new (engine: any) => infer P
  ? P
  : never;

export type CreateEngineOptions = {
  plugins: PluginConstructor[];
};

export interface EngineTypesFromOptions<Options extends CreateEngineOptions> extends EngineTypes {
  plugins: {
    [K in PluginFromConstructor<Options['plugins'][number]>['pluginName']]: Extract<
      PluginFromConstructor<Options['plugins'][number]>,
      { pluginName: K }
    >;
  };
}

export function createEngine<T extends CreateEngineOptions>(options: T) {
  return new Engine<EngineTypesFromOptions<T>>(options);
}
