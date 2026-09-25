import { calculateExperimentalDay } from '../calculate.mjs';

// Re-selected from the unchanged original grid, using all 151 now-known days.
// Numerical values remain empirical, not a MARA or universal Ibadi standard.
export const CANDIDATE = Object.freeze({
  ephemeris: 'noaa', anchors: 'utc-noon', fajrAngle: 18, ishaAngle: 18,
  asrFactor: 1, rounding: 'ceil', offsets: Object.freeze([0, 0, 5, 5, 5, 0]),
});
export function calculateOmanV2(input) {
  if (!input || Object.getPrototypeOf(input) !== Object.prototype) throw new TypeError('Plain own-data input required');
  const descriptors = Object.getOwnPropertyDescriptors(input);
  const keys = Reflect.ownKeys(descriptors);
  const expected = ['date', 'latitude', 'longitude', 'timeZone'];
  if (keys.length !== expected.length || keys.some(key => typeof key !== 'string' || !expected.includes(key))) throw new TypeError('Exactly date, latitude, longitude, timeZone required');
  if (keys.some(key => !Object.hasOwn(descriptors[key], 'value') || !descriptors[key].enumerable)) throw new TypeError('Enumerable own data properties required; accessors are not evaluated');
  const result = calculateExperimentalDay(input, CANDIDATE);
  return { ...result, model: { ...result.model, id: 'oman-mara-empirical-v2', version: '0.2.0', productionReady: false }, notificationEligible: false };
}
