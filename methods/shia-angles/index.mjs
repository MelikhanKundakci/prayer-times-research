import {calculateDay} from './implementation/model.mjs';
import {plainRecord} from '../../core/input.mjs';
export {calculateDay};
export function calculate(options) { return calculateDay(plainRecord(options)); }
