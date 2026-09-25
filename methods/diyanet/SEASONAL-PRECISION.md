# Northern transition shape and intermediate rounding

**Rounding seasonal intermediates does not provide a defensible replacement for the current missing-window calculation.** One alternative slightly improves the total while worsening specific cities; the other creates a new three-minute error. A separate shape diagnostic also shows that the old baseline's positive straight-line contradictions cannot be carried forward to the current transition segments.

All 28 city-years and their source values were already exposed before this work. No calendar/API request or institutional contact was made. The full 61,320 planned fields remain represented: 61,312 source-comparable cells and eight unresolved original `00:00` markers. The source UTC interpretations are reused from the archived reviews, not newly inferred from candidate predictions.

## Where the current larger differences occur

Under the conditional interpretation placing Isha before Maghrib on the following date, the baseline has 53,291 exact values and 61,267 within one minute. Its 45 larger differences consist of:

| Current model branch | Fields more than one minute away |
|---|---:|
| Autumn transition | 38 |
| Spring transition | 1 |
| Frozen night ratio | 5 |
| Other: Kuopio sunrise | 1 |

The main autumn clusters are Narvik 2027 (18 Fajr and ten Isha fields) and Frankfurt 2027 (eight Fajr fields). This groups existing errors; it does not improve them or prove the publisher uses our branch structure. The unresolved Isha date convention remains distinct from numerical clock differences.

## Does the current transition need a nonlinear curve?

The diagnostic selects every maximal contiguous spring/autumn transition run without an applied solstice envelope, using only frozen model-rule labels. The 112 runs contain 2,592 source fields; none is discarded. Each printed UTC minute `u[i]`, relative to its model carrier midnight, constrains a hypothetical line:

```text
u[i] − 1/2 ≤ a + b × dayIndex[i] < u[i] + 1/2
```

Eliminating `a` produces strict rational slope bounds. An exact-fraction calculation finds **111 feasible segments, no positive contradiction, and one tie-only conflict**: Helsinki Isha, 23 August–11 September 2026. Its necessary open slope bounds meet at −1 minute/day. This remains infeasible under the declared tie rule; it is not silently counted as a match.

Predeclared diagnostics removing one or two dates from both ends leave all 112 runs feasible, with 2,368 or 2,144 retained fields respectively. Those trims are analytical checks, not a proposed calendar rule. Both source-date interpretations yield the same selected segment results.

The older V5 study's eleven positive contradictions used different segment bounds. They do not demonstrate that the **current** missing-window interpolation must be nonlinear. Conversely, feasibility of a separate free line for each segment does not prove a common institutional algorithm or supply valid endpoints. No line is fitted into the runtime.

The [shape audit aggregate](research/current-seasonal-shape-2026-09-25.json) also retains all 17 raw Asr-before-Dhuhr cases, eight of them still reversed after rounding. Equal source minutes in these cases do not identify source seconds or establish a clamp rule; existing chronology flags and earlier rejected clamp experiments remain in effect.

## Two separately frozen numerical hypotheses

Archived institutional criteria describe ratios, gradual transitions and minute margins, but do not prescribe the intermediate rounding below. These are explicitly unconfirmed numerical-convention hypotheses, not newly discovered religious rules. An older experiment rounded all daily fields and used older anchors; these two isolated operations had not been tested with the current missing-window endpoints.

1. **Rounded ratio inputs:** only the last-real-Fajr day's Fajr, adjusted sunrise and adjusted sunset are rounded before computing the frozen night ratio. June 21 remains the existing no-gap anchor. All other inputs and operations remain unchanged.
2. **Rounded estimated anchors:** only the estimated spring/autumn endpoint ordinates are rounded before applying the ±20-minute thresholds, threshold crossings and interpolation. The ratio and frozen-branch daily estimates remain unrounded, including the anchor dates themselves. Possible endpoint seams are preserved rather than repaired with another unplanned change.

Both use `floor(x + 0.5)` on UTC clock minutes, including negative values. They are tested separately; no combination, city exception, fitted coefficient or post-result adjustment follows. Complete six-event forecasts and code hashes were stored before scoring.

## Paired results, including losses

The following compares the same 61,312 fields under the **conditional next-day Isha interpretation**, which is not a publisher-confirmed event-date contract:

| Candidate | Exact | Within ±1 minute | Maximum | Newly exact / lost exact | New errors over one minute |
|---|---:|---:|---:|---:|---:|
| Current missing-window | 53,291 | 61,267 | 2 min | — | — |
| Rounded ratio inputs | 53,337 | 61,268 | 2 min | 436 / 390 | 2 |
| Rounded estimated anchors | 53,194 | 61,249 | 3 min | 203 / 300 | 23 |

The +46 exact total for rounded ratio inputs hides two new two-minute Isha errors, in Oulu and Kuopio 2027. The later four-city cohort falls from **8,091 to 7,980 exact /8,758**, losing 111 net exact matches. Its older 24-city-year cohort gains 157. The four-city group includes a reused Vienna calendar; neither it nor the other already exposed calendars becomes a new holdout here.

Rounded estimated anchors reduce within-one-minute counts in seven city/event groups. The ratio-input version reduces them in two. Both fail the predeclared replacement gate. All 81,760 non-twilight event objects across the two candidates remain unchanged, as do the underlying angular events; no annual calculation fails.

The primary **printed-date/IANA interpretation** is also retained. Exact/within-one-minute/maximum are 53,215 /61,190 /1,441 minutes for baseline, 53,260 /61,191 /1,440 for rounded ratio inputs, and 53,118 /61,172 /1,441 for rounded estimated anchors. These day-scale maxima expose the unresolved Isha row-date meaning; there is no modulo-day scoring or silent date repair. The two interpretations reuse the same observations.

The [precision aggregate](research/seasonal-precision-2026-09-25.json) preserves every city/event breakdown, source-zero count, new large error and gain/loss. The original forecasts and source calendars remain private; published aggregate records and hashes make the decision inspectable without redistributing them.

## Independent verification

A separate agent's Python implementation reproduced all 61,320 seasonal Fajr/Isha scalar values across the three variants, with zero floating-point difference. Its independently written scorer reproduced all 367,920 decisions across six events, three variants and two date interpretations, including every loss and both rejection decisions. These are repeated calculations over the same observations, not additional reference data.

The reviewer also independently selected the 112 transition runs and verified their exact rational bounds and intercept certificates, including the tie-only infeasibility and the endpoint-trim diagnostics. The [verification records](research/seasonal-precision-verification-2026-09-25.json) retain each report and its original file hash. This verifies arithmetic and reporting against reused source assignments; it does not independently establish the publisher's date convention or actual formula.

## Consequence

The remaining errors are concentrated enough to study endpoint and ratio definitions, but neither tested rounding shortcut improves transfer sufficiently. A more flexible fitted curve would add assumptions without resolving their source. Preserve the current calculator and the complete negative evidence; no new public method selector, default or notification eligibility is introduced.
