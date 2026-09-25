import {calculateIndonesiaStrict} from './implementation/api.mjs';
import {plainRecord} from '../../core/input.mjs';
export {calculateIndonesiaStrict};
export function calculate(options) { return calculateIndonesiaStrict(plainRecord(options)); }
