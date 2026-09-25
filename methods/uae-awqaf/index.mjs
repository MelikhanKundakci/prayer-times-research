import {calculateCandidateStrict} from './implementation/api.mjs';
import {fields} from '../../core/input.mjs';
export {calculateCandidateStrict};
export function calculate(options) {
  fields(options, ["date", "latitude", "longitude", "elevationMeters", "cityWidthKm", "pressureMillibars", "temperatureCelsius", "timeZone"]);
  const {date, ...point} = options;
  return calculateCandidateStrict(date, point);
}
