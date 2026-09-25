import {calculateOmanV2} from './implementation/v2/candidate.mjs';
import {plainRecord} from '../../core/input.mjs';
export {calculateOmanV2};
export function calculate(options) { return calculateOmanV2(plainRecord(options)); }
