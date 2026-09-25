import {calculateBanuriStrict} from './implementation/strict-api.mjs';
import {fields} from '../../core/input.mjs';
export {calculateBanuriStrict};
export function calculate(options) {
  fields(options, ["date", "latitude", "longitude", "timeZone"]);
  const {date, ...point} = options;
  return calculateBanuriStrict(date, point);
}
