// Source-calendar-free sensitivity channels around the frozen center hybrid.
// Input Julian date is UTC days. declination is degrees; right ascension is
// hours; equation of time is hours. These mixed channels are diagnostics,
// not physically self-consistent ephemerides.
import { solarCoordinatesUSNO } from '../../../../core/astronomy/solar-usno-v2.mjs';
import { solarCoordinatesCenterHybrid } from './solar-center.mjs';

export const channelProviders = Object.freeze({
  baselineUSNO: solarCoordinatesUSNO,
  fullCenterHybrid: solarCoordinatesCenterHybrid,
  eotOnly: solarCoordinatesEOTOnly,
  declinationOnly: solarCoordinatesDeclinationOnly,
});

/** Hybrid EOT and its matching RA, with baseline declination. */
export function solarCoordinatesEOTOnly(julianDate) {
  const baseline = solarCoordinatesUSNO(julianDate);
  const hybrid = solarCoordinatesCenterHybrid(julianDate);
  return {
    declination: baseline.declination,
    equationOfTimeHours: hybrid.equationOfTimeHours,
    rightAscension: hybrid.rightAscension,
  };
}

/** Hybrid declination with baseline EOT and its matching RA. */
export function solarCoordinatesDeclinationOnly(julianDate) {
  const baseline = solarCoordinatesUSNO(julianDate);
  const hybrid = solarCoordinatesCenterHybrid(julianDate);
  return {
    declination: hybrid.declination,
    equationOfTimeHours: baseline.equationOfTimeHours,
    rightAscension: baseline.rightAscension,
  };
}
