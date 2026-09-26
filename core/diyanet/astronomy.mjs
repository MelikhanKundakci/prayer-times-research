import { solarCoordinatesUSNO } from '../astronomy/solar-usno-v2.mjs';

export const DAY_MS = 86_400_000;
export const HOUR_MS = 3_600_000;
export const MINUTE_MS = 60_000;
const UNIX_JULIAN_DATE = 2_440_587.5;

/** Evaluate an injected ephemeris provider at a UTC epoch in milliseconds. */
export function solarAt(epochMs, provider = solarCoordinatesUSNO) {
  if (!Number.isFinite(epochMs)) throw new TypeError('UTC epoch milliseconds must be finite');
  if (typeof provider !== 'function') throw new TypeError('Astronomy provider must be a function');
  const result = provider(epochMs / DAY_MS + UNIX_JULIAN_DATE);
  if (!result || !Number.isFinite(result.declination) || !Number.isFinite(result.equationOfTimeHours)) {
    throw new RangeError('Astronomy provider must return finite declination (degrees) and equationOfTimeHours (hours)');
  }
  return { declinationDegrees: result.declination, equationOfTimeHours: result.equationOfTimeHours };
}

export function julianDateAt(epochMs) {
  if (!Number.isFinite(epochMs)) throw new TypeError('UTC epoch milliseconds must be finite');
  return epochMs / DAY_MS + UNIX_JULIAN_DATE;
}
