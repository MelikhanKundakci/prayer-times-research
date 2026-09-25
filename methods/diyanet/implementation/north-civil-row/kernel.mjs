// Mechanical copy of north-own/model.mjs; only the internal seasonal hook differs.
// Passing the original seasonal function must reproduce the full original result.
export class SeasonalContractError extends Error {
  constructor(message, observations) { super(message); this.name = 'SeasonalContractError'; this.observations = observations; }
}
// Dependency-free northern entry to the already-known V5 USNO00 recipe.
// No original calendars, Adhan imports, city IDs or time-fitted coordinates.
import { anchoredSolar, localParts, DAY, MINUTE } from './solar.mjs';
import { seasonalMissingWindow } from '../missing-window/seasonal.mjs';
import { findPhysicalAsr, solarTransit } from '../../../../core/astronomy/physical-asr-solver.mjs';
export const VERSION = '0.1.0-research';
export const EVENTS = Object.freeze(['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']);
export const PARAMETERS = Object.freeze({ fajrAngle: 18, ishaAngle: 16, asrShadowFactor: 1,
  horizonAltitudeDegrees: -50 / 60, minimumDayNightMinutes: 300, fajrFactor: 18 / 16,
  transitionMarginMinutes: 20, solsticeEnvelopeLatitude: 60,
  sourceRecipe: 'existing V5 usno-utc0-both / above60-envelope; not promoted over V4',
  civilDateAnchor: 'own USNO00 transit plus5, nearest minute, explicit local civil date',
  southernSeason: 'unsupported', elevationModel: 'none', extremeLatitudePolicy: 'unconfirmed inherited reconstruction' });

function validate(options) {
  const keys = ['year', 'latitude', 'longitude', 'timeZone'];
  if (!options || Object.getPrototypeOf(options) !== Object.prototype) throw new TypeError('Plain own-data options required');
  const ds = Object.getOwnPropertyDescriptors(options);
  if (Reflect.ownKeys(ds).length !== keys.length || Reflect.ownKeys(ds).some(k => typeof k !== 'string' || !keys.includes(k)
    || !Object.hasOwn(ds[k], 'value') || !ds[k].enumerable)) throw new TypeError('Exactly four enumerable own-data fields required');
  const { year, latitude, longitude, timeZone } = options;
  if (!Number.isInteger(year) || year < 2001 || year > 2098) throw new RangeError('Year must be2001–2098');
  if (!Number.isFinite(latitude) || latitude < 44.5 || latitude > 75) throw new RangeError('Northern latitude must be44.5–75');
  if (!Number.isFinite(longitude) || Math.abs(longitude) > 180) throw new RangeError('Longitude must be−180–180');
  if (typeof timeZone !== 'string' || (timeZone !== 'UTC' && !timeZone.includes('/'))) throw new RangeError('Explicit valid IANA timeZone required');
  try { return new Intl.DateTimeFormat('en-GB-u-ca-gregory-nu-latn', { timeZone,
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }); }
  catch { throw new RangeError('Explicit valid IANA timeZone required'); }
}
export function yearDates(year) {
  const result = [];
  for (let t = Date.UTC(year, 0, 1); t < Date.UTC(year + 1, 0, 1); t += DAY) result.push(new Date(t).toISOString().slice(0, 10));
  return result;
}
function bound(sunrise, sunset, dhuhr, polarDay) {
  if (sunrise === null || sunset === null) return { sunrise: dhuhr - (polarDay ? 570 : 150), sunset: dhuhr + (polarDay ? 570 : 150),
    rule: polarDay ? 'polar-day-5h-night' : 'polar-night-5h-day', changed: true };
  const rise = Math.min(dhuhr - 150, Math.max(sunrise, dhuhr - 570));
  const set = Math.max(dhuhr + 150, Math.min(sunset, dhuhr + 570));
  const changed = rise !== sunrise || set !== sunset;
  return { sunrise: rise, sunset: set, rule: changed ? 'five-hour-horizon-clamp' : 'real-published-horizons', changed };
}
function render(epoch, formatter, rule, estimated, diagnostic) {
  if (!Number.isFinite(epoch)) return { status: 'unavailable', time: null, iso: null, utc: null, localDate: null,
    rawEpoch: null, eligibleForAutomaticNotifications: false, reasons: [{ code: 'unsupported-event' }] };
  const rounded = Math.floor(epoch / MINUTE + .5) * MINUTE;
  const p = localParts(rounded, formatter), offsetMinutes = (Date.parse(`${p.localDate}T${p.time}:00Z`) - rounded) / MINUTE;
  const offset = `${offsetMinutes < 0 ? '-' : '+'}${String(Math.floor(Math.abs(offsetMinutes) / 60)).padStart(2, '0')}:${String(Math.abs(offsetMinutes) % 60).padStart(2, '0')}`;
  return { status: estimated ? 'estimated' : 'adjusted', ...p, iso: `${p.localDate}T${p.time}:00${offset}`,
    utc: new Date(rounded).toISOString(), rawEpoch: epoch, eligibleForAutomaticNotifications: false,
    reasons: [{ code: 'experimental-northern-reconstruction', rule }],
    basis: estimated ? 'unconfirmed-model-policy-substitute' : 'fixed-UTC00-geometry-with-declared-adjustment',
    authorityConfirmed: false, diagnostic };
}
export function replayKernel(options, seasonFunction = seasonalMissingWindow) {
  if (arguments.length < 1 || arguments.length > 2) throw new TypeError('Exactly one options object required');
  const formatter = validate(options), { year, latitude, longitude, timeZone } = options;
  const dates = yearDates(year), observations = dates.map(date => anchoredSolar(date, latitude, longitude, formatter));
  // This explicit candidate uses civil June21, consistent with its daily ephemeris sampling.
  const solsticeIndex = dates.findIndex(date => date.endsWith('-06-21'));
  if (solsticeIndex < 0) throw new RangeError('No unique seasonal solstice carrier in requested year');
  const solstice = observations[solsticeIndex], solsticeDhuhr = (solstice.events.dhuhr - solstice.epoch) / MINUTE + 5;
  const solsticeEnabled = latitude >= 60;
  const rows = observations.map(day => {
    const row = Object.fromEntries(Object.entries(day.events).map(([k, v]) => [k, v === null ? null : (v - day.epoch) / MINUTE]));
    row.dhuhr += 5;
    if (day.solarNoonAltitudeDegrees <= 0) row.asr = null;
    const polar = row.sunrise === null || row.sunset === null, polarDay = polar ? latitude * day.declination > 0 : undefined;
    if (polar && !polarDay) row.asr = null;
    const horizon = bound(row.sunrise === null ? null : row.sunrise - 7, row.sunset === null ? null : row.sunset + 7, row.dhuhr, polarDay);
    const original = { sunrise: horizon.sunrise, sunset: horizon.sunset };
    if (solsticeEnabled) {
      horizon.sunrise = Math.max(horizon.sunrise, solsticeDhuhr - 570);
      horizon.sunset = Math.min(horizon.sunset, solsticeDhuhr + 570);
      horizon.rule += '-solstice-bound';
    }
    return { ...row, ...horizon, horizonEstimated: horizon.changed || horizon.sunrise !== original.sunrise || horizon.sunset !== original.sunset,
      horizonEnvelopeApplied: false, polarState: polar ? polarDay ? 'polar-day' : 'polar-night' : 'both-raw-horizons-available' };
  });
  if (solsticeEnabled) {
    for (let i = solsticeIndex + 1; i < rows.length; i++) {
      const value = Math.max(rows[i].sunrise, rows[i - 1].sunrise);
      if (value !== rows[i].sunrise) rows[i].horizonEnvelopeApplied = rows[i].horizonEstimated = true;
      rows[i].sunrise = value;
    }
    for (let i = solsticeIndex - 1; i >= 0; i--) {
      const value = Math.min(rows[i].sunset, rows[i + 1].sunset);
      if (value !== rows[i].sunset) rows[i].horizonEnvelopeApplied = rows[i].horizonEstimated = true;
      rows[i].sunset = value;
    }
  }
  let season;
  try { season = seasonFunction(rows, dates, PARAMETERS.fajrFactor, '-06-21'); }
  catch (cause) { throw new SeasonalContractError(cause.message, observations); }
  const envelopeApplied = { fajr: dates.map(() => false), isha: dates.map(() => false) };
  if (solsticeEnabled) {
    const minFajr = season.values.fajr[solsticeIndex], maxIsha = season.values.isha[solsticeIndex];
    for (const event of ['fajr', 'isha']) season.values[event] = season.values[event].map((value, i) => {
      if (value === null) return null;
      const bounded = event === 'fajr' ? Math.max(value, minFajr) : Math.min(value, maxIsha);
      envelopeApplied[event][i] = bounded !== value; return bounded;
    });
  }
  const days = dates.map((date, i) => {
    const day = observations[i], row = rows[i], epoch = day.epoch, events = {};
    for (const name of ['fajr', 'isha']) {
      const value = season.values[name][i], rule = season.rules[name][i];
      events[name] = render(value === null ? NaN : epoch + value * MINUTE, formatter,
        rule + (envelopeApplied[name][i] ? '-solstice-clock-envelope' : ''), rule !== 'angle' || envelopeApplied[name][i],
        { rawAngleEpoch: day.events[name], seasonalRule: rule, solsticeEnvelopeApplied: envelopeApplied[name][i] });
    }
    for (const [name, key] of [['sunrise', 'sunrise'], ['maghrib', 'sunset']]) events[name] = render(epoch + row[key] * MINUTE,
      formatter, row.rule, row.horizonEstimated, { rawHorizonEpoch: day.events[key], horizonEnvelopeApplied: row.horizonEnvelopeApplied, polarState: row.polarState });
    events.dhuhr = render(epoch + row.dhuhr * MINUTE, formatter, 'selected-ephemeris-transit-plus5', false, { rawTransitEpoch: day.events.dhuhr });
    const fallback = row.asr === null;
    events.asr = render(epoch + (fallback ? row.dhuhr : row.asr + 4) * MINUTE, formatter,
      fallback ? 'missing-shadow-use-dhuhr' : 'daily-declination-shadow1-plus4', fallback,
      { rawFixedEpochAsr: day.events.asr, fixedNoonAltitudeDegrees: day.solarNoonAltitudeDegrees,
        fixedTargetAltitudeDegrees: day.asrAltitudeDegrees, physicalFixedEpochShadowSelected: !fallback, continuousRootNotUsed: true });
    if (fallback) {
      // Retain the frozen model-policy output while exposing a genuine physical
      // sign that the daily-UTC00 approximation may miss. Never substitute it.
      const physical = findPhysicalAsr({ transit: solarTransit(day.date, longitude, 'usno'),
        latitude, longitude, asrFactor: 1, ephemeris: 'usno' });
      events.asr.diagnostic.continuousAsr = { diagnosticOnly: true, changesPublishedModelTime: false,
        rawEpoch: physical.rawEpoch, utc: physical.rawEpoch === null ? null : new Date(physical.rawEpoch).toISOString(),
        localDate: physical.rawEpoch === null ? null : localParts(physical.rawEpoch, formatter).localDate,
        reason: physical.reason, positiveGeometry: physical.atRoot ?? null };
      if (physical.rawEpoch !== null) events.asr.qualityFlags = [{ code: 'continuous-positive-asr-exists-despite-fixed-epoch-policy-substitution',
        authorityStatus: 'unconfirmed-institutional-policy', automaticReplacementApplied: false }];
    }
    if (events.dhuhr.localDate !== date) throw new RangeError(`Solar noon date mismatch: ${date}`);
    return { date, solarCalculationDate: day.date, events: Object.fromEntries(EVENTS.map(name => [name, events[name]])),
      diagnostics: { declinationUtc00Degrees: day.declination, equationOfTimeUtc00Hours: day.equationOfTimeHours,
        horizonRule: row.rule, polarState: row.polarState, horizonEstimated: row.horizonEstimated } };
  });
  return { profile: { id: 'diyanet-north-own-v5-recipe', version: VERSION, official: false, parameters: { ...PARAMETERS },
      selectionStatus: 'existing mixed-evidence V5 research recipe; does not replace V4' },
    engine: { name: 'independent-USNO-UTC00', civilDateAnchorEngine: 'independent-USNO-UTC00', version: VERSION,
      node: process.version, tzdb: process.versions.tz, hostTimeZoneIndependent: true },
    location: { latitude, longitude, timeZone }, year, official: false, appReady: false, eligibleForAutomaticNotifications: false,
    reconstruction: { seasons: [season.metadata], horizonVariant: 'above60-envelope', solarVariant: 'usno-utc0-both',
      solsticeCalculationDate: solstice.date, solsticeCivilDate: dates[solsticeIndex], horizonEnvelopeApplied: solsticeEnabled },
    limitations: ['Research reconstruction, not institutional production code or religious approval.',
      'V5 mixed evidence and all nine negative transition variants remain unchanged; no new method selected.',
      'Missing physical Asr is replaced by declared Dhuhr policy only; substitution authority is unconfirmed.',
      'Fixed daily declination differs from continuous physical astronomy; diagnostic roots never alter the inherited recipe.',
      'Source clocks do not independently certify absolute event dates; caller coordinates are not verified production points.',
      'Solar/seasonal carriers preserve the old calculation-date semantics; unsupported civil dates reject the year.'], days };
}
