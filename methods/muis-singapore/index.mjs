import {calculateSingaporeCandidate} from './implementation/candidate.mjs';
import {plainRecord} from '../../core/input.mjs';
export {calculateSingaporeCandidate};
export function calculate(options) { return calculateSingaporeCandidate(plainRecord(options)); }
