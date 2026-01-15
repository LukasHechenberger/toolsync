import { test, expect } from 'bun:test';
import { engine } from './basic-usage';

test('basic-usage example works', () => {
  const result = engine.plugins['my-plugin'].doSomething();
  expect(result).toBe('Doing something!');
});
