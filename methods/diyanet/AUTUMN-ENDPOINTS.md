# Autumn endpoints: constraints and two rejected daily-gap hypotheses

The subsequent [autumn identification study](AUTUMN-IDENTIFICATION.md) adds independent segment discovery, a joint Fajr-factor diagnosis and horizon-stage screening. Moving-anchor and [joint feasible-region work](JOINT-FEASIBLE-REGIONS.md) bring the public diagnostic suite to 42 tests, including the original nine described below.

**Changing one endpoint, a common city clock shift, or one frozen night quotient cannot explain every current autumn segment.** Two new, fully calculated daily-gap alternatives also fail. This study narrows the remaining problem; it supplies no new default correction or notification approval.

All 28 city-years were already exposed. No new calendar/API request or institutional contact was made. Endpoint diagnostics, the later quotient diagnostic and the two numerical candidates have separate frozen plans. The quotient diagnostic was explicitly declared **after** the endpoint results were known. These are retrospective investigations, not blind tests.

## Which endpoint is incompatible?

Select every maximal un-enveloped Fajr/Isha autumn-transition run from the unchanged model labels: **56 runs, 1,313 source-minute fields, all 28 city-years**. No error-based selection is used. Each displayed minute `u[i]` constrains a possible line:

```text
u[i] − 1/2 ≤ a + s × dayIndex[i] < u[i] + 1/2
```

The exact-rational calculation separately fixes either the model's inner estimated point or its outer angle-crossing point, allowing the other end and slope to vary. It also checks an entirely free line. Stored binary64 endpoint numbers become their exact rational values; no epsilon expands the rounding cells.

| Conditional constraint, full runs | Compatible |
|---|---:|
| Fixed inner point, free slope | 21 / 56 |
| Fixed outer point, free slope | 9 / 56 |
| Completely free affine line | 55 / 56 |

In **31 runs**, either fixed endpoint alone rules out exact reproduction even though some different line is compatible. One Helsinki Isha run retains the previously reported tie-only infeasibility. Removing one or two endpoint dates is separately reported as a diagnostic, never as a new prayer-time rule.

A free value interval at an endpoint is not a measured source second. It is the projection of all lines consistent with rounded observations under our assumptions. Feasibility also does not prove that one general algorithm generates the lines. The [complete derived aggregate](research/autumn-endpoint-inverse-2026-09-25.json) retains all runs, bounds, inclusion rules, witnesses and fixed trimming diagnostics without redistributing original calendar rows.

## Clock shifts and quotient changes

A common city clock shift can make both Fajr/Isha **inner** endpoints compatible in 14/28 city-years, and both outer endpoints in only 1/28. Such a shift is confounded with longitude under this fixed daily model; no production coordinate is inferred.

The required inner shifts have opposite signs in two prominent cases:

| City-year | Fajr compatible shift | Isha compatible shift |
|---|---:|---:|
| Narvik 2027 | About −114 to −102 seconds | About +81 to +101 seconds |
| Frankfurt 2027 | About +61 to +70 seconds | About −48 to −35 seconds |

These are conditional constraints, not second-level Diyanet errors. A common clock shift cannot satisfy either pair. A night-quotient change is different: it moves Fajr and Isha in opposite directions.

The additive quotient study retains the same inner day, sunrise `R`, sunset `S` and night `N = 1440 + R − S`. It transforms compatible endpoint-value intervals using:

```text
Fajr inner value = R − q × N × 18/16
Isha inner value = S + q × N
```

A shared `q` exists for **16/28** full-run pairs; eleven are incompatible and Helsinki retains its tie conflict. The current model `q` belongs to both intervals in only 3/28. This is not a new accuracy score: both event slopes remain independently free, and recomputing the actual outer crossing at a new `q` is not tested by this constraint.

For Narvik 2027 the compatible open interval is approximately `(0.1912376163, 0.1915146049)`, versus the current `0.1887893774`. Frankfurt's Fajr and Isha intervals do not overlap. A tuned quotient therefore cannot solve even these two cities under all the fixed assumptions. No midpoint, fitted quotient, latitude or corrected clock is selected for the runtime. The [quotient aggregate](research/autumn-quotient-inverse-2026-09-25.json) preserves every result and the additional assumptions.

## Two actual local calculations, including failures

The archived official [Turkish criteria](https://www.awqatsalah.com/sub/34/tespit-kriterleri) and [English criteria](https://www.awqatsalah.com/sub/18/calculation-criteria) compare real and estimated Fajr and describe a 20-minute transition margin. They do **not** specify the autumn-return equations below. The existing `18/16` factor remains an inferred model interpretation, not a newly established institutional formula.

We tested exactly two alternatives for **autumn Fajr in gap years**, each independently:

```text
Frozen-ratio estimate: E[i] = R[i] − q × (1440 + R[i] − S[i]) × 18/16
Real-night estimate:   E[i] = R[i] − (F[i] + 1440 − S[i]) / 3 × 18/16
Gap:                  g[i] = F[i] − E[i]
```

`F` is raw angular Fajr. After the last missing-Fajr day, find the unique adjacent finite crossing `g[left] < 20 ≤ g[right]`, interpolate the crossing day and raw Fajr value, and connect it to the unchanged inner endpoint. No-gap years, spring, Isha, all other events, solar inputs and final rounding remain unchanged on supported calculations. Missing, duplicate or plateau crossings are explicitly unsupported; no fallback is chosen after scoring.

The table uses the **conditional next-day interpretation for nonzero Isha before Maghrib**, which remains unconfirmed by the publisher. Every variant retains 61,320 planned fields and eight unresolved source `00:00` values:

| Model | Unavailable | Compared | Exact | Within ±1 minute | Maximum |
|---|---:|---:|---:|---:|---:|
| Current missing-window | 0 | 61,312 | 53,291 | 61,267 | 2 min |
| Daily frozen-ratio gap | 2,190 | 59,122 | 50,420 | 57,974 | 39 min |
| Daily real-night gap | 0 | 61,312 | 52,943 | 60,689 | 22 min |

The first candidate has two crossings in Kiruna 2027, leaving its entire annual output unavailable as predeclared. It loses 846 previously exact numerical values plus 2,031 exact-to-unavailable values, against six corrections. The second loses 351 exact values against three corrections. Both worsen the later four-city cohort as well; all of those calendars, including reused Vienna, were already exposed.

The primary printed-date/IANA comparison is also retained: baseline/frozen/real-night exact totals are 53,215/50,344/52,867; within-one totals are 61,190/57,897/60,612. All retain the existing 1,441-minute maximum from unresolved Isha date semantics. No modulo-day score or conditional table hides that problem. The [daily-gap aggregate](research/autumn-daily-gap-2026-09-25.json) records complete city/event losses, unavailability, both interpretations and evidence hashes.

## Independent checks and reusable mathematics

A separate Python oracle reproduced all 40,150 available candidate seasonal scalars within 1.14×10⁻¹³ minutes, confirmed the same unsupported case, and verified 100,375 unchanged other-event objects. An independently written scorer reproduced all 367,920 decisions across models and repeated date interpretations, including losses and failure denominators.

The root reviewer independently verified 1,008 endpoint intervals through exact polygon vertices and strict-bound face certificates, using a different method from the author's elimination algorithm. A further 588 quotient-interval comparisons agree. The [verification bundle](research/autumn-endpoint-verification-2026-09-25.json) records these scopes and hashes. None constitutes an independent new ephemeris or original-calendar parse.

The source-free [Python diagnostic](diagnostics/transition-constraints/) is published for contributors to test their own half-open affine constraints. Its nine synthetic tests require no calendar files. A corrected compound-conflict label in this public V2 module leaves every interval and classification in the frozen studies unchanged. It does not calculate prayer times or supply deployment parameters.

The next useful investigation must explain **both** boundary values and their selection, while separating quotient/latitude uncertainty from interpolation assumptions. Simply allowing a more flexible line or fitting each city's quotient would not establish a transferable institutional calculation.
