import {calculateOwnFcnaReviewed} from './implementation/asr-review/calculate.mjs';
import {plainRecord} from '../../core/input.mjs';
export {calculateOwnFcnaReviewed};
export function calculate(options) {
  plainRecord(options);
  const {numerical = {ephemeris: 'usno', rounding: 'nearest'}, ...input} = options;
  plainRecord(numerical);
  return calculateOwnFcnaReviewed(input, numerical);
}
