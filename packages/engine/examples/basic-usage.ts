import { createEngine, EnginePlugin } from '@toolsync/engine';

// The engine is pretty useless without any plugins
class MyPlugin extends EnginePlugin {
  pluginName = 'my-plugin' as const;

  // Plugin implementation here
  doSomething() {
    return 'Doing something!';
  }
}

// Create the engine with your plugins
export const engine = createEngine({
  plugins: [
    // Your plugins here
    MyPlugin,
  ],
});

// Use the engine and its plugins
engine.plugins['my-plugin'].doSomething();
