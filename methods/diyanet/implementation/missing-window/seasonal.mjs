// One predeclared role change relative to the old pure fractional seasonal helper.
// Quotient day remains last-real Fajr; interpolation anchors become missing days.
function interpolate(x0, y0, x1, y1, x) {
  if (![x0, y0, x1, y1, x].every(Number.isFinite) || x1 <= x0)
    throw new RangeError('Invalid transition interval');
  return y0 + (y1 - y0) * (x - x0) / (x1 - x0);
}

// Preserve the original normal-side search and fractional crossing formula.
function crossing(rows, event, threshold, a, b, spring) {
  const normal = value => value !== null && (event === 'fajr' ? value >= threshold : value <= threshold);
  const candidates = rows.map((row, index) => ({ value: row[event], index }))
    .filter(({ value, index }) => normal(value) && (spring ? index < a : index > b));
  if (!candidates.length) return null;
  const normalIndex = spring ? candidates.at(-1).index : candidates[0].index;
  const left = spring ? normalIndex : normalIndex - 1, right = left + 1;
  if (!Number.isFinite(rows[left]?.[event]) || !Number.isFinite(rows[right]?.[event])) return null;
  const y0 = rows[left][event], y1 = rows[right][event];
  if (y0 === y1) return null;
  const x = left + (threshold - y0) / (y1 - y0);
  if (!Number.isFinite(x) || x < left || x > right) return null;
  return x;
}

export function seasonalMissingWindow(rows, dates, fajrFactor = 18 / 16, anchorSuffix = '-06-21') {
  if (fajrFactor !== 18 / 16 || anchorSuffix !== '-06-21') throw new RangeError('Fixed missing-window parameters required');
  if (!Array.isArray(rows) || !Array.isArray(dates) || !rows.length || rows.length !== dates.length)
    throw new TypeError('Matching nonempty seasonal rows and dates required');
  let previous = null;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i], label = dates[i], epoch = typeof label === 'string' ? Date.parse(label + 'T00:00:00Z') : NaN;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(label) || !Number.isFinite(epoch) || new Date(epoch).toISOString().slice(0, 10) !== label ||
        (previous !== null && epoch !== previous + 86400000)) throw new RangeError('Ordered contiguous Gregorian dates required');
    previous = epoch;
    if (!row || !['fajr', 'isha'].every(k => row[k] === null || Number.isFinite(row[k])) ||
        !['sunrise', 'sunset'].every(k => Number.isFinite(row[k]))) throw new RangeError('Invalid raw seasonal input');
    const n = 1440 + row.sunrise - row.sunset;
    if (!(n > 0 && n < 1440)) throw new RangeError('Invalid adjusted same-day horizon night');
  }
  const missing = rows.flatMap((row, i) => row.fajr === null ? [i] : []);
  let r, a, b, returnIndex = null, anchorKind;
  if (missing.length) {
    a = missing[0]; b = missing.at(-1); r = a - 1; returnIndex = b + 1;
    if (b - a + 1 !== missing.length) throw new RangeError('Multiple Fajr gaps are outside this hypothesis');
    if (r < 0 || returnIndex >= rows.length || !Number.isFinite(rows[r].fajr) || !Number.isFinite(rows[returnIndex].fajr))
      throw new RangeError('Fajr gap requires both preceding and returning real days');
    anchorKind = 'first-and-last-missing-fajr';
  } else {
    const matches = dates.flatMap((date, i) => date.endsWith(anchorSuffix) ? [i] : []);
    if (matches.length !== 1) throw new RangeError('Exactly one June21 seasonal anchor required');
    r = a = b = matches[0]; anchorKind = 'june-21';
  }
  if (!Number.isFinite(rows[r].fajr)) throw new RangeError('Nonfinite real Fajr ratio anchor');
  const night = row => 1440 + row.sunrise - row.sunset;
  // Identical to the baseline ratio: day r, not either new missing-day endpoint.
  const ratio = (rows[r].fajr + 1440 - rows[r].sunset) / (3 * night(rows[r]));
  if (!Number.isFinite(ratio) || !(ratio > 0 && ratio < 1)) throw new RangeError('Invalid seasonal night ratio');
  const estimated = i => ({ fajr: rows[i].sunrise - ratio * night(rows[i]) * fajrFactor,
                            isha: rows[i].sunset + ratio * night(rows[i]) });
  const anchorA = estimated(a), anchorB = estimated(b), values = {}, rules = {}, transitions = {};
  for (const event of ['fajr', 'isha']) {
    const thresholdA = anchorA[event] + (event === 'fajr' ? 20 : -20);
    const thresholdB = anchorB[event] + (event === 'fajr' ? 20 : -20);
    const x0 = crossing(rows, event, thresholdA, a, b, true);
    const x1 = crossing(rows, event, thresholdB, a, b, false);
    transitions[event] = { springCrossingDayIndex: x0, autumnCrossingDayIndex: x1,
      springThresholdUtcMinutes: thresholdA, autumnThresholdUtcMinutes: thresholdB,
      estimatedSpringAnchorUtcMinutes: anchorA[event], estimatedAutumnAnchorUtcMinutes: anchorB[event],
      transitionEndpointBasis: 'fractional threshold crossing; no integer-day index rounding',
      noGapAngleOnlyFallback: x0 === null || x1 === null };
    if (x0 === null || x1 === null) {
      if (missing.length) throw new RangeError(`No complete ${event} fractional transition for missing window`);
      values[event] = rows.map(row => row[event]); rules[event] = rows.map(() => 'angle');
      continue;
    }
    // Equality means an unused open transition branch. Preserve the old
    // frozen-ratio precedence at the anchor; interpolate still guards >0.
    if (!(0 <= x0 && x0 <= a && a <= b && b <= x1 && x1 < rows.length))
      throw new RangeError(`Invalid ${event} required fractional transition ordering`);
    values[event] = []; rules[event] = [];
    for (let i = 0; i < rows.length; i++) {
      let value, rule;
      if (i < x0 || i > x1) { value = rows[i][event]; rule = 'angle'; }
      else if (i < a) { value = interpolate(x0, thresholdA, a, anchorA[event], i); rule = 'spring-linear-transition'; }
      else if (i > b) { value = interpolate(b, anchorB[event], x1, thresholdB, i); rule = 'autumn-linear-transition'; }
      else { value = estimated(i)[event]; rule = 'frozen-night-ratio'; }
      if (value !== null && !Number.isFinite(value)) throw new RangeError(`Nonfinite ${event} transformed output`);
      values[event].push(value); rules[event].push(rule);
    }
  }
  return { values, rules, metadata: { anchorKind,
    ratioAnchor: dates[r], ratioAnchorDayIndex: r,
    springAnchor: dates[a], springAnchorDayIndex: a, autumnAnchor: dates[b], autumnAnchorDayIndex: b,
    returnRealFajrDay: returnIndex === null ? null : dates[returnIndex], returnRealFajrDayIndex: returnIndex,
    firstMissingDayIndex: missing.length ? a : null, lastMissingDayIndex: missing.length ? b : null,
    missingDayCount: missing.length, ratio, ratioClockBasis: 'same-day-published-sunrise-sunset',
    fajrFactor, seasonalVariant: 'missing-window', ratioAndSeasonalRolesSeparated: missing.length > 0, transitions } };
}
