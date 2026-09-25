import {fields} from '../../../../core/input.mjs';
// Original ray-invariant integration. No PAL or other library implementation.
const RAD = Math.PI / 180;
const EARTH = 6378120;
const TROPOPAUSE = 11000, TOP = 80000;

function simpson(f, a, b, segments) {
  if (a === b) return 0;
  const h = (b - a) / segments;
  let sum = f(a) + f(b);
  for (let i = 1; i < segments; i++) sum += (i % 2 ? 4 : 2) * f(a + i * h);
  return sum * h / 3;
}

function integrateDryAtmosphere({latitude, elevationMeters, observedAltitudeDegrees,
  pressureMillibars = 1010, temperatureKelvin = 283.15, wavelengthMicrometers = .55,
  lapseRate = .0065, segments = 256}) {
  if (![latitude, elevationMeters, observedAltitudeDegrees, pressureMillibars,
    temperatureKelvin, wavelengthMicrometers, lapseRate].every(Number.isFinite)) throw new TypeError('Finite atmosphere and ray inputs required');
  if (Math.abs(latitude) > 90 || elevationMeters < 0 || elevationMeters > 1500 ||
    observedAltitudeDegrees < -1.5 || observedAltitudeDegrees > 90 || pressureMillibars < 0 || pressureMillibars > 1100 ||
    temperatureKelvin < 250 || temperatureKelvin > 320 || wavelengthMicrometers < .4 || wavelengthMicrometers > .8 ||
    lapseRate < .004 || lapseRate > .008 || !Number.isInteger(segments) || segments < 16 || segments > 4096 || segments % 2) throw new RangeError('Unsupported dry-atmosphere research domain');
  if (observedAltitudeDegrees === 90 || pressureMillibars === 0) return {refractionDegrees:0, maximumInvariantErrorMeters:0};
  const gravity = 9.784 * (1 - .0026 * Math.cos(2 * latitude * RAD) - .00000028 * elevationMeters);
  const hydrostatic = gravity * 28.9644 / 8314.32;
  const power = hydrostatic / lapseRate - 1;
  const w2 = wavelengthMicrometers ** 2;
  const coefficient = (287.6155 + 1.62887 / w2 + .01360 / w2 ** 2) * 273.15e-6 / 1013.25;
  const excess0 = coefficient * pressureMillibars / temperatureKelvin;
  const topTemperature = temperatureKelvin - lapseRate * (TROPOPAUSE - elevationMeters);
  const excess11 = excess0 * (topTemperature / temperatureKelvin) ** power;
  function atmosphere(height) {
    if (height <= TROPOPAUSE) {
      const t = temperatureKelvin - lapseRate * (height - elevationMeters);
      const excess = excess0 * (t / temperatureKelvin) ** power;
      return {n:1 + excess, derivative:-excess * power * lapseRate / t};
    }
    const excess = excess11 * Math.exp(-hydrostatic * (height - TROPOPAUSE) / topTemperature);
    return {n:1 + excess, derivative:-excess * hydrostatic / topTemperature};
  }
  const radius0 = EARTH + elevationMeters, z0 = (90 - observedAltitudeDegrees) * RAD;
  const impact = (1 + excess0) * radius0 * Math.sin(z0);
  const q = height => atmosphere(height).n * (EARTH + height);
  let maxError = 0;
  function inverseQ(target) {
    let low = -10000, high = TOP;
    const qLow = q(low), qHigh = q(high);
    if (qLow > target + 2e-8 || qHigh < target - 2e-8) throw new RangeError('Ray outside atmosphere model');
    if (target >= qHigh) { maxError = Math.max(maxError, target - qHigh); return high; }
    let height = Math.max(low, Math.min(high, target - EARTH));
    for (let i = 0; i < 60; i++) {
      const {n, derivative} = atmosphere(height), r = EARTH + height;
      const slope = n + r * derivative, error = n * r - target;
      if (!(slope > 0)) throw new RangeError('Ducted/nonmonotone ray unsupported');
      if (Math.abs(error) < 2e-9 || high - low < 2e-8) { maxError = Math.max(maxError, Math.abs(error)); return height; }
      if (error < 0) low = height; else high = height;
      const next = height - error / slope;
      height = next > low && next < high ? next : (low + high) / 2;
    }
    throw new Error('Ray-invariant inversion failed');
  }
  const zTop = Math.asin(impact / q(TOP));
  const z11 = Math.asin(impact / q(TROPOPAUSE));
  function integrand(z) {
    const h = inverseQ(impact / Math.sin(z));
    const {n, derivative} = atmosphere(h), rn = (EARTH + h) * derivative;
    return -rn / (n + rn);
  }
  // At the 11km derivative discontinuity each layer uses its one-sided value.
  const layerIntegral = (a, b, upperLayer) => simpson(z => {
    let h = inverseQ(impact / Math.sin(z));
    if (upperLayer) h = Math.max(TROPOPAUSE + 1e-7, h);
    else h = Math.min(TROPOPAUSE, h);
    const {n, derivative} = atmosphere(h), rn = (EARTH + h) * derivative;
    return -rn / (n + rn);
  }, a, b, segments);
  let radians = layerIntegral(zTop, z11, true);
  radians += layerIntegral(z11, Math.min(z0, Math.PI / 2), false);
  if (z0 > Math.PI / 2) radians += simpson(integrand, Math.PI / 2, z0, segments);
  // Refraction at the finite model's top boundary into vacuum.
  radians += Math.asin(atmosphere(TOP).n * Math.sin(zTop)) - zTop;
  return {refractionDegrees:radians / RAD, maximumInvariantErrorMeters:maxError};
}

// Bounded public helper: standard dry atmosphere only; no silent weather input.
export function dryRefraction(input) {
  if (arguments.length !== 1) throw new TypeError('Exactly one ray input required');
  fields(input, ['latitude', 'elevationMeters', 'observedAltitudeDegrees'], ['segments']);
  if (!Number.isFinite(input.latitude) || input.latitude < 22 || input.latitude > 27) throw new RangeError('Research ray domain: UAE latitudes 22..27');
  return integrateDryAtmosphere(input);
}
