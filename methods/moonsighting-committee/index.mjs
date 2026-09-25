import {calculateGeometry} from './implementation/moonsighting-usno-v4.2.mjs';
import {plainRecord} from '../../core/input.mjs';
export {calculateGeometry};
export function calculate(options) { return calculateGeometry(plainRecord(options)); }
