import {calculateDay} from './implementation/model.mjs';
import {calculateArcCompatibility} from './implementation/arc-compatibility/calculate.mjs';
import {variantInput} from '../../core/input.mjs';
export {calculateDay, calculateArcCompatibility};
export function calculate(options) {
  const {variant,input} = variantInput(options,'own',['own','arc-publisher-compatibility']);
  return variant==='own' ? calculateDay(input) : calculateArcCompatibility(input);
}
