import {calculateDay as calculateSinglePoint} from './implementation/single-point/model.mjs';
import {calculateDay as calculateMultipoint} from './implementation/multipoint/model.mjs';
import {calculateDay as calculateTwoPoint} from './implementation/two-point/review-independent-model.mjs';
import {calculateDay as calculateMapR19} from './implementation/multipoint/map-candidate/model.mjs';
import {variantInput} from '../../core/input.mjs';
export {calculateSinglePoint, calculateMultipoint, calculateTwoPoint, calculateMapR19};
const variants = Object.freeze({
  'single-point-own': {run: calculateSinglePoint, parameter: 'candidate', value: 'usno-fixed'},
  'multipoint': {run: calculateMultipoint, parameter: 'mode', value: 'all-points-extrema'},
  'sgr01-two-point': {run: calculateTwoPoint},
  'kdh03-map-r19': {run: calculateMapR19, parameter: 'mode', value: 'map-plus-r19'},
});
export function calculate(options) {
  const {variant, input} = variantInput(options, 'single-point-own', Object.keys(variants));
  const {run, parameter, value} = variants[variant];
  if (parameter) {
    if (Object.hasOwn(input, parameter) && input[parameter] !== value) throw new RangeError(`The selected variant fixes ${parameter}=${value}`);
    input[parameter] = value;
  }
  return run(input);
}
