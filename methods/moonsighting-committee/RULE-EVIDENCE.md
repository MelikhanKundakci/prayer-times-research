# Moonsighting Committee: published guidance versus output reconstruction

Reviewed 25 September 2026. The primary [calculation explanation](https://www.moonsighting.com/how-we.html) says it was updated 1 March 2024. It is guidance, not source code or a precision specification. No new calendar/API queries were made.

## Primary guidance

The page specifies Dhuhr five minutes after solar noon and Sunni Maghrib three minutes after theoretical sunset. It describes comparing 18° twilight with seasonal bounds, using later Fajr and earlier Isha. For 55–60° it discusses seventh-of-night bounds; beyond 60° it describes a summer substitution to 60° for Fajr/Isha.

The same page gives inconsistent seasonal red/white-twilight orderings in its general-shafaq discussion. It does not supply exact switching dates, all coefficients, a seconds-rounding policy, or an unambiguous southern extension. These details are not resolved by guessing.

## Current reconstruction and narrow supported addition

The default V4.2 uses **298.8 seconds** for Dhuhr as a compatibility hypothesis inferred from archived minute outputs. The primary wording supports **300 seconds**. Those are distinct evidential claims. The published-guidance variant added in this audit applies 300 seconds, while retaining our solar engine, seasonal implementation and nearest-minute output convention. It does not claim to implement the complete guidance above.

```js
import {calculate} from './index.mjs';
const rows = calculate({
  variant: 'published-dhuhr-five-minutes',
  year: 2028, latitude: 33.5731, longitude: -7.5898,
  timeZone: 'Africa/Casablanca', shafaq: 'general'
});
```

The [implementation](implementation/published-dhuhr.mjs) preserves every non-Dhuhr event and recalculates ordering flags against the selected Dhuhr. `dhuhrCalculation.adjustedEpochMs` exposes the unrounded model value with the 300-second margin. It is not an observational seconds-accuracy guarantee; published minute rounding remains a reconstruction and notification eligibility remains false. The implicit default and explicit `usno-v4.2` selector retain the archived default behavior.

## Retrospective comparison

All **27 previously archived city/year/shafaq cases** were replayed with tzdb 2026d. No parameter was selected from this replay and there is no new holdout. Both variants have 69,055 planned cells, 68,256 comparable cells and 799 both-missing cells, which are not exact matches.

| Metric | Default 298.8 s | Published-margin 300 s |
|---|---:|---:|
| Exact Dhuhr minutes / 9,865 | 9,779 | 9,590 |
| Exact all-event minutes / 68,256 | 67,599 | 67,410 |
| All-event agreement within ±1 min / 68,256 | 68,227 | 68,227 |
| Maximum displayed-minute difference | 60 | 60 |

The 1.2-second unrounded change crosses a minute boundary on 193 days: 2 exact gains and 191 losses. All other six event columns are unchanged. Existing Sydney/Wellington DST disagreements and Kiritimati date-row differences remain in the comparison. The new option improves fidelity to the stated margin, **not** agreement with the archived calculator. It therefore does not replace the default or inherit its historical exact-match claims.

The [aggregate report](research/published-dhuhr-comparison-2026-09-25.json) includes every case, event denominator, signed histogram, source hash, gain and regression. The [offline evaluator](research/compare-published-dhuhr.mjs) accepts an existing archive containing the historical manifests and source files; the third-party originals are not redistributed:

```sh
node core/timezones/with-tzdata.mjs \
  methods/moonsighting-committee/research/compare-published-dhuhr.mjs \
  /path/to/existing/global-archive /tmp/published-dhuhr-comparison.json
```

The [runnable example input](examples/published-dhuhr-input.json) and [generated output](examples/published-dhuhr-output.json) use Berlin 2026. Run it with `node scripts/run.mjs moonsighting-committee --input methods/moonsighting-committee/examples/published-dhuhr-input.json`.

Focused tests cover the selector, unchanged default, unchanged other events, polar missing events, ordering flags, the 1.2-second threshold relationship, and execution with network, reference-file and child-process access denied under two host timezones. The unresolved >60° guidance and seasonal ambiguity remain separate work; the optional margin is not a global latitude-rule fix.
