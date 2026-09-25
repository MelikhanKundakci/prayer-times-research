// Strict access to the unchanged, frozen research candidate. No alternate recipe.
import { calculateCandidate } from './candidate.mjs';

const FIELDS = Object.freeze(['latitude', 'longitude', 'elevationMeters', 'cityWidthKm',
  'pressureMillibars', 'temperatureCelsius', 'timeZone']);

export function calculateCandidateStrict(date, point) {
  if (arguments.length !== 2) throw new TypeError('Expected exactly date and point; no recipe overrides.');
  if (!point || typeof point !== 'object' || Array.isArray(point) ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(point))) {
    throw new TypeError('Point must be a plain record.');
  }
  for (const key of Reflect.ownKeys(point)) {
    if (!FIELDS.includes(key)) throw new TypeError('Unknown point field: ' + String(key));
  }
  for (const key of FIELDS) {
    const descriptor = Object.getOwnPropertyDescriptor(point, key);
    if (!descriptor || !Object.hasOwn(descriptor, 'value') || descriptor.value === undefined) {
      throw new TypeError('Explicit own data field required: ' + key);
    }
  }
  // Date, finite numeric ranges and Asia/Dubai are checked by the frozen core.
  return calculateCandidate(date, point);
}
