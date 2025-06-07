import { describe, it, expect } from 'vitest';
import { modify, type Modifier } from './index';

// packages/object-mods/src/index.test.ts

describe('modify', () => {
  it('assigns non-array property if not present in target', () => {
    const target = {};
    const modifier: Modifier<{ foo: string }> = { foo: 'bar' };
    modify(target, modifier);
    expect(target).toEqual({ foo: 'bar' });
  });

  it('assigns non-array property if present in target', () => {
    const target = { foo: 'baz' };
    const modifier: Modifier<{ foo: string }> = { foo: 'bar' };
    modify(target, modifier);
    expect(target).toEqual({ foo: 'bar' });
  });

  it('pushes non-operator object to array', () => {
    const target = { items: [{ id: 'a', val: 1 }] };
    const modifier: Modifier<typeof target> = { items: [{ id: 'b', val: 2 }] };
    modify(target, modifier);
    expect(target.items).toEqual([
      { id: 'a', val: 1 },
      { id: 'b', val: 2 },
    ]);
  });

  it('inserts with @insert before', () => {
    const target = {
      items: [
        { id: 'a', val: 1 },
        { id: 'b', val: 2 },
      ],
    };
    const modifier: Modifier<typeof target> = {
      items: [
        {
          '@insert': {
            before: 'b',
            data: { id: 'x', val: 99 },
          },
        },
      ],
    };
    modify(target, modifier);
    expect(target.items).toEqual([
      { id: 'a', val: 1 },
      { id: 'x', val: 99 },
      { id: 'b', val: 2 },
    ]);
  });

  it('inserts with @insert after', () => {
    const target = {
      items: [
        { id: 'a', val: 1 },
        { id: 'b', val: 2 },
      ],
    };
    const modifier: Modifier<typeof target> = {
      items: [
        {
          '@insert': {
            after: 'a',
            data: { id: 'x', val: 99 },
          },
        },
      ],
    };
    modify(target, modifier);
    expect(target.items).toEqual([
      { id: 'a', val: 1 },
      { id: 'x', val: 99 },
      { id: 'b', val: 2 },
    ]);
  });

  it('throws if @insert id not found', () => {
    const target = { items: [{ id: 'a', val: 1 }] };
    const modifier: Modifier<typeof target> = {
      items: [
        {
          '@insert': {
            before: 'notfound',
            data: { id: 'x', val: 99 },
          },
        },
      ],
    };
    expect(() => modify(target, modifier)).toThrow(/not found/);
  });

  it('throws on unknown operator', () => {
    const target = { items: [{ id: 'a', val: 1 }] };
    const modifier: Modifier<typeof target> = {
      items: [{ '@unknown': {} } as any],
    };
    expect(() => modify(target, modifier)).toThrow(/Unknown operator/);
  });

  it('handles multiple array operations', () => {
    const target = {
      items: [
        { id: 'a', val: 1 },
        { id: 'b', val: 2 },
      ],
    };
    const modifier: Modifier<typeof target> = {
      items: [
        { id: 'c', val: 3 },
        {
          '@insert': {
            after: 'a',
            data: { id: 'x', val: 99 },
          },
        },
      ],
    };
    modify(target, modifier);
    expect(target.items).toEqual([
      { id: 'a', val: 1 },
      { id: 'x', val: 99 },
      { id: 'b', val: 2 },
      { id: 'c', val: 3 },
    ]);
  });
});
