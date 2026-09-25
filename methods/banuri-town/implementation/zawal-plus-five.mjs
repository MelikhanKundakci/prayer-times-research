// Original additive rule adapter. The frozen astronomical model is unchanged.
import { calculateBanuriStrict } from './strict-api.mjs';

export const DHUHR_RULE_SOURCE = 'https://www.banuri.edu.pk/readquestion/143406200082/20-04-2013';

/** Apply the published minute-scale wait to an explicit rounded Zawal proxy. */
export function dhuhrFromRoundedZawal(zawalUtc, timeZone) {
  if (arguments.length !== 2 || timeZone !== 'Asia/Karachi') {
    throw new TypeError('Exactly a Zawal UTC minute and Asia/Karachi are required.');
  }
  if (typeof zawalUtc !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00\.000Z$/.test(zawalUtc)) {
    throw new TypeError('Zawal must be a canonical UTC instant at whole-minute resolution.');
  }
  const basis = Date.parse(zawalUtc);
  if (!Number.isFinite(basis) || new Date(basis).toISOString() !== zawalUtc) {
    throw new RangeError('Invalid Zawal UTC instant.');
  }
  const result = new Date(basis + 5 * 60000);
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB-u-ca-gregory-nu-latn', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(result).filter(p => p.type !== 'literal').map(p => [p.type, p.value]));
  return {
    status: 'estimated', semanticRole: 'dhuhr-from-rounded-model-zawal-plus-five-minutes',
    time: `${p.hour}:${p.minute}`, localDate: `${p.year}-${p.month}-${p.day}`,
    utc: result.toISOString(), rawUtc: null,
    basisUtc: zawalUtc, resolution: 'minute', offsetMinutes: 5,
    ruleSource: DHUHR_RULE_SOURCE, eligibleForAutomaticNotifications: false,
  };
}

export function calculateBanuriZawalPlusFive(date, location) {
  if (arguments.length !== 2) throw new TypeError('Exactly date and location are required.');
  const base = calculateBanuriStrict(date, location);
  return {
    ...base,
    profile: {
      ...base.profile, id: 'banuri-rounded-zawal-plus-five-research', version: '0.1.0-research',
      rules: { ...base.profile.rules, dhuhrMinutesAfterRoundedZawal: 5 },
      ruleSources: [...base.profile.ruleSources, DHUHR_RULE_SOURCE],
      dhuhrBasis: 'nearest-minute-model-transit-used-as-unconfirmed-published-zawal-proxy',
    },
    events: { ...base.events, dhuhr: dhuhrFromRoundedZawal(base.events.transit.utc, location.timeZone) },
    qualityFlags: [
      ...base.qualityFlags.filter(flag => !['institutional-angles-and-asr-only',
        'dhuhr-not-mapped-from-ambiguous-zawal-column'].includes(flag)),
      'published-five-minute-rule-with-unconfirmed-model-zawal-proxy',
      'dhuhr-minute-resolution-not-second-certified',
      'dhuhr-not-independently-calendar-validated',
    ],
  };
}
