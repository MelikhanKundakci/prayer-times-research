# Compare local Diyanet criteria with the calendar reconstruction

This offline diagnostic calculates the same explicit point and date through two existing implementations:

- **Local point profile:** `diyanet-published-spa-point-v1`, continuous SPA solar events followed by the named criteria and ordinary-only northern guard.
- **Calendar reconstruction:** `core/diyanet` with `dateBasis: 'civil-date'`, daily USNO coordinates sampled at UTC00 of the requested civil date and the existing regional reconstruction rules.

Neither side is an official timetable or a measured prayer onset. The result is a **model-to-model difference**, not an accuracy score. A closer match to a supplied city calendar does not by itself establish a more accurate physical event or a complete religious rule.

## Run a comparison

```sh
npm run compare:diyanet -- 2026-09-26 50.1109 8.6821 Europe/Berlin
npm run compare:diyanet -- 2026-09-26 50.1109 8.6821 Europe/Berlin --json
```

The example uses the project's existing public Frankfurt demonstration point. The command performs no network request, city lookup or reference-calendar read, and does not write a file. Output includes the supplied coordinates: keep reports from a personal GPS point private unless you deliberately choose to share them.

The models retain their own event availability, estimates, rule identifiers and event dates. A missing or policy-blocked local event is not filled from the reconstruction. Differences use absolute UTC instants, including the date; a clock on the following day cannot silently become a same-day match. Internal model seconds express computational precision, not verified second-level prayer-time accuracy.

## JavaScript interface

```js
import {compareDiyanetPointDay} from './core/diagnostics/diyanet-comparison.mjs';

const comparison = compareDiyanetPointDay({
  date: '2026-09-26', latitude: 50.1109, longitude: 8.6821,
  timeZone: 'Europe/Berlin',
});
console.log(comparison.events.maghrib.rawDifferenceSeconds);
console.log(comparison.events.maghrib.local.rule);
console.log(comparison.events.maghrib.calendar.rule);
console.log(comparison.summary.statusCounts);
```

The four input fields are required. The shared numerical domain is 2001–2098, latitude −60° through 75°, longitude −180° through 180°, and an explicit supported IANA timezone. These bounds are not coverage guarantees. Both models must accept the requested civil-date context; skipped or ambiguous transit dates fail explicitly. The reconstruction requires an anchorable complete calendar year. Northern local-policy restrictions and their unavailable events remain visible.

`rawDifferenceSeconds` is the **local selected instant minus the reconstruction selected instant**, before display rounding; a negative number means the local value is earlier. `roundedEpochDifferenceMilliseconds` compares the rounded absolute instants. Either delta is null when one side has no selected instant. Each side preserves its own status, reason, rule, actual date, rounded display date and UTC serialization. Estimated pairs are identified by their statuses rather than presented as two measured astronomical events.

## Reading a difference

Ordinary cases use the same selected twilight angles and integer-minute margins, but differ in how solar coordinates change during a day. Under the local model, declination and solar rotation phase are evaluated at each event. The reconstruction applies one daily coordinate sample to the row. The difference varies with prayer, season and location; it is not a fixed correction to add to every clock.

At high northern latitudes, the two implementations also differ in policy coverage. The local Diyanet profile deliberately blocks unresolved seasonal cases; the reconstruction includes explicitly identified seasonal hypotheses and horizon substitutions. Those fields cannot be used to isolate an astronomy difference. Always read status and rule information alongside the times.

For each available event, distinguish the raw astronomical event, the selected margin-adjusted model instant and its rounded display. The local core's `astronomy` and `events` objects provide that trace. A one-minute display change can arise at a rounding boundary; a matching display can also conceal different model instants.

## When a change is justified

The [per-prayer audit](../../methods/diyanet/LOCAL-RULE-AUDIT.md) identifies directly supported criteria and numerical conventions that remain unspecified. Existing [Asr](../../methods/diyanet/GLOBAL-ASR-GEOMETRY.md) and [rounding/ephemeris](../../methods/diyanet/GLOBAL-NUMERICS.md) studies already rejected several global corrections on known data. Repeating a rejected correction at one favorable city does not establish a general improvement.

A numerical replacement needs a stated target, an independently supported mechanism, and a complete comparison including losses and unavailable cases. Already exposed calendar rows remain development evidence even if split into new groups. A genuinely prospective test requires fixing the candidate and forecast before previously unseen reference values are inspected. No such new reference acquisition is part of this diagnostic.

The [local validation contract](../../docs/LOCAL-VALIDATION.md) separates arithmetic, rule coverage, date correctness and real-world adequacy. The [calendar reconstruction guide](../diyanet/CIVIL-DATE.md) separately records publisher agreement and its coordinate/date limitations.

## Existing-corpus evidence

The [59-city-year comparison](../../methods/diyanet/LOCAL-CALENDAR-COMPARISON.md) compares the current local SPA profile and daily reconstruction against retained Diyanet publications, including blocked/estimated fields and both source-date interpretations. Its 105,134 paired available fields favor the reconstruction for calendar agreement. The sources were already exposed during development; this is not an independent holdout or observed physical accuracy measurement. The numerical defaults remain unchanged.
