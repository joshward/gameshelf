export const isArrayOf = <T>(value: unknown, type: new (...args: unknown[]) => T): value is Array<T> => {
  if (!Array.isArray(value)) {
    return false;
  }

  return value.every(item => item instanceof type);
};

export type Dict<TValue> = { [key: string]: TValue };

export const buildLookup = <TValue>(
  values: TValue[],
  mapper: (item: TValue) => string | number
): Dict<TValue> => {
  const dict: Dict<TValue> = {};

  values.forEach(value => {
    dict[mapper(value).toString()] = value;
  });

  return dict;
}

export const asArray = <TElement>(element: TElement | undefined): Array<TElement> => {
  if (element == null) {
    return [];
  }

  return [element];
}
