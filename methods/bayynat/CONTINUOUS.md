# Continuous solar coordinates with nearest-minute rounding

This opt-in local candidate evaluates the Sun at each event instead of holding its coordinates at 12:00 UTC for the whole day. On six already exposed point-months it improves **537 → 1,090 exact / 1,098** six-marker comparisons; all remaining differences are one minute. Five previously exact values regress. A separate adaptive comparison within the source’s year range gives **177/180 exact**, versus 110 for ceiling, with all values within one minute and no regressions. This is scoped evidence, not a confirmed institutional formula or a replacement for the unchanged ceiling default. **A subsequent 2036 Sydney comparison has zero exact matches under actual IANA time, with 59–61-minute differences; the wider study stopped on an empty Mumbai response. Those 2036 dates were subsequently found to exceed the frontend’s year picker range.**

## Run the calculation

```sh
node scripts/run.mjs bayynat --input methods/bayynat/examples/continuous-input.json
```

The [input](examples/continuous-input.json) selects `variant: "point-continuous-usno-nearest"` alongside `date`, `latitude`, `longitude` and an explicit IANA `timeZone`. The [output](examples/continuous-output.json) is a generated example, not a publisher fixture. The native export is [`calculateContinuousCandidate(input)`](implementation/continuous-candidate.mjs).

Gregorian years 2000–2099 and global coordinates are accepted as a mathematical input range, not a validated geographic coverage claim. A skipped civil date or ambiguous transit anchor is rejected. Poles, missing crossings and unresolved multiple roots remain unavailable; no high-latitude replacement rule is invented. Actual event dates and UTC offsets are retained, including when an event falls outside the requested transit's civil date.

The calculator imports only project-owned astronomical modules and uses the pinned timezone runtime. It needs no API, reference calendar, location database, external prayer library or per-city correction.

## What changed mathematically

The old recipe samples the own [USNO approximation](../../core/astronomy/solar-usno-v2.mjs) once at 12:00 UTC. In Tokyo that is 21:00 local time, many hours after dawn. Changing declination over those hours can move spring and autumn dawn predictions in opposite directions. This is a physical motivation for the comparison, not evidence that the publisher uses the same ephemeris.

The new recipe solves the height equation using solar declination and equation of time **at the candidate instant**:

```text
sin(altitude(t)) = sin(latitude) sin(declination(t))
                + cos(latitude) cos(declination(t)) cos(hour_angle(t))
```

Fajr and the Isha table marker use −18°; sunrise and the assumed sunset/Maghrib marker use exactly −5/6°. Dhuhr is the converged upper meridian crossing, without an added margin. Morning roots are searched between the preceding and current upper transit; evening roots between current and next transit. The shared solver checks crossing direction and preserves unavailable outcomes.

Asr is a separately declared sixth table marker: find the positive post-transit crossing of the instantaneous shadow-factor-one target, using `atan(1 / (1 + tan(abs(latitude − declination(t)))))` in its physical domain. The [existing physical solver](../../core/astronomy/physical-asr-solver.mjs) uses an equivalent numerically stable continuation, then rejects nonphysical roots. This does **not** establish the institution's meaning of a separately printed Asr column or override its legal prayer windows.

Each finite instant is rounded once to the nearest absolute UTC minute, then formatted in the requested IANA zone. Angles, horizon, points and minute offsets were not fitted. Rounding alone had already [failed as a general replacement](NEAREST-MINUTE.md); the geometry and rounding changes are evaluated together here.

## Known-data development

A declared 3×2 diagnostic compared fixed UTC12, one daily sample at converged local transit, and event-time coordinates, each with ceiling and nearest rounding. The five-marker comparison excludes Asr uniformly: event-time nearest gives **910/915 exact**, versus 437 for fixed ceiling and 825 for transit-sampled nearest. All six candidates and their regressions are retained in the [development aggregates](research/continuous-development-2026-09-25.json).

The subsequent six-marker continuation adds the pre-existing instantaneous physical Asr rule without testing other shadow conventions. These counts overlap the five-marker study and must not be pooled:

| Known source sample | Fixed ceiling exact | Continuous nearest exact | Continuous within ±1 minute |
|---|---:|---:|---:|
| Jakarta, April 2024 | 87 / 180 | 179 / 180 | 180 / 180 |
| Singapore, July 2024 | 82 / 186 | 186 / 186 | 186 / 186 |
| Tokyo, November 2024 | 69 / 180 | 177 / 180 | 180 / 180 |
| Tokyo, April 2031 | 87 / 180 | 177 / 180 | 180 / 180 |
| Cape Town, July 2031 | 117 / 186 | 186 / 186 | 186 / 186 |
| Quito, October 2031 | 95 / 186 | 185 / 186 | 186 / 186 |
| **Total** | **537 / 1,098** | **1,090 / 1,098** | **1,098 / 1,098** |

The candidate corrects 558 values and regresses five versus ceiling. Against the earlier fixed-nearest experiment it corrects 155 and regresses one (936 → 1,090 exact). Asr alone is 180/183 exact, compared with ceiling's 100/183; two previously exact Asr values regress.

**The known Berlin clock problem remains.** March 2026 gives only 15/186 exact and a 61-minute maximum under actual IANA interpretation. A separate, unconfirmed fixed-source-UTC+02 interpretation gives 176/186 exact versus ceiling's 141, all within one minute. That conditional diagnostic neither repairs the original clocks nor proves a provider timezone rule. Berlin is not pooled into the six constant-offset point-months.

## Prospective comparison

The declared cases were Sydney January 2036, Mumbai February 2036 and Buenos Aires September 2036. Both complete leap-year forecasts—1,098 point-days / 6,588 event slots per model—and 67 input files were frozen at **2026-09-25 13:31:24 UTC** before any request. These forecasts are not reference observations.

The [original prospective result](research/continuous-prospective-2026-09-25.json) retains all **540 planned slots**:

| Case | Compared / planned | Ceiling exact | Continuous exact | Continuous maximum |
|---|---:|---:|---:|---:|
| Sydney, January 2036 | 186 / 186 | 0 | 0 | 61 minutes |
| Mumbai, February 2036 | 0 / 174 | — | — | unavailable source |
| Buenos Aires, September 2036 | 0 / 180 | — | — | not requested after stop |

Sydney's continuous differences are **six +59, 179 +60 and one +61 minutes**; ceiling is +60…+62 minutes. Neither model has a value within one minute under the unchanged actual-IANA comparison. The continuous candidate improves 128 absolute differences and worsens none, but that is not minute-level source agreement. Actual Sydney January offset is +11 hours in the pinned tzdb. The hour-scale pattern suggests an offset convention problem; the source does not independently confirm its UTC interpretation, and its clocks are not shifted in this primary result.

Mumbai returned HTTP 200 with a success-shaped envelope but `data: null`. Both independent readers rejected it. The prescribed stop rule prevented the Buenos Aires request in this study: **354 slots remain uncompared**, comprising 174 failed-source and 180 not-requested slots. The empty response does not identify its cause or prove a leap-day problem. No failed request was retried.

Independent review reconstructs all 540 planned rows and 22 summary groups, verifies 279 Sydney source markers through both readers, checks the 67 frozen hashes and confirms acquisition/stop chronology. No fresh global-accuracy claim follows from this study.

**Source-range limitation discovered after acquisition:** the current [frontend script](https://www.bayynat.org.lb/js/PagesJS/MawakitAlSalate.js?v=400), verified by an ordinary static GET and identical to the archived script, sets the Gregorian year dropdown minimum to 1900 and the maximum selectable date to December 31 of the current year plus five. At acquisition in 2026 that means a maximum of 2031. The 2036 requests therefore exceeded the normal UI range, although the endpoint returned Sydney data. This prevents treating either response as evidence of behavior within the advertised picker range. It does not identify why Mumbai returned no data. A planned separate 2036 Buenos Aires continuation was cancelled before any request when this restriction was discovered; its prior forecast and review remain archived.

### Separate within-range identifier probe

After discovering the year-picker limit, a new **adaptive** study fixed the same Buenos Aires point and September month in **2029**, inside the confirmed range. Both full-year forecasts and 81 files were frozen before requesting its source. With `America/Argentina/Buenos_Aires`, the endpoint again returned HTTP 200 with `data: null`; all 180 planned slots remain unavailable in that separate result.

The frontend's browser-location routine uses `Intl.DateTimeFormat().resolvedOptions().timeZone`. The pinned runtime resolves that identifier to `America/Buenos_Aires`. A separately declared single probe changed **only this equivalent identifier** in the request. Every event value across all 365 forecast days—730 complete output objects / 4,380 event values for both models—was checked equal apart from the named-zone metadata. Another 93-file freeze preceded the probe. No coordinate, angle, rounding, date or UTC offset was fitted.

That request returned a complete source month:

| Buenos Aires, September 2029 | Ceiling | Continuous nearest |
|---|---:|---:|
| Exact / compared | 110 / 180 | **177 / 180** |
| Within ±1 minute | 180 / 180 | **180 / 180** |
| Maximum | 1 minute | 1 minute |

The candidate corrects **67 values with zero regressions**. Fajr, sunrise, Dhuhr, Asr table and sunset each match all 30 days; the Isha table has three one-minute-late differences. Full source dates and actual IANA offsets are retained.

Two independent readers reproduce all 270 original markers. A separate audit reconstructs all 180 comparisons and eight summary groups, verifies all 93 frozen files, full-year alias equivalence and request chronology. The [separate aggregate and provenance](research/continuous-alias-2026-09-25.json) preserve both the failed and successful identifier requests. This is an **adaptive request-contract test with an unchanged model and previously unseen source values**, not completion of the original three-case protocol. The two attempts concern the same 180 slots and must not be pooled. Success after changing an alias does not establish causality: request timing, caches and upstream variability were not controlled. It also does not prove that every backend requires browser-canonical aliases.

### Posthoc Sydney offset diagnostic

A separately labeled diagnostic assigns all 186 unchanged Sydney clocks to fixed UTC+10 instead of the actual January UTC+11. It gives 179/186 exact and all within one minute for the continuous model; ceiling gives 58 exact, 168 within one minute and maximum two. The primary zero-exact actual-IANA result remains unchanged. Sydney's offset at acquisition was UTC+10, so a current-offset convention is one hypothesis, **not a discovered backend rule**. The separate frontend GMT-display helper does not transmit a requested date, but it does not expose how the calendar backend computes its times. This posthoc diagnostic and the out-of-picker-range caveat prevent treating 179/186 as fresh validated accuracy.

## Verification and limitations

The five-marker independent Python audit reconstructs all 7,350 variant/source/interpretation rows, 324 score objects and 18 paired comparisons. It independently checks fixed/transit formulas and all 856 continuous height roots and directions in that study. This verifies the implementation of the chosen approximation, not a different astronomical ephemeris or the publisher's production code.

Public tests cover strict inputs, raw geometry, positive Asr roots, poles, DST, fractional offsets, date lines, actual event dates, UTC rounding and execution with network, subprocesses, libraries and calendar files inaccessible.

```sh
node core/timezones/with-tzdata.mjs --test tests/bayynat-continuous.test.mjs
```

The original [public calendar](https://www.bayynat.org.lb/prayer-time) is the comparison source. Production coordinates, elevation handling, rounding, source UTC/date semantics and the separate Asr/Isha table meanings remain unconfirmed. All outputs remain non-official, non-production and ineligible for automatic notifications. Printed-minute agreement is not a measurement of sky accuracy or religious correctness.
