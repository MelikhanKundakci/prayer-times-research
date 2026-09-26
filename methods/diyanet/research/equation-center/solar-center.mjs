// Research-only hybrid solar coordinates.
//
// This isolates the NOAA/Meeus time-dependent equation of center while
// retaining the baseline USNO mean longitude, obliquity, equatorial
// conversion, and equation-of-time convention. It is a sensitivity provider,
// not a named end-to-end ephemeris and not evidence of institutional use.
//
// Input: Julian date in UTC (days). Output angles are degrees except
// rightAscension (hours) and equationOfTimeHours (hours).

const RAD_PER_DEGREE = Math.PI / 180;
const JULIAN_DATE_J2000 = 2451545;
const DAYS_PER_JULIAN_CENTURY = 36525;

function wrap(value, period) {
  return ((value % period) + period) % period;
}

/** NOAA equation of center in degrees for Julian centuries from J2000. */
export function noaaEquationOfCenter(julianCenturies) {
  if (!Number.isFinite(julianCenturies)) {
    throw new TypeError('Finite Julian centuries required');
  }

  const meanAnomalyDegrees =
    357.52911 +
    julianCenturies * (35999.05029 - 0.0001537 * julianCenturies);
  const meanAnomalyRadians = meanAnomalyDegrees * RAD_PER_DEGREE;
  const sinM = Math.sin(meanAnomalyRadians);
  const sin2M = Math.sin(2 * meanAnomalyRadians);
  const sin3M = Math.sin(3 * meanAnomalyRadians);

  return (
    sinM * (1.914602 - julianCenturies * (0.004817 + 0.000014 * julianCenturies)) +
    sin2M * (0.019993 - 0.000101 * julianCenturies) +
    sin3M * 0.000289
  );
}

/**
 * USNO-coordinate calculation with only its longitude correction replaced.
 * @param {number} julianDate UTC Julian date, days
 * @returns {{declination:number,equationOfTimeHours:number,rightAscension:number}}
 */
export function solarCoordinatesCenterHybrid(julianDate) {
  if (!Number.isFinite(julianDate)) {
    throw new TypeError('Finite Julian date required');
  }

  const daysFromJ2000 = julianDate - JULIAN_DATE_J2000;
  const meanLongitudeDegrees = wrap(280.459 + 0.98564736 * daysFromJ2000, 360);
  const equationOfCenterDegrees = noaaEquationOfCenter(
    daysFromJ2000 / DAYS_PER_JULIAN_CENTURY,
  );
  const eclipticLongitudeDegrees = meanLongitudeDegrees + equationOfCenterDegrees;
  const obliquityDegrees = 23.439 - 0.00000036 * daysFromJ2000;
  const longitudeRadians = eclipticLongitudeDegrees * RAD_PER_DEGREE;
  const obliquityRadians = obliquityDegrees * RAD_PER_DEGREE;

  const rightAscensionHours = wrap(
    Math.atan2(
      Math.cos(obliquityRadians) * Math.sin(longitudeRadians),
      Math.cos(longitudeRadians),
    ) / RAD_PER_DEGREE / 15,
    24,
  );
  const declinationDegrees =
    Math.asin(Math.sin(obliquityRadians) * Math.sin(longitudeRadians)) /
    RAD_PER_DEGREE;
  const equationOfTimeHours =
    wrap(meanLongitudeDegrees / 15 - rightAscensionHours + 12, 24) - 12;

  return {
    declination: declinationDegrees,
    equationOfTimeHours,
    rightAscension: rightAscensionHours,
  };
}
