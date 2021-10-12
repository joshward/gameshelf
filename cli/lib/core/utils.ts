import slugify from 'slugify'

export function wait (timeout = 1000): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, timeout))
}

export const isArrayOf = <T>(value: unknown, type: new (...args: unknown[]) => T): value is Array<T> => {
  if (!Array.isArray(value)) {
    return false
  }

  return value.every(item => item instanceof type)
}

export function toArray<T> (value?: T | T[]): T[] {
  if (!value) {
    return []
  }

  if (Array.isArray(value)) {
    return value
  }

  return [value]
}

export function asInt (value: string): number | undefined {
  const parsed = parseInt(value, 10)

  if (Number.isInteger(parsed)) {
    return parsed
  }

  return undefined
}

export function collapseWhiteSpace (value: string): string {
  return String(value).replace(/\s+/g, ' ')
}

export function valueIn<T> (needle: T, ...haystack: T[]): boolean {
  return haystack?.includes(needle) ?? false
}

export function toSlug (value: string): string {
  return slugify(value, {
    lower: true,
    replacement: '-',
    strict: true
  })
}

export function sliceTopGroup <T>(
  items: T[],
  count: number,
  comparer: (a: T, b: T) => number
): T[] {
  const sorted = items.sort(comparer)
  const results: T[] = []
  let index = 0

  for (const item of sorted) {
    if (index >= count && (index === 0 || comparer(items[index - 1], item) !== 0)) {
      return results
    }

    index += 1

    results.push(item)
  }

  return items
}

export function hasOwnProperty<K extends PropertyKey> (obj: unknown, prop: K): obj is Record<K, unknown> {
  return typeof obj === 'object' && obj != null && Object.prototype.hasOwnProperty.call(obj, prop)
}

export function safeGetValue (obj: unknown, prop: PropertyKey): unknown {
  return hasOwnProperty(obj, prop) ? obj[prop] : undefined
}

// Utils
type ObjectType = Record<PropertyKey, unknown>;
type PickByValue<OBJ_T, VALUE_T> // From https://stackoverflow.com/a/55153000
  = Pick<OBJ_T, { [K in keyof OBJ_T]: OBJ_T[K] extends VALUE_T ? K : never }[keyof OBJ_T]>;
type ObjectEntries<OBJ_T> // From https://stackoverflow.com/a/60142095
  = { [K in keyof OBJ_T]: [keyof PickByValue<OBJ_T, OBJ_T[K]>, OBJ_T[K]] }[keyof OBJ_T][];

// Function
export function getTypedObjectEntries<OBJ_T extends ObjectType>(obj: OBJ_T): ObjectEntries<OBJ_T> {
  return Object.entries(obj) as ObjectEntries<OBJ_T>
}

export function validateSet<T> (value: T): asserts value is NonNullable<T> {
  if (value == null) {
    throw new Error('Value is expected to be non null')
  }
}

export function getSet<T> (value: T): NonNullable<T> {
  validateSet(value)
  return value
}

export function clamp (value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function wrap (value: number, top: number): number {
  while (value < 0) {
    value += top
  }
  return value % top
}

export function createDateFromTime (time: number): Date {
  const date = new Date()
  date.setTime(time)
  return date
}
