// Opt-in civil-row ephemeris compatibility hypothesis; original defaults unchanged.
import {calculateDay as lowDay, calculateYear as lowYear} from './low-model.mjs';
import {calculateDay as southDay, calculateYear as southYear} from './south-model.mjs';

export const VARIANTS = Object.freeze(['low-latitude-civil-row', 'south-civil-row']);
function exact(input, names) {
  if (!input || Object.getPrototypeOf(input) !== Object.prototype) throw new TypeError('Plain own-data input required');
  const descriptors = Object.getOwnPropertyDescriptors(input), keys = Reflect.ownKeys(descriptors);
  if (keys.length !== names.length || keys.some(key => typeof key !== 'string' || !names.includes(key)
    || !descriptors[key].enumerable || !Object.hasOwn(descriptors[key], 'value')))
    throw new TypeError('Exactly the documented own enumerable data fields required');
}
function annotateDay(result, variant) {
  result.profileId = `diyanet-${variant}-research`;
  result.variant = variant;
  result.researchOnly = true;
  result.ephemerisDate = result.date;
  // Preserve this legacy field as the absolute UTC time carrier, not solar sampling date.
  result.solarTimeCarrierDate = result.solarCalculationDate;
  result.parameters = {...result.parameters,
    declinationEpoch: 'requested civil row UTC00', equationOfTimeEpoch: 'requested civil row UTC00'};
  result.qualityFlags = ['experimental-compatibility-hypothesis', 'civil-row-ephemeris-unconfirmed',
    'production-point-unverified', 'not-notification-eligible'];
  result.limitations.unshift('Civil-row UTC00 sampling is an opt-in compatibility hypothesis, not an official production rule or a more accurate physical ephemeris.');
  return result;
}
function annotateYear(result, variant) {
  result.profileId = `diyanet-${variant}-research`;
  result.variant = variant;
  result.researchOnly = true;
  result.days = result.days.map(day => annotateDay(day, variant));
  return result;
}
export function calculateLowLatitudeDay(input) {
  if (arguments.length !== 1) throw new TypeError('Exactly one day input required');
  // Underlying low model enforces the unchanged strict four-field contract.
  return annotateDay(lowDay(input), 'low-latitude-civil-row');
}
export function calculateLowLatitudeYear(input) {
  if (arguments.length !== 1) throw new TypeError('Exactly one year input required');
  return annotateYear(lowYear(input), 'low-latitude-civil-row');
}
export function calculateSouthDay(input) {
  if (arguments.length !== 1) throw new TypeError('Exactly one day input required');
  exact(input, ['date', 'latitude', 'longitude', 'timeZone']);
  return annotateDay(southDay({...input, variant: 'usno-daily-utc0'}), 'south-civil-row');
}
export function calculateSouthYear(input) {
  if (arguments.length !== 1) throw new TypeError('Exactly one year input required');
  exact(input, ['year', 'latitude', 'longitude', 'timeZone']);
  return annotateYear(southYear({...input, variant: 'usno-daily-utc0'}), 'south-civil-row');
}
