const MINUTES_PER_DAY = 1440;
const EVENTS = ['fajr', 'isha'];

function interpolate(x0, y0, x1, y1, x) {
  if (!(x1 > x0)) throw new RangeError('Seasonal transition anchors must be ordered');
  return y0 + (y1 - y0) * (x - x0) / (x1 - x0);
}
function findThresholdCrossing(rows, event, threshold, leftAnchor, rightAnchor, spring) {
  const qualifies = v => v !== null && (event === 'fajr' ? v >= threshold : v <= threshold);
  const indices = rows.map((row, i) => i).filter(i => qualifies(rows[i][event]) && (spring ? i < leftAnchor : i > rightAnchor));
  if (!indices.length) return null;
  const normal = spring ? indices.at(-1) : indices[0];
  const left = spring ? normal : normal - 1, right = left + 1;
  if (rows[left]?.[event] == null || rows[right]?.[event] == null) return null;
  const y0 = rows[left][event], y1 = rows[right][event];
  if (y0 === y1) return null;
  const x = left + (threshold - y0) / (y1 - y0);
  return x >= left && x <= right ? x : null;
}

/** Apply Diyanet's northern frozen-night-ratio and 20-minute transition recipe in day-relative minutes. */
export function applyNorthernSeason(rows, dates, { missingWindow = true, fajrFactor = 18 / 16, solsticeSuffix = '-06-21' } = {}) {
  if (!Array.isArray(rows) || !Array.isArray(dates) || rows.length === 0 || rows.length !== dates.length)
    throw new TypeError('Matching nonempty seasonal rows and dates required');
  let previousDateEpoch = null;
  for (let i = 0; i < rows.length; i++) {
    const date = dates[i], dateEpoch = typeof date === 'string' ? Date.parse(`${date}T00:00:00Z`) : NaN;
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(dateEpoch)
      || new Date(dateEpoch).toISOString().slice(0, 10) !== date
      || (previousDateEpoch !== null && dateEpoch !== previousDateEpoch + 86_400_000))
      throw new RangeError('Ordered contiguous Gregorian seasonal dates required');
    previousDateEpoch = dateEpoch;
    const row = rows[i];
    if (!row || !['fajr', 'isha'].every(name => row[name] === null || Number.isFinite(row[name]))
      || !['sunrise', 'maghrib'].every(name => Number.isFinite(row[name])))
      throw new RangeError('Seasonal rows require finite horizons and finite or unavailable twilight events');
    const nightLength = 1440 + row.sunrise - row.maghrib;
    if (!(nightLength > 0 && nightLength < 1440)) throw new RangeError('Invalid same-day horizon night length');
  }
  if (fajrFactor !== 18 / 16) throw new RangeError('Unsupported northern Fajr factor');
  const missing = rows.flatMap((row, i) => row.fajr === null ? [i] : []);
  let ratioDay, a, b, returnDay = null, anchorKind;
  if (missing.length) {
    if (!missingWindow) throw new RangeError('Northern Fajr is missing but seasonal substitution is disabled');
    if (missing.at(-1) - missing[0] + 1 !== missing.length) throw new RangeError('Disjoint missing Fajr windows are unsupported');
    a = missing[0]; b = missing.at(-1); ratioDay = a - 1; returnDay = b + 1;
    anchorKind = 'first-and-last-missing-fajr';
    if (ratioDay < 0 || returnDay >= rows.length || rows[ratioDay].fajr === null || rows[returnDay].fajr === null)
      throw new RangeError('Annual seasonal window lacks adjacent real Fajr days');
  } else {
    a = dates.findIndex(date => date.endsWith(solsticeSuffix)); b = a; ratioDay = a;
    anchorKind = solsticeSuffix === '-06-21' ? 'june-21' : 'december-21';
    if (a < 0) throw new RangeError('Required solstice anchor is absent from year');
  }
  const night = row => MINUTES_PER_DAY + row.sunrise - row.maghrib;
  if (a < 0 || b < a || b >= rows.length || !Number.isInteger(ratioDay)) throw new RangeError('Missing valid seasonal calendar anchors');
  const ratio = (rows[ratioDay].fajr + MINUTES_PER_DAY - rows[ratioDay].maghrib) / (3 * night(rows[ratioDay]));
  if (!(ratio > 0 && ratio < 1)) throw new RangeError('Invalid frozen-night ratio');
  const estimate = (row, event) => event === 'fajr'
    ? row.sunrise - ratio * night(row) * fajrFactor
    : row.maghrib + ratio * night(row);
  const anchorValues = Object.fromEntries(EVENTS.map(event => [event, [estimate(rows[a], event), estimate(rows[b], event)]]));
  const values = {}, rules = {}, transitions = {};
  for (const event of EVENTS) {
    const [vA, vB] = anchorValues[event];
    const thresholdA = vA + (event === 'fajr' ? 20 : -20), thresholdB = vB + (event === 'fajr' ? 20 : -20);
    const spring = findThresholdCrossing(rows, event, thresholdA, a, b, true);
    const autumn = findThresholdCrossing(rows, event, thresholdB, a, b, false);
    transitions[event] = { springCrossingDayIndex: spring, autumnCrossingDayIndex: autumn, springThresholdMinutes: thresholdA, autumnThresholdMinutes: thresholdB };
    if (spring === null || autumn === null) {
      if (missing.length) throw new RangeError(`Cannot establish both ${event} seasonal transition crossings`);
      values[event] = rows.map(row => row[event]); rules[event] = rows.map(() => 'angle'); continue;
    }
    values[event] = []; rules[event] = [];
    for (let i = 0; i < rows.length; i++) {
      if (i < spring || i > autumn) { values[event].push(rows[i][event]); rules[event].push('angle'); }
      else if (i < a) { values[event].push(interpolate(spring, thresholdA, a, vA, i)); rules[event].push('spring-linear-transition'); }
      else if (i > b) { values[event].push(interpolate(b, vB, autumn, thresholdB, i)); rules[event].push('autumn-linear-transition'); }
      else { values[event].push(estimate(rows[i], event)); rules[event].push('frozen-night-ratio'); }
    }
  }
  return { values, rules, metadata: { anchorKind, ratioAnchorDate: dates[ratioDay], springAnchorDate: dates[a], autumnAnchorDate: dates[b], returnRealFajrDate: returnDay === null ? null : dates[returnDay], missingDayCount: missing.length, nightRatio: ratio, nightBasis: 'same-calculation-day-sunrise-to-maghrib', fajrFactor, transitions } };
}
