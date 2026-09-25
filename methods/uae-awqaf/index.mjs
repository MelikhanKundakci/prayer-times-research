import {calculateCandidateStrict} from './implementation/api.mjs';
import {calculateOwnRayCandidate} from './implementation/own-ray/candidate.mjs';
import {fields, variantInput} from '../../core/input.mjs';
export {calculateCandidateStrict, calculateOwnRayCandidate};
export function calculate(options) {
  const {variant, input} = variantInput(options, 'v2', ['v2', 'own-ray']);
  fields(input, ["date", "latitude", "longitude", "elevationMeters", "cityWidthKm", "pressureMillibars", "temperatureCelsius", "timeZone"]);
  const {date, ...point} = input;
  return (variant === 'own-ray' ? calculateOwnRayCandidate : calculateCandidateStrict)(date, point);
}
