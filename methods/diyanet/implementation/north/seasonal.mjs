// Copied from frozen v0.1 seasonal hypothesis; only the solstice suffix is generalized.
function interpolate(x0, y0, x1, y1, x) {
  if (x1 <= x0) throw new Error('Invalid transition interval');
  return y0 + (y1 - y0) * (x - x0) / (x1 - x0);
}

function crossing(rows, event, threshold, a, b, spring) {
  const normal = value => value !== null && (event === 'fajr' ? value >= threshold : value <= threshold);
  const candidates = rows.map((row, index) => ({ value: row[event], index }))
    .filter(({ value, index }) => normal(value) && (spring ? index < a : index > b));
  if (!candidates.length) return null;
  const normalIndex = spring ? candidates.at(-1).index : candidates[0].index;
  const left = spring ? normalIndex : normalIndex - 1;
  const right = left + 1;
  if (rows[left]?.[event] === null || rows[right]?.[event] === null) return null;
  const y0 = rows[left][event], y1 = rows[right][event];
  if (y0 === y1) return null;
  const x = left + (threshold - y0) / (y1 - y0);
  if (x < left || x > right) return null;
  return x;
}

export function seasonalTwilight(rows, dates, fajrFactor = 18 / 16, anchorSuffix = '-06-21') {
  const missing = rows.flatMap((row, i) => row.fajr === null ? [i] : []);
  let a, b, anchorKind;
  if (missing.length) {
    if (missing.at(-1) - missing[0] + 1 !== missing.length) throw new Error('Multiple Fajr gaps are outside this hypothesis');
    a = missing[0] - 1; b = missing.at(-1) + 1; anchorKind = 'last-and-first-real-fajr';
    if (a < 0 || b >= rows.length) throw new Error('Fajr season needs both real anchor days');
  } else {
    a = dates.findIndex(date => date.endsWith(anchorSuffix)); b = a; anchorKind = anchorSuffix === '-06-21' ? 'june-21' : 'december-21';
  }
  if (a < 0 || rows[a].fajr === null) throw new Error('Missing seasonal anchor');
  const night = row => 1440 + row.sunrise - row.sunset;
  // Hypothesis: reuse the last real Fajr civil-clock value, on the same
  // calculation day's sunrise/sunset clocks. Not the preceding physical night.
  const ratio = (rows[a].fajr + 1440 - rows[a].sunset) / (3 * night(rows[a]));
  if (!(ratio > 0 && ratio < 1)) throw new Error('Invalid seasonal night ratio');
  const estimated = i => ({
    fajr: rows[i].sunrise - ratio * night(rows[i]) * fajrFactor,
    isha: rows[i].sunset + ratio * night(rows[i]),
  });
  const anchorA = estimated(a), anchorB = estimated(b);
  const values = {}, rules = {}, transitions = {};
  for (const event of ['fajr', 'isha']) {
    const thresholdA = anchorA[event] + (event === 'fajr' ? 20 : -20);
    const thresholdB = anchorB[event] + (event === 'fajr' ? 20 : -20);
    const x0 = crossing(rows, event, thresholdA, a, b, true);
    const x1 = crossing(rows, event, thresholdB, a, b, false);
    transitions[event] = { springCrossingDayIndex: x0, autumnCrossingDayIndex: x1,
      springThresholdUtcMinutes: thresholdA, autumnThresholdUtcMinutes: thresholdB };
    if (x0 === null || x1 === null) {
      if (missing.length) throw new Error(`No complete ${event} transition for this location`);
      values[event] = rows.map(row => row[event]); rules[event] = rows.map(() => 'angle');
      continue;
    }
    values[event] = []; rules[event] = [];
    for (let i = 0; i < rows.length; i++) {
      let value, rule;
      if (i < x0 || i > x1) { value = rows[i][event]; rule = 'angle'; }
      else if (i < a) { value = interpolate(x0, thresholdA, a, anchorA[event], i); rule = 'spring-linear-transition'; }
      else if (i > b) { value = interpolate(b, anchorB[event], x1, thresholdB, i); rule = 'autumn-linear-transition'; }
      else { value = estimated(i)[event]; rule = 'frozen-night-ratio'; }
      values[event].push(value); rules[event].push(rule);
    }
  }
  return { values, rules, metadata: { anchorKind, springAnchor: dates[a], autumnAnchor: dates[b],
    ratio, ratioClockBasis: 'same-day-published-sunrise-sunset', fajrFactor, transitions } };
}

