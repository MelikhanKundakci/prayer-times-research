// Independent expressions of published solar approximations; no Diyanet claim.
// Source and the explicitly hybrid current-series control: README.md.
const RAD = Math.PI / 180;
const wrap = (value, period) => ((value % period) + period) % period;

export const SOLAR_VARIANTS = Object.freeze([
  'current-atan2',
  'legacy-atan2',
  'legacy-series',
  'current-series',
]);

export function solarCoordinatesVariant(julianDate, variant) {
  if (!Number.isFinite(julianDate)) throw new Error('Finite Julian date required');
  if (!SOLAR_VARIANTS.includes(variant)) throw new RangeError('Unknown solar variant');
  const days = julianDate - 2451545;
  const legacy = variant.startsWith('legacy-');
  const anomaly = legacy
    ? wrap(357.528 + .9856003 * days, 360)
    : wrap(357.529 + .98560028 * days, 360);
  const meanLongitude = legacy
    ? wrap(280.460 + .9856474 * days, 360)
    : wrap(280.459 + .98564736 * days, 360);
  const longitude = meanLongitude + 1.915 * Math.sin(anomaly * RAD) + .020 * Math.sin(2 * anomaly * RAD);
  const obliquity = legacy ? 23.439 - .0000004 * days : 23.439 - .00000036 * days;
  let rightAscension;
  if (variant.endsWith('-atan2')) {
    // The current branch deliberately preserves solar-usno-v2 expression order.
    rightAscension = wrap(Math.atan2(Math.cos(obliquity * RAD) * Math.sin(longitude * RAD), Math.cos(longitude * RAD)) / RAD / 15, 24);
  } else {
    // Published two-term expansion; current-series substitutes current constants
    // only as an isolation control and is not the NASA-hosted recipe.
    const tangentSquared = Math.tan(obliquity * RAD / 2) ** 2;
    const degreesPerRadian = 180 / Math.PI;
    const alphaDegrees = longitude
      - degreesPerRadian * tangentSquared * Math.sin(2 * longitude * RAD)
      + (degreesPerRadian / 2) * tangentSquared ** 2 * Math.sin(4 * longitude * RAD);
    rightAscension = wrap(alphaDegrees / 15, 24);
  }
  const declination = Math.asin(Math.sin(obliquity * RAD) * Math.sin(longitude * RAD)) / RAD;
  const equationOfTimeHours = wrap(meanLongitude / 15 - rightAscension + 12, 24) - 12;
  return { declination, equationOfTimeHours, rightAscension };
}
