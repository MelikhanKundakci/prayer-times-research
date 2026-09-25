// Independent expression of the NOAA/Meeus solar-coordinate equations.
// Primary reference: https://gml.noaa.gov/grad/solcalc/main.js
// Diagnostic only: matches NOAA's Julian-date time argument without fitting
// TT/UT or provider-specific offsets. Not a complete high-precision ephemeris.
const DEG = Math.PI / 180;
const wrap = angle => ((angle % 360) + 360) % 360;

export function solarCoordinatesNoaa(julianDate) {
  if (!Number.isFinite(julianDate) || julianDate < 2378496.5 || julianDate >= 2488434.5) {
    throw new RangeError('Finite Julian date in 1800–2100 required');
  }
  const t = (julianDate - 2451545) / 36525;
  const meanLongitude = wrap(280.46646 + t * (36000.76983 + t * 0.0003032));
  const anomaly = (357.52911 + t * (35999.05029 - t * 0.0001537)) * DEG;
  const eccentricity = 0.016708634 - t * (0.000042037 + t * 0.0000001267);
  const center = Math.sin(anomaly) * (1.914602 - t * (0.004817 + t * 0.000014))
    + Math.sin(2 * anomaly) * (0.019993 - t * 0.000101)
    + Math.sin(3 * anomaly) * 0.000289;
  const node = (125.04 - 1934.136 * t) * DEG;
  const longitude = (meanLongitude + center - 0.00569 - 0.00478 * Math.sin(node)) * DEG;
  const obliquitySeconds = 21.448 - t * (46.8150 + t * (0.00059 - t * 0.001813));
  const obliquity = (23 + (26 + obliquitySeconds / 60) / 60 + 0.00256 * Math.cos(node)) * DEG;
  const declination = Math.asin(Math.sin(obliquity) * Math.sin(longitude)) / DEG;
  const rightAscension = wrap(Math.atan2(Math.cos(obliquity) * Math.sin(longitude), Math.cos(longitude)) / DEG) / 15;
  const y = Math.tan(obliquity / 2) ** 2;
  const mean = meanLongitude * DEG;
  const equation = y * Math.sin(2 * mean) - 2 * eccentricity * Math.sin(anomaly)
    + 4 * eccentricity * y * Math.sin(anomaly) * Math.cos(2 * mean)
    - 0.5 * y ** 2 * Math.sin(4 * mean)
    - 1.25 * eccentricity ** 2 * Math.sin(2 * anomaly);
  return { declination, rightAscension, equationOfTimeHours: equation / DEG / 15 };
}
