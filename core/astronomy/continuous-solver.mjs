// Reusable astronomical diagnostic. It intentionally is not a prayer profile.
// The existing source-only approximate coordinates remain unmodified.
import { solarCoordinatesUSNO } from './solar-usno-v2.mjs';

const DAY = 86_400_000;
const HOUR = 3_600_000;
const RAD = Math.PI / 180;
const ANGLE_TOLERANCE = 1e-10;
const TIME_TOLERANCE_MS = 0.01;
const jd = epoch => epoch / DAY + 2440587.5;
const clamp = value => Math.max(-1, Math.min(1, value));
const localDate = (epoch, offset) => new Date(epoch + offset * HOUR).toISOString().slice(0, 10);

function validateInput(input) {
  if (!input || typeof input !== 'object') throw new Error('Input object required');
  if (typeof input.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(input.date)) throw new Error('Explicit YYYY-MM-DD date required');
  const epoch = Date.parse(`${input.date}T00:00:00Z`);
  if (!Number.isFinite(epoch) || new Date(epoch).toISOString().slice(0, 10) !== input.date) throw new Error('Invalid civil date');
  if (input.date < '1800-01-01' || input.date > '2200-12-31') throw new Error('Diagnostic coordinate approximation restricted to 1800–2200');
  for (const [key, low, high] of [['latitude', -90, 90], ['longitude', -180, 180], ['utcOffsetHours', -12, 14]]) {
    if (typeof input[key] !== 'number' || !Number.isFinite(input[key]) || input[key] < low || input[key] > high) throw new Error(`Invalid ${key}`);
  }
  return epoch;
}

// Geocentric centre height in a spherical local horizon. The source coordinates
// are approximate apparent coordinates (including its aberration convention),
// not a purely geometric inertial vector. No atmospheric refraction, terrain,
// observer elevation or topocentric solar parallax is applied here.
export function solarAltitude(epoch, latitude, longitude) {
  if (![epoch, latitude, longitude].every(Number.isFinite)) throw new Error('Finite epoch and coordinates required');
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) throw new Error('Invalid coordinates');
  const solar = solarCoordinatesUSNO(jd(epoch));
  const utHours = ((epoch % DAY) + DAY) % DAY / HOUR;
  const hourAngle = (utHours + longitude / 15 + solar.equationOfTimeHours - 12) * 15 * RAD;
  const phi = latitude * RAD, delta = solar.declination * RAD;
  return Math.asin(clamp(Math.sin(phi) * Math.sin(delta) + Math.cos(phi) * Math.cos(delta) * Math.cos(hourAngle))) / RAD;
}

function optimizeExtremum(valueAt, start, end, maximize) {
  // A solar daily extremum is unimodal within this two-minute bracket.
  let a = start, b = end;
  const sign = maximize ? 1 : -1;
  for (let i = 0; i < 70 && b - a > TIME_TOLERANCE_MS; i++) {
    const x = a + (b - a) / 3, y = b - (b - a) / 3;
    if (sign * valueAt(x) < sign * valueAt(y)) a = x; else b = y;
  }
  const epoch = (a + b) / 2;
  return { epoch, value: valueAt(epoch), extremum: maximize ? 'maximum' : 'minimum' };
}

// valueAt returns solar altitude minus threshold, in degrees. This bounded
// sampler assumes a smooth solar daily curve; it is not a general proof of all
// roots of an arbitrary callback. Refined extrema find even short polar gaps
// whose two crossings both fall between adjacent one-minute samples.
export function findLevelCrossings({ startEpoch, endEpoch, valueAt }) {
  if (!Number.isFinite(startEpoch) || !Number.isFinite(endEpoch) || endEpoch <= startEpoch || endEpoch - startEpoch > 2 * DAY || typeof valueAt !== 'function') throw new Error('A finite interval of at most two days and a function are required');
  let nonfinite = false;
  const checkedValue = epoch => {
    const value = valueAt(epoch);
    if (!Number.isFinite(value)) nonfinite = true;
    return value;
  };
  const unavailable = () => ({ status: 'unavailable', reason: 'nonfinite-altitude', crossings: [], tangencies: [] });
  const points = [];
  for (let epoch = startEpoch; ; epoch = Math.min(epoch + 60_000, endEpoch)) {
    const value = checkedValue(epoch);
    if (nonfinite) return unavailable();
    points.push({ epoch, value });
    if (epoch === endEpoch) break;
  }
  const extrema = [];
  for (let i = 1; i < points.length - 1; i++) {
    const a = points[i - 1].value, b = points[i].value, c = points[i + 1].value;
    if ((b > a && b >= c) || (b < a && b <= c)) extrema.push(optimizeExtremum(checkedValue, points[i - 1].epoch, points[i + 1].epoch, b > a));
  }
  // At a civil-day boundary there is no third sample on the other side.
  // Refine both edge intervals independently so that a short polar gap within
  // the first/last minute cannot hide behind a monotonic sampled sequence.
  for (const [left, right] of [[points[0], points[1]], [points.at(-2), points.at(-1)]]) {
    for (const maximize of [false, true]) {
      const extremum = optimizeExtremum(checkedValue, left.epoch, right.epoch, maximize);
      const direction = maximize ? 1 : -1;
      if (direction * (extremum.value - left.value) > ANGLE_TOLERANCE &&
          direction * (extremum.value - right.value) > ANGLE_TOLERANCE &&
          !extrema.some(point => Math.abs(point.epoch - extremum.epoch) < TIME_TOLERANCE_MS * 4)) extrema.push(extremum);
    }
  }
  if (nonfinite) return unavailable();
  const knots = [...points, ...extrema].sort((a, b) => a.epoch - b.epoch);
  const crossings = [], tangencies = [];
  const sign = value => Math.abs(value) <= ANGLE_TOLERANCE ? 0 : Math.sign(value);
  const add = (epoch, direction) => {
    if (epoch >= endEpoch || epoch < startEpoch || crossings.some(event => Math.abs(event.epoch - epoch) < TIME_TOLERANCE_MS * 4)) return;
    crossings.push({ epoch, direction });
  };
  for (let i = 0; i < knots.length; i++) {
    const knot = knots[i];
    if (sign(knot.value) === 0 && knot.epoch < endEpoch) {
      // Adjacent nonzero knots isolate this crossing or contact. A fixed time
      // step can jump across both roots of a short polar gap. Ignore duplicate
      // and tolerance-zero knots; their tiny spacing does not isolate a sign.
      let before = i - 1, after = i + 1;
      while (before >= 0 && (knots[before].epoch >= knot.epoch || sign(knots[before].value) === 0)) before--;
      while (after < knots.length && (knots[after].epoch <= knot.epoch || sign(knots[after].value) === 0)) after++;
      const previous = knots[before], next = knots[after];
      // At the inclusive start, mirror half the distance to the first
      // isolating knot. This distinguishes a true crossing from a contact
      // without stepping over the nearby extremum on the other side.
      const left = previous?.value ?? (next ? checkedValue(knot.epoch - (next.epoch - knot.epoch) / 2) : 0);
      const right = next?.value ?? (previous ? checkedValue(knot.epoch + (knot.epoch - previous.epoch) / 2) : 0);
      if (nonfinite) return unavailable();
      if (left < 0 && right > 0) add(knot.epoch, 'rising');
      else if (left > 0 && right < 0) add(knot.epoch, 'setting');
      else if (knot.extremum && knot.epoch < endEpoch) tangencies.push({ epoch: knot.epoch, type: knot.extremum, residualDegrees: knot.value });
    }
    if (i === 0) continue;
    const previous = knots[i - 1];
    if (sign(previous.value) * sign(knot.value) !== -1) continue;
    let lo = previous.epoch, hi = knot.epoch, flo = previous.value;
    while (hi - lo > TIME_TOLERANCE_MS) {
      const mid = (lo + hi) / 2;
      const fm = checkedValue(mid);
      if (nonfinite) return unavailable();
      if ((flo < 0) === (fm < 0)) { lo = mid; flo = fm; } else { hi = mid; }
    }
    add((lo + hi) / 2, previous.value < knot.value ? 'rising' : 'setting');
  }
  crossings.sort((a, b) => a.epoch - b.epoch);
  const values = knots.map(point => point.value);
  const status = crossings.length ? 'crossings' : tangencies.length ? 'grazing' : Math.min(...values) > ANGLE_TOLERANCE ? 'continuously-above' : Math.max(...values) < -ANGLE_TOLERANCE ? 'continuously-below' : 'indeterminate';
  return { status, crossings, tangencies, minimumDegreesAboveThreshold: Math.min(...values), maximumDegreesAboveThreshold: Math.max(...values) };
}

export function convergedDay(input) {
  let carrier = validateInput(input);
  let transit;
  for (let attempt = 0; attempt < 4; attempt++) {
    transit = carrier + (12 - input.longitude / 15) * HOUR;
    for (let i = 0; i < 12; i++) transit = carrier + (12 - input.longitude / 15 - solarCoordinatesUSNO(jd(transit)).equationOfTimeHours) * HOUR;
    const actualDate = localDate(transit, input.utcOffsetHours);
    if (actualDate === input.date) break;
    carrier += actualDate < input.date ? DAY : -DAY;
    if (attempt === 3) throw new Error('Solar transit could not be anchored to the requested civil date');
  }
  const startEpoch = Date.parse(`${input.date}T00:00:00Z`) - input.utcOffsetHours * HOUR;
  const endEpoch = startEpoch + DAY;
  const result = { transit, sunrise: null, sunset: null, civilDawn: null, civilDusk: null, eventStatus: {}, crossingDiagnostics: {} };
  for (const [altitude, name, rise, set] of [[-50 / 60, 'horizon', 'sunrise', 'sunset'], [-6, 'civil', 'civilDawn', 'civilDusk']]) {
    const diagnostic = findLevelCrossings({ startEpoch, endEpoch, valueAt: epoch => solarAltitude(epoch, input.latitude, input.longitude) - altitude });
    result.crossingDiagnostics[name] = diagnostic;
    for (const [event, direction] of [[rise, 'rising'], [set, 'setting']]) {
      const matches = diagnostic.crossings.filter(crossing => crossing.direction === direction);
      if (matches.length > 1) throw new Error(`Multiple ${event} crossings; do not silently select an event.`);
      result[event] = matches[0]?.epoch ?? null;
      result.eventStatus[event] = result[event] === null ? diagnostic.status === 'crossings' ? 'no-crossing-in-civil-day' : diagnostic.status : 'calculated';
    }
  }
  return result;
}
