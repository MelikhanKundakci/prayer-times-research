// Public entry to one predeclared global missing-window hypothesis.
import { replayKernel, SeasonalContractError, EVENTS, PARAMETERS, yearDates } from './kernel.mjs';
export const VERSION = '0.1.0-research';
export const PROFILE_ID = 'diyanet-north-missing-window-usno00-diagnostic';

function experimentMetadata(unsupported) {
  return { version: VERSION, supported: unsupported === null, unsupported,
    seasonalVariant: 'missing-window', candidateCount: 1,
    changedFactor: 'first-and-last-missing-Fajr-seasonal-endpoints-with-last-real-ratio',
    rawGeometryChanged: false, ratioDayChanged: false,
    otherFourEventObjectsChanged: unsupported === null ? false : null, automaticPromotion: false };
}

export function unsupportedAnnual(options, observations, reason) {
  const { year, latitude, longitude, timeZone } = options;
  return { profile: { id: PROFILE_ID, version: VERSION, official: false, parameters: { ...PARAMETERS } },
    engine: { name: 'independent-USNO-UTC00', civilDateAnchorEngine: 'independent-USNO-UTC00', version: VERSION,
      node: process.version, tzdb: process.versions.tz, hostTimeZoneIndependent: true },
    location: { latitude, longitude, timeZone }, year, official: false, appReady: false, eligibleForAutomaticNotifications: false,
    reconstruction: { seasons: [], unsupported: reason }, limitations: [], experiment: experimentMetadata(reason),
    days: yearDates(year).map((date, i) => ({ date, solarCalculationDate: observations?.[i]?.date ?? null,
      diagnostics: {}, events: Object.fromEntries(EVENTS.map(event => [event, {
        status: 'unavailable', time: null, iso: null, utc: null, localDate: null, rawEpoch: null,
        reason: reason.code, reasons: [{ code: reason.code, detail: reason.message }],
        authorityConfirmed: false, eligibleForAutomaticNotifications: false,
      }])) })) };
}

export function calculateMissingWindowCalendar(options) {
  if (arguments.length !== 1) throw new TypeError('Exactly one options object required');
  let result, unsupported = null;
  try { result = replayKernel(options); }
  catch (error) {
    if (!(error instanceof SeasonalContractError)) throw error;
    unsupported = { code: 'unsupported-missing-window-season-contract', message: error.message };
    result = unsupportedAnnual(options, error.observations, unsupported);
  }
  result.profile = { ...result.profile, id: PROFILE_ID, version: VERSION,
    parameters: { ...result.profile.parameters, seasonalVariant: 'missing-window',
      sourceRecipe: 'Own V5 USNO00 with first/last missing-Fajr seasonal endpoints and unchanged last-real quotient day' },
    selectionStatus: 'One predeclared known-data hypothesis; not implied uniquely by boundary trimming or an institutional specification' };
  result.reconstruction = { ...result.reconstruction, seasonalVariant: 'missing-window' };
  result.limitations = [
    'Research hypothesis, not a confirmed institutional method or religious approval.',
    'The ratio remains on the last real Fajr day; only the replacement-window endpoints and their estimated threshold crossings change.',
    'No-gap June21 behavior, fractional crossing arithmetic, raw USNO UTC00 geometry, horizons and solstice envelopes remain unchanged.',
    'No inner-angle index rounding, continuous twilight or later Asr ordering correction is applied.',
    'A consistent interior after boundary trimming does not identify true institutional endpoint dates.',
    'Institutional production coordinates, source event dates and quantization remain unconfirmed.',
    'No source-selected corrections, new original acquisition, API promotion or automatic notifications.' ];
  result.experiment = experimentMetadata(unsupported);
  for (const day of result.days) for (const event of ['fajr', 'isha']) {
    if (day.events[event].status === 'unavailable' && typeof day.events[event].reason !== 'string')
      day.events[event].reason = 'unavailable-after-missing-window-seasonal-transformation';
  }
  return result;
}
