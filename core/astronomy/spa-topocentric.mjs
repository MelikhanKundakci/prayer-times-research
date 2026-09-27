/**
 * Observer-relative SPA coordinates at the fixed zero-elevation surface.
 * Own implementation of Reda–Andreas, NREL TP-560-34302 (2008), equations
 * 33–41. Uses the existing licensed geocentric SPA provider; no NREL C code.
 * This corrects solar parallax only. No atmospheric or horizon correction is
 * applied here, and there is no inferred GPS elevation or terrain.
 */
import {apparentGeocentricCoordinatesSPA} from './spa-point.mjs';

const RAD = Math.PI / 180;
const norm = (value, period = 360) => ((value % period) + period) % period;
const signed = value => norm(value + 180) - 180;

export const SPA_TOPOCENTRIC_CONVENTIONS = Object.freeze({
  id: 'SPA-topocentric-zero-elevation-v1',
  coordinates: 'Reda–Andreas SPA apparent topocentric solar coordinates',
  deltaTSeconds: 69.184,
  assumedUt1MinusUtcSeconds: 0,
  timeScaleMeaning: 'fixed TT−UT1 assumption with UT1=UTC; not a future leap-second or Earth-rotation prediction',
  hourAngle: 'GAST + east-positive longitude − apparent topocentric right ascension',
  equationOfTimeMeaning: 'observer-dependent effective UTC-phase adapter derived from GAST−topocentric RA',
  topocentricParallax: true,
  atmosphericRefractionApplied: false,
  observerElevationMetres: 0,
  observerElevationMeaning: 'SPA zero-elevation reference surface; no measured elevation or local terrain',
  terrain: null,
});

/**
 * Declination in degrees; right ascension and effective EOT in hours.
 * The observer coordinates are explicit; no location inference or elevation
 * option is accepted. Longitudes +180 and −180 are the same meridian.
 */
export function solarCoordinatesSPATopocentric(julianDate, latitude, longitude) {
  if (arguments.length !== 3) throw new TypeError('Julian date, latitude and longitude are required');
  if (!Number.isFinite(julianDate)) throw new TypeError('Finite Julian date required');
  if (!Number.isFinite(latitude) || Math.abs(latitude) > 90) throw new RangeError('Latitude must be from −90° through 90°');
  if (!Number.isFinite(longitude) || Math.abs(longitude) > 180) throw new RangeError('Longitude must be from −180° through 180°');
  longitude = longitude === 180 ? -180 : longitude;
  const solar = apparentGeocentricCoordinatesSPA(julianDate);
  const phi = latitude * RAD;
  const delta = solar.declination * RAD;
  const hourAngleDegrees = signed(solar.apparentSiderealTime + longitude - solar.rightAscension);
  const hourAngle = hourAngleDegrees * RAD;
  const parallaxDegrees = 8.794 / (3600 * solar.earthSunDistanceAu);
  const sinParallax = Math.sin(parallaxDegrees * RAD);
  const reducedLatitude = Math.atan(0.99664719 * Math.tan(phi));
  // SPA equations 35–36 with the elevation terms fixed at zero.
  const x = Math.cos(reducedLatitude);
  const y = 0.99664719 * Math.sin(reducedLatitude);
  const denominator = Math.cos(delta) - x * sinParallax * Math.cos(hourAngle);
  const rightAscensionParallax = Math.atan2(-x * sinParallax * Math.sin(hourAngle), denominator);
  const topocentricDeclination = Math.atan2(
    (Math.sin(delta) - y * sinParallax) * Math.cos(rightAscensionParallax), denominator,
  ) / RAD;
  const topocentricRightAscension = norm(solar.rightAscension + rightAscensionParallax / RAD);
  const topocentricHourAngle = hourAngleDegrees - rightAscensionParallax / RAD;
  const utcPhaseDegrees = norm(julianDate + 0.5, 1) * 360;
  const effectiveEquationOfTimeDegrees = signed(
    solar.apparentSiderealTime - topocentricRightAscension - utcPhaseDegrees + 180,
  );
  return {
    declination: topocentricDeclination,
    rightAscension: topocentricRightAscension / 15,
    equationOfTimeHours: effectiveEquationOfTimeDegrees / 15,
    apparentSiderealTimeDegrees: solar.apparentSiderealTime,
    rightAscensionDegrees: topocentricRightAscension,
    geocentricDeclinationDegrees: solar.declination,
    geocentricRightAscensionDegrees: solar.rightAscension,
    rightAscensionParallaxDegrees: rightAscensionParallax / RAD,
    equatorialHorizontalParallaxDegrees: parallaxDegrees,
    topocentricHourAngleDegrees: topocentricHourAngle,
    earthSunDistanceAu: solar.earthSunDistanceAu,
    effectiveEquationOfTimeDegrees,
    ...SPA_TOPOCENTRIC_CONVENTIONS,
  };
}
