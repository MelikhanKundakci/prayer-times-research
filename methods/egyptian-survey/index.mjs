import {calculateDay} from './implementation/calculate.mjs';
import {fields} from '../../core/input.mjs';
// Same conservative regional rectangle used in the research adapter.
// This is neither a political boundary nor an accuracy guarantee.
export function calculate(options) {
  fields(options, ['date', 'latitude', 'longitude', 'timeZone']);
  const {date, latitude, longitude, timeZone} = options;
  if (typeof date !== 'string' || !/^20\d\d-\d\d-\d\d$/.test(date)) throw new RangeError('Date must be YYYY-MM-DD in 2000–2099');
  if (!Number.isFinite(latitude) || latitude < 22 || latitude > 32 ||
      !Number.isFinite(longitude) || longitude < 24 || longitude > 37) throw new RangeError('Egypt research rectangle: latitude22..32, longitude24..37');
  if (timeZone !== 'Africa/Cairo') throw new RangeError('Africa/Cairo is required');
  return calculateDay(date, {latitude, longitude, timeZone}, 'usno-no-offset');
}
