// Own offline mathematics. No publisher calendar, coordinate preset or network.
import { solarCoordinatesUSNO } from '../../../core/astronomy/solar-usno-v2.mjs';

const RAD = Math.PI / 180;
const SIN_H = Math.sin((-50 / 60) * RAD);
const EVENTS = ['sunrise', 'dhuhr', 'maghrib'];
const OFFSETS = { sunrise: -420, dhuhr: 300, maghrib: 420 };

function object(value, required, optional = [], name = 'input') {
  if (!value || Object.getPrototypeOf(value) !== Object.prototype) throw new TypeError(`${name} must be a plain object`);
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const keys = Reflect.ownKeys(descriptors);
  if (keys.some(k => typeof k !== 'string' || ![...required, ...optional].includes(k)
      || !Object.hasOwn(descriptors[k], 'value') || !descriptors[k].enumerable)
      || required.some(k => !Object.hasOwn(descriptors, k))) throw new TypeError(`${name} has missing or unsupported own data fields`);
  return Object.fromEntries(keys.map(k => [k, descriptors[k].value]));
}

function array(value, name) {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) throw new TypeError(`${name} must be a plain array`);
  const ds = Object.getOwnPropertyDescriptors(value);
  const length = ds.length.value;
  if (Reflect.ownKeys(ds).length !== length + 1 || Array.from({ length }, (_, i) => String(i)).some(k =>
    !Object.hasOwn(ds, k) || !Object.hasOwn(ds[k], 'value') || !ds[k].enumerable)) throw new TypeError(`${name} must contain only dense own data elements`);
  return Array.from({ length }, (_, i) => ds[i].value);
}

function bounds(value, min, max, exclusiveMax, name) {
  const pair = array(value, name);
  if (pair.length !== 2 || pair.some(x => !Number.isFinite(x)) || pair[0] >= pair[1]
      || pair[1] - pair[0] > .5 + 1e-12 || pair[0] < min || (exclusiveMax ? pair[1] >= max : pair[1] > max)) {
    throw new RangeError(`${name} must be increasing, at most 0.5 degrees wide, within the supported domain`);
  }
  return pair;
}

function dateEpoch(date) {
  if (typeof date !== 'string' || !/^(20\d{2})-\d{2}-\d{2}$/.test(date)) throw new RangeError('date must be YYYY-MM-DD in 2001–2098');
  const epoch = Date.parse(`${date}T00:00:00Z`), year = Number(date.slice(0, 4));
  if (!Number.isFinite(epoch) || new Date(epoch).toISOString().slice(0, 10) !== date || year < 2001 || year > 2098) throw new RangeError('Invalid or unsupported Gregorian date');
  return epoch;
}

function localDate(epoch, formatter) {
  const p = Object.fromEntries(formatter.formatToParts(epoch).map(p => [p.type, p.value]));
  return `${p.year}-${p.month}-${p.day}`;
}

function horizon(day, latitude) {
  const p = latitude * RAD;
  const c = (SIN_H - Math.sin(p) * day.sd) / (Math.cos(p) * day.cd);
  if (!Number.isFinite(c) || Math.abs(c) >= 1) throw new RangeError('The coordinate box includes an unavailable or tangential horizon');
  return { cosine: c, seconds: Math.acos(c) / RAD * 240 };
}

function baseTime(day, latitude, event) {
  const span = event === 'dhuhr' ? 0 : horizon(day, latitude).seconds * (event === 'sunrise' ? -1 : 1);
  return day.base + span + OFFSETS[event];
}

/**
 * Diagnose whether rounded reference minutes are consistent with one point in
 * a small declared box under the fixed USNO00/Temkin recipe. Never yields an
 * official place coordinate or a prayer-calendar preset.
 */
export function fitPointConsistency(input) {
  const options = object(input, ['timeZone', 'latitudeBounds', 'longitudeBounds', 'observations'], ['gridSegments']);
  const [latMin, latMax] = bounds(options.latitudeBounds, 44.5, 60, true, 'latitudeBounds');
  const [lonMin, lonMax] = bounds(options.longitudeBounds, -180, 180, false, 'longitudeBounds');
  const segments = Object.hasOwn(options, 'gridSegments') ? options.gridSegments : 10000;
  if (!Number.isInteger(segments) || segments < 100 || segments > 50000) throw new RangeError('gridSegments must be an integer 100–50000');
  if (typeof options.timeZone !== 'string' || (options.timeZone !== 'UTC' && !options.timeZone.includes('/'))) throw new RangeError('Explicit IANA timeZone required');
  let formatter;
  try { formatter = new Intl.DateTimeFormat('en-GB-u-ca-gregory-nu-latn', { timeZone: options.timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }); }
  catch { throw new RangeError('Invalid IANA timeZone'); }
  const supplied = array(options.observations, 'observations');
  if (!supplied.length || supplied.length > 2000) throw new RangeError('Supply 1–2000 observations');
  const days = new Map(), seen = new Set();
  const observations = supplied.map((value, index) => {
    const row = object(value, ['date', 'event', 'utc'], [], `observations[${index}]`);
    const epoch = dateEpoch(row.date);
    if (!EVENTS.includes(row.event)) throw new RangeError('Only sunrise, dhuhr and maghrib observations are supported');
    if (typeof row.utc !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00(?:\.000)?Z$/.test(row.utc)) throw new RangeError('utc must be an explicit UTC minute with zero seconds');
    const sourceEpoch = Date.parse(row.utc);
    if (!Number.isFinite(sourceEpoch) || new Date(sourceEpoch).toISOString() !== row.utc.replace(/:00Z$/, ':00.000Z')) throw new RangeError('Invalid UTC timestamp');
    if (localDate(sourceEpoch, formatter) !== row.date) throw new RangeError('Observation UTC timestamp disagrees with its local row date');
    const key = `${row.date}|${row.event}`;
    if (seen.has(key)) throw new RangeError('Duplicate date/event observation');
    seen.add(key);
    if (!days.has(row.date)) {
      const s = solarCoordinatesUSNO(epoch / 86400000 + 2440587.5);
      days.set(row.date, { epoch, date: row.date, base: 43200 - s.equationOfTimeHours * 3600, sd: Math.sin(s.declination * RAD), cd: Math.cos(s.declination * RAD) });
    }
    return { ...row, index, sourceEpoch, sourceSeconds: (sourceEpoch - epoch) / 1000, day: days.get(row.date) };
  });

  // Validate the whole box. Neither training selection nor a grid point can
  // silently cross into a polar, horizon-clamped or different-carrier recipe.
  let derivativeBound = 0, horizonPolicyMargin = Infinity;
  for (const day of days.values()) {
    const latitudes = [latMin, latMax], ratio = day.sd / SIN_H;
    if (Math.abs(ratio) <= 1) {
      const critical = Math.asin(ratio) / RAD;
      if (critical > latMin && critical < latMax) latitudes.push(critical);
    }
    const values = latitudes.map(lat => horizon(day, lat));
    const maxC = Math.max(...values.map(v => Math.abs(v.cosine)));
    const numerator = Math.max(...[latMin, latMax].map(lat => Math.abs(SIN_H * Math.sin(lat * RAD) - day.sd)));
    derivativeBound = Math.max(derivativeBound, 240 * numerator / (Math.cos(latMax * RAD) ** 2 * day.cd * Math.sqrt(1 - maxC ** 2)));
    for (const v of values) {
      const morning = v.seconds + 720, evening = v.seconds + 120;
      const margin = Math.min(morning - 9000, 34200 - morning, evening - 9000, 34200 - evening);
      if (margin <= 0) throw new RangeError('The coordinate box requires the five-hour horizon policy on an observation date');
      horizonPolicyMargin = Math.min(horizonPolicyMargin, margin);
    }
    for (const lon of [lonMin, lonMax]) {
      const roundedNoon = Math.floor((day.epoch + (day.base - 240 * lon + 300) * 1000) / 60000 + .5) * 60000;
      if (localDate(roundedNoon, formatter) !== day.date) throw new RangeError('The coordinate box requires a different UTC00 solar carrier date');
    }
  }
  const latitudeAffectsObservations = observations.some(row => row.event !== 'dhuhr');
  if (!latitudeAffectsObservations) derivativeBound = 0;

  function at(latitude, details = false) {
    let L = -Infinity, U = Infinity, lowerIndex = null, upperIndex = null;
    for (const row of observations) {
      const difference = baseTime(row.day, latitude, row.event) - row.sourceSeconds;
      const lower = (difference - 30) / 240, upper = (difference + 30) / 240;
      if (lower > L) { L = lower; lowerIndex = row.index; }
      if (upper < U) { U = upper; upperIndex = row.index; }
    }
    const longitude = Math.max(lonMin, Math.min(lonMax, (L + U) / 2));
    const slack = Math.max(0, 240 * (L - longitude), 240 * (longitude - U));
    const lower = Math.max(L, lonMin), upper = Math.min(U, lonMax);
    // U==lonMin is valid when L<lonMin: a closed singleton. L==lonMax
    // remains invalid because every source lower longitude limit is open.
    const exactFeasible = upper >= lonMin && upper > L;
    return { latitude, longitude, slack, exactFeasible,
      exactLongitudeInterval: { lower, upper, lowerClosed: lonMin > L, upperClosed: true, empty: !exactFeasible },
      ...(details ? { activeConstraints: { lowerObservationIndex: lowerIndex, upperObservationIndex: upperIndex, sourceLowerOpen: L, sourceUpperClosed: U } } : {}) };
  }
  const step = (latMax - latMin) / segments, middle = (latMin + latMax) / 2;
  const grid = new Float64Array(segments + 1);
  let gridMinimum = Infinity, feasibleGridCount = 0, selectedFeasible = null;
  for (let i = 0; i <= segments; i++) {
    const point = at(latMin + i * step); grid[i] = point.slack; gridMinimum = Math.min(gridMinimum, point.slack);
    if (point.exactFeasible) {
      feasibleGridCount++;
      if (selectedFeasible === null || Math.abs(point.latitude - middle) < Math.abs(selectedFeasible.latitude - middle)) selectedFeasible = point;
    }
  }
  let selected;
  if (selectedFeasible) selected = at(selectedFeasible.latitude, true);
  else {
    let bestGridIndex = 0;
    for (let i = 0; i <= segments; i++) if (grid[i] <= gridMinimum + 1e-7
      && (grid[bestGridIndex] > gridMinimum + 1e-7 || Math.abs(i - segments / 2) < Math.abs(bestGridIndex - segments / 2))) bestGridIndex = i;
    const starts = [...new Set([0, segments, bestGridIndex])];
    for (let i = 1; i < segments; i++) if (grid[i] <= grid[i - 1] && grid[i] <= grid[i + 1] && (grid[i] < grid[i - 1] || grid[i] < grid[i + 1])) starts.push(i);
    const candidates = [];
    for (const i of starts) {
      let a = latMin + Math.max(0, i - 1) * step, b = latMin + Math.min(segments, i + 1) * step;
      const ratio = (Math.sqrt(5) - 1) / 2;
      let c = b - ratio * (b - a), d = a + ratio * (b - a), fc = at(c).slack, fd = at(d).slack;
      for (let j = 0; j < 80 && b - a > 1e-13; j++) {
        if (fc <= fd) { b = d; d = c; fd = fc; c = b - ratio * (b - a); fc = at(c).slack; }
        else { a = c; c = d; fc = fd; d = a + ratio * (b - a); fd = at(d).slack; }
      }
      for (const latitude of [latMin + i * step, a, b, (a + b) / 2]) candidates.push(at(latitude, true));
    }
    const best = Math.min(...candidates.map(c => c.slack));
    selected = candidates.filter(c => c.slack <= best + 1e-7).sort((a, b) =>
      Number(b.exactFeasible) - Number(a.exactFeasible) || Math.abs(a.latitude - middle) - Math.abs(b.latitude - middle) || a.latitude - b.latitude)[0];
  }
  if (selected.exactFeasible) selected.longitude = (selected.exactLongitudeInterval.lower + selected.exactLongitudeInterval.upper) / 2;
  const residuals = observations.map(row => {
    const seconds = baseTime(row.day, selected.latitude, row.event) - 240 * selected.longitude;
    const predictedEpoch = row.day.epoch + Math.floor(seconds / 60 + .5) * 60000;
    const residualSeconds = seconds - row.sourceSeconds;
    return { index: row.index, date: row.date, event: row.event, referenceUtc: row.utc,
      calculatedUtc: new Date(predictedEpoch).toISOString(), differenceMinutes: (predictedEpoch - row.sourceEpoch) / 60000,
      rawMinusReferenceMinuteCenterSeconds: residualSeconds,
      exactMinute: predictedEpoch === row.sourceEpoch,
      outsideOriginalHalfOpenCell: residualSeconds < -30 || residualSeconds >= 30 };
  });
  const lowerBound = Math.max(0, gridMinimum - derivativeBound * step / 2);
  const exactCount = residuals.filter(r => r.exactMinute).length;
  const exactFound = selected.exactFeasible && exactCount === residuals.length;
  return {
    diagnostic: 'USNO00 point consistency, experimental offline research', official: false,
    pointIsInstitutionalCoordinate: false, eligibleForAutomaticNotifications: false,
    status: exactFound ? 'exact-feasible-point-found' : lowerBound > 1e-7 || (!latitudeAffectsObservations && !selected.exactFeasible)
      ? 'exact-fit-infeasible-in-box' : 'exact-feasibility-unresolved',
    selectedDiagnosticPoint: { latitude: selected.latitude, longitude: selected.longitude },
    bounds: { latitude: [latMin, latMax], longitude: [lonMin, lonMax] }, timeZone: options.timeZone,
    fixedRecipe: { epoch: 'row date UTC00', horizonDegrees: -50 / 60, adjustmentsSeconds: { ...OFFSETS }, rounding: 'nearest UTC minute, half-open[-30,+30) seconds' },
    minimax: { lowerBoundSeconds: lowerBound, selectedPointUpperBoundSeconds: selected.slack,
      gridMinimumSeconds: gridMinimum, latitudeGridSegments: segments, gridErrorBoundSeconds: derivativeBound * step / 2,
      numericalMeaning: 'Extra uniform half-width beyond rounded-minute cells; ordinary floating-point analytic bound, not formal interval arithmetic or measured source-second error' },
    exactFeasibility: { selectedLatitudeLongitudeInterval: selected.exactLongitudeInterval, feasibleGridLatitudeCount: feasibleGridCount,
      latitudeAffectsObservations,
      globalInfeasibilityBasis: lowerBound > 1e-7 ? 'positive-analytic-grid-lower-bound' : !latitudeAffectsObservations && !selected.exactFeasible ? 'latitude-independent-half-open-constraints' : null,
      scope: 'The interval concerns the selected latitude only. A missed narrow feasible region remains unresolved unless the global lower bound is positive.' },
    activeConstraints: selected.activeConstraints,
    geometryChecks: { minimumHorizonPolicyMarginSeconds: horizonPolicyMargin, noCarrierDateChangeInBox: true, noHorizonClampInBox: true },
    agreementOnSuppliedData: { observations: residuals.length, exact: exactCount, nonExact: residuals.length - exactCount,
      withinOneMinute: residuals.filter(r => Math.abs(r.differenceMinutes) <= 1).length,
      maximumAbsoluteMinutes: Math.max(...residuals.map(r => Math.abs(r.differenceMinutes))) },
    residuals,
    limitations: [
      'This fits supplied observations; agreement is not independent validation or publisher accuracy.',
      'The selected point is conditional on the fixed model, never an official coordinate or GPS correction.',
      'Longitude is exactly confounded with a common raw-clock offset (-240 seconds per degree); latitude can absorb horizon or ephemeris errors.',
      'Latitude/longitude ranges are numerical constraints, not statistical confidence intervals.',
      'No Fajr, Asr, Isha, seasonal replacement, polar policy or arbitrary-location calendar is produced.',
      'Grid bounds and refinement use ordinary floating point; tiny positive gaps below 1e-7 seconds remain unresolved.',
      'IANA date validation uses the host timezone database; use the repository pinned-timezone runner for reproducibility.'
    ]
  };
}
