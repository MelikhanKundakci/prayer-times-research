import {calculateIstanbul} from './implementation/calculate.mjs';
import {plainRecord} from '../../core/input.mjs';
export {calculateIstanbul};
export function calculate(options) { return calculateIstanbul(plainRecord(options)); }
