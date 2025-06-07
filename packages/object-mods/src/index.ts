type InsertOperation<T> = {
  '@insert': {
    before?: string;
    after?: string;
    data: T;
  };
};

type UpdateOperation<T> = {
  '@update': {
    id: string;
    data: Partial<T>;
  };
};

type ModifierForArray<T> = Array<InsertOperation<T> | UpdateOperation<T> | Partial<T>>;

export type Modifier<T> = {
  [K in keyof T]?: T[K] extends Array<infer U> ? ModifierForArray<U> : T[K]; // direct value for non-array keys
};

export function modify<T extends object>(target: T, modifier: Modifier<T>): T {
  for (const key in modifier) {
    const modVal: any = modifier[key];
    const targetVal = target[key];

    // Handle missing or primitive target keys
    if (
      targetVal === undefined ||
      isPrimitive(modVal) ||
      Array.isArray(targetVal) !== Array.isArray(modVal)
    ) {
      (target as any)[key] = modVal;
      continue;
    }

    // Handle arrays with operator logic
    if (Array.isArray(modVal) && Array.isArray(targetVal)) {
      for (const op of modVal) {
        if (isOperatorObject(op)) {
          if ('@insert' in op) {
            const { before, after, data } = op['@insert'];
            const index = targetVal.findIndex((item: any) => item.id === (before ?? after));

            if (index === -1) {
              throw new Error(`Item with id '${before ?? after}' not found in '${key}'`);
            }

            const insertIndex = before ? index : index + 1;
            targetVal.splice(insertIndex, 0, data);
          } else if ('@update' in op) {
            const { id, data } = op['@update'];
            const item = targetVal.find((item: any) => item.id === id);
            if (!item) {
              throw new Error(`Item with id '${id}' not found in '${key}'`);
            }
            modify(item, data); // deep merge into the matched item
          } else {
            throw new Error(`Unknown operator in modifier: ${JSON.stringify(op)}`);
          }
        } else {
          targetVal.push(op);
        }
      }
      continue;
    }

    // Recursively merge nested objects
    if (isObject(modVal) && isObject(targetVal)) {
      modify(targetVal, modVal as any); // recursive call
      continue;
    }

    // Fallback: direct overwrite
    (target as any)[key] = modVal;
  }

  return target;
}

// --- Helpers

function isObject(value: any): value is object {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPrimitive(value: any): value is string | number | boolean | null | undefined {
  return typeof value !== 'object' || value === null;
}

function isOperatorObject(obj: any): boolean {
  if (typeof obj !== 'object' || obj === null) return false;
  return Object.keys(obj).some((key) => key.startsWith('@'));
}

export function handleModifier<T extends object>(modifier: Modifier<T>): T {
  const target: T = {} as T; // Create an empty target object
  return modify(target, modifier);
}

export type WithModifiers<T> = {
  [K in keyof T]: T[K] extends (infer U)[]
    ? Array<ModifierForArray<WithModifiers<U>>> // recurse into array elements
    : T[K] extends object
      ? WithModifiers<T[K]> // recurse into nested object
      : T[K]; // primitive — leave as-is
};
