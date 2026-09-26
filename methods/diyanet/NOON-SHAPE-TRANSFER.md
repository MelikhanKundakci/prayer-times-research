# Testing the noon shape without choosing a city correction

**The fixed equation-of-center hybrid explains more annual noon shapes, but still does not improve the complete deployable prayer calculation.** This follow-up separates original-proxy clock agreement from compatibility with an unknown constant city offset. It also isolates the equation-of-time and declination channels to explain the previous all-event rejection.

The [previous experiment](EQUATION-OF-CENTER.md) supplies both fixed solar formulas. No coefficient, angle, location, margin, date policy or rounding parameter is changed here. All 59 calendars were already exposed. This is an explanatory follow-up after seeing the previous result, not a new blind validation or a search that selects a new production formula. No new prayer-calendar request or institution contact is involved.

## Original-proxy noon results

| Year | Comparable Dhuhr fields | Current exact | Hybrid exact |
|---|---:|---:|---:|
| 2025 | 365 | 363 | 363 |
| 2026 | 4,745 | 4,481 | 4,485 |
| 2027 | 16,425 | 14,808 | 14,806 |
| **All** | **21,535** | **19,652** | **19,654** |

Every compared noon remains within one minute. The hybrid gains 39 exact matches and loses 37. The original-proxy improvement is therefore only two net matches, with a small 2027 regression. This table uses no source-fitted city terms. It does not establish Diyanet's undisclosed production coordinates.

## Eliminate the unknown offset instead of fitting it

For each reference minute `M`, adjusted raw model noon `R`, and an unknown **constant** clock shift `d`, nearest-minute agreement requires

```text
M − R − 30 seconds ≤ d < M − R + 30 seconds.
```

Intersect these intervals over a year, or both years together. A nonempty intersection means that *some* constant offset can explain every noon minute under the frozen model. An empty intersection proves that no constant offset can do so. We do not choose an offset, calculate a best-fit forecast, or identify a real-world location.

At a fixed ephemeris date and carrier, longitude changes raw noon by −240 seconds per degree. Thus the unknown longitude is confounded with a constant clock shift. Noon contains no latitude term. This check concerns the **shape through the year**, after eliminating one constant nuisance quantity; it cannot validate latitude, solar declination or the other prayers.

The calculation uses exact rational arithmetic for the parsed binary64 raw model values and integer source minutes. Lower cell boundaries are included and upper boundaries excluded. A touching open endpoint is incompatible, even when its numerical gap is zero. This algebra is exact for the supplied numbers; the original astronomical calculations remain floating approximations, and the source minute values do not reveal true event seconds.

| Compatibility question | Current USNO | Fixed center hybrid |
|---|---:|---:|
| One constant per annual calendar | 34 / 59 | **50 / 59** |
| One constant shared by 2026 and 2027, same 12 cities | 3 / 12 | **10 / 12** |

The annual result includes **20 newly compatible cases and four newly incompatible cases**: Oslo 2027, İzmir 2027, Istanbul 2026 and Jakarta 2027 become incompatible. In the two-year comparison, seven cities become compatible and none loses compatibility. These are feasibility counts, **not exact-match accuracy scores**. The joint check uses both years in its constraints and must not be presented as a temporal holdout.

Cape Town and Reykjavík remain incompatible across the two years. Their hybrid interval gaps are about **0.024380 seconds** and **0.106385 seconds**, respectively. A gap measures conflict between minute-cell constraints; it is not an observed timing error or a claim of hundredth-second accuracy. Bounding the nuisance shift to the earlier diagnostic range of ±60 seconds leaves all reported compatibility counts unchanged.

For an **unbounded** constant shift, ordinary nearest, floor and ceiling quantizers of the same minute width merely translate every admissible interval by a common amount. Positive-gap compatibility is invariant to that translation. Different tie policies can matter at a zero-width intersection, and bounded shifts or fixed coordinates can change this conclusion. This does not identify the publisher's rounding implementation.

## Which solar output causes the calendar changes?

The core uses equation of time for transit and declination for solar-height geometry. We froze four source-free forecasts: current model, complete center hybrid, hybrid equation of time with current declination, and hybrid declination with current equation of time. The two isolated channels are diagnostic mixtures; they are **not physically self-consistent solar ephemerides** and are not app calculation options.

Under the same conditional evening-cycle interpretation used previously:

| Diagnostic | Exact / 128,755 | Within one minute / 128,755 | New errors over one minute |
|---|---:|---:|---:|
| Current model | 114,770 | 128,703 | — |
| Complete center hybrid | 114,799 | 128,699 | 4 |
| Equation-of-time change only | 114,807 | 128,702 | 1 |
| Declination change only | 114,753 | 128,699 | 4 |

The equation-of-time-only experiment introduces a Fajr regression in Narvik on October 1, 2027, from one to two minutes late. Declination-only introduces four larger-error regressions. The complete hybrid and isolated channels do not have identical regression dates; final rounding is nonlinear. Neither channel supplies a justified way to repair the previous candidate by combining its best-looking parts.

All 129,210 planned fields remain represented, including 455 unresolved source zero cells excluded from scoring. Both literal printed-date and conditional evening-cycle interpretations are retained in the report. The latter does not establish after-midnight Isha timestamp ownership. Neither availability nor carrier/ephemeris dates change. Maximum raw channel interaction is about 0.0173 seconds for Fajr; noon interaction is zero.

## Evidence and reusable tools

The [aggregate report](research/equation-center/transfer-comparison.json) preserves both date interpretations, original-proxy noon results, all annual and joint interval results, regression witnesses, code/input hashes and independent checks. It does not redistribute original publisher clocks. Code checks are reproducible without any prayer API; the institutional replay requires the retained observations.

The [exact noon-shift diagnostic](diagnostics/transition-constraints/noon_shift.py) accepts resolved model/reference pairs supplied by a caller and returns the complete admissible interval and its limiting witnesses. It rejects empty inputs and rejects incomplete inputs by default; explicitly allowed missing values yield `insufficient-data`, never partial feasibility. It never chooses a correction. The [channel providers](research/equation-center/channels.mjs) and [source-free verifier](research/equation-center/verify-channels.mjs) expose the decomposition for contributors, outside the public prayer-time API.

The result strengthens the physical-center hypothesis specifically as an explanation of **annual noon shape after an unknown constant shift**. It does not establish Diyanet's solar implementation or identify a global GPS correction. Existing runtime formulas, supported domains and institutional-equivalence status remain unchanged.
