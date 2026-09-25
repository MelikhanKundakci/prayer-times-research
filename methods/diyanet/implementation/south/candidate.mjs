// Predeclared development gate selected UTC00; no source values used at runtime.
import { calculateDay as day, calculateYear as year } from './model.mjs';
export const CANDIDATE = 'usno-daily-utc0';
function exact(input, names) {
  if (!input || Object.getPrototypeOf(input) !== Object.prototype) throw new TypeError('Plain own-data input required');
  const d = Object.getOwnPropertyDescriptors(input), keys = Reflect.ownKeys(d);
  if (keys.length !== names.length || keys.some(k => typeof k !== 'string' || !names.includes(k) || !d[k].enumerable || !Object.hasOwn(d[k], 'value')))
    throw new TypeError('Exactly the documented candidate inputs required; no variant or parameter overrides');
}
export function calculateDay(input) {
  if (arguments.length !== 1) throw new TypeError('Exactly one input required');
  exact(input, ['date', 'latitude', 'longitude', 'timeZone']);
  return day({ ...input, variant: CANDIDATE });
}
export function calculateYear(input) {
  if (arguments.length !== 1) throw new TypeError('Exactly one input required');
  exact(input, ['year', 'latitude', 'longitude', 'timeZone']);
  return year({ ...input, variant: CANDIDATE });
}
