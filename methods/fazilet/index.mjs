import {calculateFaziletV2} from './implementation/v2/candidate.mjs';
import {fields} from '../../core/input.mjs';
export {calculateFaziletV2};
export function calculate(options) {
  fields(options, ["date", "latitude", "longitude", "timeZone"]);
  const {date, ...point} = options;
  return calculateFaziletV2(date, point);
}
