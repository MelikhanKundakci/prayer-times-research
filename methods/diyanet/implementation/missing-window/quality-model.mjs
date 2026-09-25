// Method-local quality adapter; the mapped numerical recipe remains unchanged.
import { calculateMissingWindowCalendar, VERSION } from './model.mjs';
const EVENTS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

export function calculateMissingWindowReviewed(options) {
  if (arguments.length !== 1) throw new TypeError('Exactly one options object required');
  const result = calculateMissingWindowCalendar(options);
  let checkedPairs = 0, unavailablePairs = 0, rawExceptions = 0, roundedExceptions = 0, affectedDays = 0;
  for (const day of result.days) {
    const conflicts = [];
    for (let i = 1; i < EVENTS.length; i++) {
      const previousName = EVENTS[i - 1], eventName = EVENTS[i];
      const previous = day.events[previousName], event = day.events[eventName];
      if (previous.utc === null || event.utc === null) { unavailablePairs++; continue; }
      checkedPairs++;
      const rawGapSeconds = (event.rawEpoch - previous.rawEpoch) / 1000;
      const roundedGapMinutes = (Date.parse(event.utc) - Date.parse(previous.utc)) / 60000;
      if (rawGapSeconds >= 0 && roundedGapMinutes >= 0) continue;
      rawExceptions += Number(rawGapSeconds < 0);
      roundedExceptions += Number(roundedGapMinutes < 0);
      const conflict = { code: 'adjusted-event-ordering-exception', previousEvent: previousName, event: eventName,
        rawGapSeconds, roundedGapMinutes, previousUtc: previous.utc, eventUtc: event.utc,
        modelTimeAltered: false, religiousPolicyConfirmed: false };
      event.qualityFlags = [...(event.qualityFlags ?? []), conflict];
      event.statusBeforeQualityReview = event.status;
      event.status = 'ordering-exception';
      event.eligibleForAutomaticNotifications = false;
      conflicts.push(conflict);
    }
    if (conflicts.length) { day.qualityFlags = [...(day.qualityFlags ?? []), ...conflicts]; affectedDays++; }
  }
  result.profile.frozenCalculationVersion = VERSION;
  result.profile.version = '0.1.1-quality-review';
  result.qualityReview = { version: '0.1.1', unchangedEventInstants: true, checkedPairs, unavailablePairs,
    affectedDays, rawOrderingExceptions: rawExceptions, roundedOrderingExceptions: roundedExceptions,
    scope: 'Adjacent events within each returned solar-day row; not a cross-year or source-date certification.',
    policy: 'Preserve research values and flag reversals; equality is allowed and no replacement time is inferred.' };
  result.limitations.push('An ordering check cannot establish institutional accuracy or notification readiness; unchanged times with reversed order are explicitly flagged.');
  return result;
}
