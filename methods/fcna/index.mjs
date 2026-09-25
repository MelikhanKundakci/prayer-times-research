import {calculateOwnFcnaReviewed} from './implementation/asr-review/calculate.mjs';
import {calculateRosevilleStartTimes} from './implementation/roseville.mjs';
import {plainRecord, fields} from '../../core/input.mjs';
export {calculateOwnFcnaReviewed, calculateRosevilleStartTimes};
export function calculate(options) {
  plainRecord(options);
  const {variant = 'own-reviewed', ...selected} = options;
  if (variant === 'roseville-utc12-ceil') {
    fields(selected, ['date']);
    return calculateRosevilleStartTimes(selected.date);
  }
  if (variant !== 'own-reviewed') throw new RangeError(`Unknown FCNA variant: ${variant}`);
  const {numerical = {ephemeris: 'usno', rounding: 'nearest'}, ...input} = selected;
  plainRecord(numerical);
  return calculateOwnFcnaReviewed(input, numerical);
}
