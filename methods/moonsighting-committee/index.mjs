import {calculateGeometry} from './implementation/moonsighting-usno-v4.2.mjs';
import {calculatePublishedDhuhr} from './implementation/published-dhuhr.mjs';
import {variantInput} from '../../core/input.mjs';
export {calculateGeometry};
export {calculatePublishedDhuhr};
export function calculate(options) {
  const {variant, input} = variantInput(options, 'usno-v4.2', ['usno-v4.2', 'published-dhuhr-five-minutes']);
  return variant === 'published-dhuhr-five-minutes' ? calculatePublishedDhuhr(input) : calculateGeometry(input);
}
