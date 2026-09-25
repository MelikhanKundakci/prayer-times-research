import {calculateNorthernReviewed} from './implementation/north/quality-model.mjs';
import {calculateNorthernCalendar} from './implementation/north/model.mjs';
import {calculateMissingWindowCalendar} from './implementation/missing-window/model.mjs';
import {calculateMissingWindowReviewed} from './implementation/missing-window/quality-model.mjs';
import {calculateDay as calculateLowLatitude} from './implementation/low-latitude/model.mjs';
import {calculateDay as calculateSouth} from './implementation/south/candidate.mjs';
import {variantInput} from '../../core/input.mjs';
export {calculateNorthernReviewed, calculateNorthernCalendar, calculateMissingWindowCalendar, calculateMissingWindowReviewed, calculateLowLatitude, calculateSouth};
const variants = Object.freeze({
  'north-missing-window': calculateMissingWindowReviewed,
  'north-reviewed': calculateNorthernReviewed,
  'north-baseline': calculateNorthernCalendar,
  'low-latitude': calculateLowLatitude,
  'south': calculateSouth,
});
export function calculate(options) {
  const {variant, input} = variantInput(options, 'north-missing-window', Object.keys(variants));
  return variants[variant](input);
}
