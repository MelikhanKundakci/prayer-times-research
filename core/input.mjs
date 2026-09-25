// Interface checks only. Numerical validation remains with each research model.
export function plainRecord(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(value))) {
    throw new TypeError('Expected a plain input record');
  }
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (typeof key !== 'string' || !descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) {
      throw new TypeError('Only enumerable own data fields are accepted');
    }
    if (descriptor.value === undefined) throw new TypeError(`Explicit undefined field: ${key}`);
  }
  return value;
}
export function fields(value, required, optional = []) {
  plainRecord(value);
  for (const key of Object.keys(value)) {
    if (!required.includes(key) && !optional.includes(key)) throw new TypeError(`Unknown field: ${key}`);
  }
  for (const key of required) if (!Object.hasOwn(value, key)) throw new TypeError(`Required field: ${key}`);
  return value;
}
export function variantInput(value, fallback, variants) {
  plainRecord(value);
  const {variant = fallback, ...input} = value;
  if (typeof variant !== 'string' || !variants.includes(variant)) throw new RangeError(`Unknown variant: ${String(variant)}`);
  return {variant, input};
}
