// Post-freeze quality adapter. Preserves all numerical instants and hypotheses.
import { calculateNorthernCalendar, EVENTS, VERSION } from './model.mjs';
export function calculateNorthernReviewed(options) {
  if (arguments.length !== 1) throw new TypeError('Exactly one options object required');
  const result = calculateNorthernCalendar(options);
  let rawExceptions = 0, roundedExceptions = 0, affectedDays = 0;
  for (const day of result.days) {
    const conflicts = [];
    for (let i = 1; i < EVENTS.length; i++) {
      const previousName = EVENTS[i - 1], eventName = EVENTS[i];
      const previous = day.events[previousName], event = day.events[eventName];
      if (previous.utc === null || event.utc === null) continue;
      const rawGapSeconds = (event.rawEpoch - previous.rawEpoch) / 1000;
      const roundedGapMinutes = (Date.parse(event.utc) - Date.parse(previous.utc)) / 60000;
      if (rawGapSeconds >= 0 && roundedGapMinutes >= 0) continue;
      rawExceptions += Number(rawGapSeconds < 0); roundedExceptions += Number(roundedGapMinutes < 0);
      const conflict = { code: 'adjusted-event-ordering-exception', previousEvent: previousName, event: eventName,
        rawGapSeconds, roundedGapMinutes, previousUtc: previous.utc, eventUtc: event.utc,
        modelTimeAltered: false, religiousPolicyConfirmed: false };
      event.qualityFlags = [...(event.qualityFlags ?? []), conflict];
      event.statusBeforeQualityReview = event.status;
      event.status = 'ordering-exception';
      conflicts.push(conflict);
    }
    if (conflicts.length) { day.qualityFlags = conflicts; affectedDays++; }
  }
  result.profile.frozenCalculationVersion = VERSION;
  result.profile.version = '0.1.1-quality-review';
  result.qualityReview = { version: '0.1.1', unchangedEventInstants: true, affectedDays,
    rawOrderingExceptions: rawExceptions, roundedOrderingExceptions: roundedExceptions,
    policy: 'Preserve research values with explicit ordering-exception status; no invented clamp or replacement.' };
  result.limitations.push('Differing fixed Dhuhr/Asr adjustments can invert their order near polar night; quality adapter flags raw and rounded inversions without inventing a correction.');
  return result;
}
