import {calculateBanuriStrict} from './implementation/strict-api.mjs';
import {calculateBanuriZawalPlusFive} from './implementation/zawal-plus-five.mjs';
import {fields, variantInput} from '../../core/input.mjs';
export {calculateBanuriStrict};
export {calculateBanuriZawalPlusFive};
export function calculate(options) {
  const {variant, input} = variantInput(options, 'strict', ['strict', 'zawal-plus-five']);
  fields(input, ["date", "latitude", "longitude", "timeZone"]);
  const {date, ...point} = input;
  return variant === 'strict' ? calculateBanuriStrict(date, point) : calculateBanuriZawalPlusFive(date, point);
}
