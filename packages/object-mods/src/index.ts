type InsertOperation<T> = {
  '@insert': {
    before?: string;
    after?: string;
    data: T;
  };
};

type ModifierForArray<T> = Array<InsertOperation<T> | Partial<T>>;

export type Modifier<T> = {
  [K in keyof T]?: T[K] extends Array<infer U> ? ModifierForArray<U> : T[K]; // direct value for non-array keys
};

export function modify<T extends object>(target: T, modifier: Modifier<T>): T {
  for (const key in modifier) {
    const modVal = modifier[key];
    const targetVal = target[key];

    // If key doesn't exist in target, just assign
    if (targetVal === undefined || !Array.isArray(targetVal)) {
      target[key] = modVal as any;
      continue;
    }

    // Handle arrays with operator logic
    if (Array.isArray(modVal)) {
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
          } else {
            throw new Error(`Unknown operator in modifier: ${JSON.stringify(op)}`);
          }
        } else {
          // fallback: push non-operator objects to the array (optional behavior)
          targetVal.push(op);
        }
      }
    }
  }

  return target;
}

export function handleModifier<T extends object>(modifier: Modifier<T>): T {
  const target: T = {} as T; // Create an empty target object
  return modify(target, modifier);
}

function isOperatorObject(obj: any): boolean {
  if (typeof obj !== 'object' || obj === null) return false;
  return Object.keys(obj).some((key) => key.startsWith('@'));
}
