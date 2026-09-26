/**
 * Geocentric apparent solar coordinates using the Reda–Andreas SPA equations.
 *
 * This is an independent JavaScript implementation of the report equations.
 * Coefficient tables in coefficients.json are extracted from pvlib-python
 * v0.13.1 under its BSD-3-Clause license; see vendor/LICENSE-pvlib and
 * README.md. No pvlib calculation code is copied here.
 */
import coeff from './coefficients.json' with { type: 'json' };

const DEG = Math.PI / 180;
const norm = (x, period = 360) => ((x % period) + period) % period;

function polynomialSeries(prefix, order, t) {
  let sum = 0;
  for (let k = 0; k <= order; k += 1) {
    let part = 0;
    for (const [a, b, c] of coeff[`${prefix}${k}`]) part += a * Math.cos(b + c * t);
    sum += part * t ** k;
  }
  return sum / 1e8;
}

function nutation(jce) {
  const x0 = 297.85036 + 445267.111480 * jce - 0.0019142 * jce ** 2 + jce ** 3 / 189474;
  const x1 = 357.52772 + 35999.050340 * jce - 0.0001603 * jce ** 2 - jce ** 3 / 300000;
  const x2 = 134.96298 + 477198.867398 * jce + 0.0086972 * jce ** 2 + jce ** 3 / 56250;
  const x3 = 93.27191 + 483202.017538 * jce - 0.0036825 * jce ** 2 + jce ** 3 / 327270;
  const x4 = 125.04452 - 1934.136261 * jce + 0.0020708 * jce ** 2 + jce ** 3 / 450000;
  let psiSum = 0;
  let epsSum = 0;
  for (let i = 0; i < coeff.NUTATION_YTERM_ARRAY.length; i += 1) {
    const [a, b, c, d, e] = coeff.NUTATION_YTERM_ARRAY[i];
    const [A, B, C, D] = coeff.NUTATION_ABCD_ARRAY[i];
    const angle = (a * x0 + b * x1 + c * x2 + d * x3 + e * x4) * DEG;
    psiSum += (A + B * jce) * Math.sin(angle);
    epsSum += (C + D * jce) * Math.cos(angle);
  }
  return {
    argumentsDegrees: [x0, x1, x2, x3, x4],
    longitude: psiSum / 36_000_000,
    obliquity: epsSum / 36_000_000,
  };
}

/**
 * @param {number} jdUtc Julian day on the UTC time scale.
 * @param {{deltaTSeconds?: number}} options ΔT = TT − UT1, in seconds.
 * @returns {object} apparent geocentric solar coordinates and diagnostics.
 *
 * Convention for this comparison: UT1 = UTC (ΔUT1 is set to zero), hence
 * JDE = JD(UTC) + ΔT/86400. The default fixed ΔT is diagnostic only; it does
 * not express or imply a Diyanet convention.
 */
export function solarCoordinates(jdUtc, { deltaTSeconds = 69.184 } = {}) {
  if (!Number.isFinite(jdUtc)) throw new TypeError('jdUtc must be a finite number');
  if (!Number.isFinite(deltaTSeconds)) throw new TypeError('deltaTSeconds must be a finite number');

  const jde = jdUtc + deltaTSeconds / 86400;
  const jc = (jdUtc - 2451545) / 36525;
  const jce = (jde - 2451545) / 36525;
  const jme = jce / 10;

  const lRad = polynomialSeries('L', 5, jme);
  const bRad = polynomialSeries('B', 1, jme);
  const r = polynomialSeries('R', 4, jme);
  const L = norm(lRad / DEG);
  const B = bRad / DEG;
  const theta = norm(L + 180);
  const beta = -B;
  const nut = nutation(jce);
  const eps0Arcsec = 84381.448 - 4680.93 * jme / 10 - 1.55 * (jme / 10) ** 2
    + 1999.25 * (jme / 10) ** 3 - 51.38 * (jme / 10) ** 4 - 249.67 * (jme / 10) ** 5
    - 39.05 * (jme / 10) ** 6 + 7.12 * (jme / 10) ** 7 + 27.87 * (jme / 10) ** 8
    + 5.79 * (jme / 10) ** 9 + 2.45 * (jme / 10) ** 10;
  const meanObliquity = eps0Arcsec / 3600;
  const trueObliquity = meanObliquity + nut.obliquity;
  const aberration = -20.4898 / (3600 * r);
  const apparentLongitude = theta + nut.longitude + aberration;
  const lam = apparentLongitude * DEG;
  const eps = trueObliquity * DEG;
  const betaRad = beta * DEG;
  const rightAscension = norm(Math.atan2(
    Math.sin(lam) * Math.cos(eps) - Math.tan(betaRad) * Math.sin(eps),
    Math.cos(lam),
  ) / DEG);
  const declination = Math.asin(
    Math.sin(betaRad) * Math.cos(eps)
      + Math.cos(betaRad) * Math.sin(eps) * Math.sin(lam),
  ) / DEG;

  const meanLongitude = 280.4664567 + 360007.6982779 * jme + 0.03032028 * jme ** 2
    + jme ** 3 / 49931 - jme ** 4 / 15300 - jme ** 5 / 2_000_000;
  let equationOfTimeDegrees = norm(
    meanLongitude - 0.0057183 - rightAscension
      + nut.longitude * Math.cos(eps),
  );
  if (equationOfTimeDegrees > 5) equationOfTimeDegrees -= 360;
  const equationOfTime = equationOfTimeDegrees * 4;

  return {
    declination,
    equationOfTime,
    rightAscension,
    julianDayUtc: jdUtc,
    julianEphemerisDay: jde,
    julianCenturyUtc: jc,
    julianEphemerisCentury: jce,
    julianEphemerisMillennium: jme,
    heliocentricLongitude: L,
    heliocentricLatitude: B,
    earthSunDistanceAu: r,
    geocentricLongitude: theta,
    geocentricLatitude: beta,
    meanObliquity: meanObliquity,
    nutationLongitude: nut.longitude,
    nutationObliquity: nut.obliquity,
    apparentSolarLongitude: apparentLongitude,
    equationOfTimeMeanLongitude: meanLongitude,
    equationOfTimeDegrees,
    nutationArgumentsDegrees: nut.argumentsDegrees,
    deltaTSeconds,
    assumedUt1MinusUtcSeconds: 0,
  };
}
