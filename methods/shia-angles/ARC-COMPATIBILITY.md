# ARC publisher-compatibility experiment

**An explicit local reconstruction now improves agreement with three newly acquired ARC annual calendars from 3,541 to 5,458 exact minutes out of 6,576.** Twelve near-hour discrepancies remain on New York's two DST transition dates. This is a publisher-compatibility experiment, not an official algorithm, a physically improved solar model, or a universal Shia/Sistani/Jafari method.

## Run and interpret

```sh
node scripts/run.mjs shia-angles --input methods/shia-angles/examples/arc-compatibility-input.json
```

The [input](examples/arc-compatibility-input.json) and [generated output](examples/arc-compatibility-output.json) are synthetic examples. Select `variant: "arc-publisher-compatibility"`; the native export is `calculateArcCompatibility(input)`. Its five required fields are `date`, `latitude`, `longitude`, `timeZone` and `maghribAngle`. Dates are restricted to 2000–2099, latitude to −60…60°, longitude to −180…180°, and the Maghrib angle to an explicit 3.75° or 4.5°. Timezone must be explicit IANA, with skipped civil dates rejected. No country or religious-authority inference chooses the angle.

The existing `own` default, Tehran/Leva/ARC profiles and physical event solver are unchanged. The compatibility result labels every available event `experimental-compatibility`; its model-assigned local dates and UTC instants are **not source-confirmed event dates**. Automatic notifications remain disabled. Asr and Isha are `unspecified`; unavailable twilight and dependent midnight remain null. The bounded fixed-point calculation does not guarantee physical root availability near a tangent and supplies no religious high-latitude replacement.

Calculations use only project JavaScript and the local timezone runtime. The three public-calendar requests were research acquisition after forecast freeze; they are not a dependency of the calculator or planned offline app. No source clocks, API keys, downloaded calendars or network code are included in this runtime.

## The separate reconstruction

The [original project-authored implementation](implementation/arc-compatibility/calculate.mjs) preserves a previously frozen research recipe:

1. Own USNO solar equations; 18° Fajr, −50′ sunrise/sunset and the explicit Maghrib angle. Iterate each angle event five times; round each final UTC epoch to the nearest minute.
2. A conjectured Gregorian-to-Julian month-term error: after converting January/February to months 13/14, add `round(30.6001*(m+1)) - floor(30.6001*(m+1))` ephemeris days. This affects May, July, October and December. It is an inferred implementation-error mechanism, **not correct astronomical calendar conversion or confirmed ARC code**.
3. An unconfirmed one-minute Dhuhr addition and a midnight midpoint using unrounded same-row Fajr plus 24 hours and same-row sunset. These reproduce source patterns but are not established religious prescriptions. The physical default instead uses next-civil-day Fajr.
4. Format each model instant with actual IANA event-time offsets. Source DST anomalies are not copied into the model's civil clock or concealed in primary comparison numbers.

The [ARC public interface](https://arabic.nojumi.org/prayertimes) supplies settings and calendars; its server calculation remains unavailable. The [USNO solar equations](https://aa.usno.navy.mil/faq/sun_approx) and [calendar conversion explanation](https://aa.usno.navy.mil/faq/JD_formula) are mathematical references, not evidence that ARC uses this implementation. The numerical recipe predates this export; this round adds a strict public interface, quality metadata, independent review and new comparisons.

## Fresh comparisons after frozen forecasts

Before requesting any of these three original calendars, both the unchanged own-USNO and selected compatibility forecasts for all 1,096 days were saved, along with code and evaluator hashes. Forecast freeze: **2026-09-25 12:41:14.094 UTC**. The same explicit assumed coordinates were passed to both calculators and the public source; they are not certified institution reference points. The pinned runtime uses IANA 2026d. Future timezone legislation remains outside this forecast.

| New annual source | Own-USNO exact | Compatibility exact | Compatibility within ±1 minute | Maximum |
|---|---:|---:|---:|---:|
| New York 2032, 40.7128° / −74.006° | 1,097 / 2,196 | 1,792 / 2,196 | 2,184 / 2,196 | 60 min |
| Cape Town 2033, −33.9249° / 18.4241° | 1,191 / 2,190 | 1,842 / 2,190 | 2,190 / 2,190 | 1 min |
| Kathmandu 2034, 27.7172° / 85.324° | 1,253 / 2,190 | 1,824 / 2,190 | 2,190 / 2,190 | 1 min |
| **Total** | **3,541 / 6,576** | **5,458 / 6,576** | **6,564 / 6,576** | **60 min** |

No compared event is missing in these three years. Relative to the own physical profile, 2,190 unequal values become exact and **273 previously exact values regress**. The remaining 1,118 unequal values comprise 1,106 one-minute differences and twelve 59–60-minute differences. The recipe was not amended after acquisition.

All twelve larger differences fall on 14 March and 7 November 2032 in New York, six markers per day. This is consistent with ARC retaining the preceding DST offset on the change date, repeating the older London/Stockholm pattern. Those dates follow the [current US DST rule](https://www.nist.gov/pml/time-and-frequency-division/popular-links/daylight-saving-time-dst) and the pinned timezone data. That inference does not prove server internals. The primary 60-minute maximum stays visible; a secondary exclusion of those twelve cells leaves all 6,564 within one minute. Midnight uses an explicitly circular clock comparison because the source supplies no event dates; none of this independently validates absolute UTC timing.

A later [row-date offset diagnostic](DST-DIAGNOSTIC.md) explains the New York pattern but introduces 24 new hour-scale errors in Sydney and Auckland. It was rejected as a general correction; this calculator and the primary figures above are unchanged.

A separate [UTC-date display hypothesis](UTC-DATE-DISPLAY.md) then explained all 36 known hour-scale differences across eleven annuals without regressions. This retrospective label-only result is not a confirmed publisher rule or notification-time correction; the runtime and primary figures remain unchanged.

## Exposed development evidence and rejected alternatives

On the eight previously known annuals, the unchanged compatibility recipe has **14,525 / 17,178 exact**, compared with **9,140 / 17,176** for the own-USNO profile. There are 17,532 planned fields: the own solver has 352 both-missing and four availability mismatches; compatibility has 354 both-missing and none. Missing pairs are not hits. Across commonly available pairs, 5,881 improve to exact and 497 regress. Twenty-four 59–61-minute DST disagreements remain in primary compatibility statistics. All other comparable fields are within one minute. These old calendars are development data, not fresh validation for this export.

This round tested and rejected two kinds of changes before freezing the fresh forecasts:

- Rounding Fajr/sunset to whole minutes before calculating midnight, with nearest, floor, ceil or half-even midpoint rounding, reduced exact agreement and introduced additional two-minute differences. The unrounded midpoint remains.
- Substituting the project's higher-order NOAA/Meeus coordinates increased overall development exactness from 14,525 to 14,589, but regressed 100 individual exact values and reduced exact counts in thirteen city/event groups. It failed the declared no-group-loss gate and was not selected.

[Aggregate evidence and private artifact hashes](research/compatibility-export-2026-09-25.json) retain both successful and negative findings. Raw institutional calendars are not redistributed; hashes alone cannot independently reproduce calendar accuracy.

## Checks

Public tests cover explicit selection, strict inputs, unchanged own defaults, unrounded midpoint construction, missing events, DST/date-line/skipped-date handling, local/UTC consistency, and execution with network, subprocesses, calendar files and external prayer libraries inaccessible. An independent review compared 168 synthetic inputs with the frozen private recipe; a separate export replay checked all six raw/rounded/date/status event fields for all 2,922 already exposed city-days. These are implementation checks, not extra institutional observations.

```sh
node core/timezones/with-tzdata.mjs --test tests/arc-compatibility.test.mjs
```

Remaining work includes source confirmation of the calendar epoch, Dhuhr rule, midpoint convention, event dates, DST handling and physical missing-event policy. Exact clock reproduction cannot certify religious correctness, and copying an apparent timezone error would not make an offline notification more reliable.
