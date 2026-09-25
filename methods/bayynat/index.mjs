import {calculateDay} from './implementation/selected-model.mjs';
import {calculateNearestCandidate} from './implementation/nearest-candidate.mjs';
import {variantInput} from '../../core/input.mjs';
export {calculateDay,calculateNearestCandidate};
export function calculate(options) {
  const {variant,input}=variantInput(options,'point-utc12-h5over6-ceil',['point-utc12-h5over6-ceil','point-utc12-h5over6-nearest']);
  return variant==='point-utc12-h5over6-nearest'?calculateNearestCandidate(input):calculateDay(input);
}
