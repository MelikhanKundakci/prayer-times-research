# Autumn identification: independent segments, Fajr factor and pipeline order

The subsequent [joint autumn-anchor study](JOINT-AUTUMN-ANCHORS.md) tests complete adjacent-row and preceding-night interactions, plus exact continuously moving anchors. It added seven Python tests; the later [joint feasible-region work](JOINT-FEASIBLE-REGIONS.md) brings the diagnostic suite to 42. The counts below describe this earlier study.

**These investigations do not improve the prayer-time forecasts.** They implement three additional diagnostics and extend software invariant coverage. No replacement formula passes, no fitted factor is installed, and no notification eligibility changes. All 28 reference city-years were already exposed; no new calendar/API request or institutional contact was made.

## Discover compatible lines before consulting model labels

The preceding endpoint study selected runs using our model's autumn-transition labels. This investigation instead searches **June 22–December 15 within each case year**, independently for Fajr and Isha, with a seven-observation minimum. The axis is the printed civil row date. An observation is its assigned absolute UTC minute minus UTC midnight of that printed date:

```text
u[i] − 1/2 ≤ a + slope × civilDayIndex[i] < u[i] + 1/2
```

Unresolved/missing/zero source cells break the series. Conditional after-midnight Isha values can exceed 1,440; they are never reduced modulo a day. Both archived date interpretations are analyzed separately, as repeated interpretations of the same observations. The conditional dates are still unconfirmed by the publisher.

| Interpretation | Resolved observations | Unresolved breaks | Compatible intervals ≥7 days | Inclusion-maximal intervals |
|---|---:|---:|---:|---:|
| Printed date / actual IANA | 9,911 | 1 | 73,691 | 1,778 |
| Conditional Isha after Maghrib | 9,911 | 1 | 73,701 | 1,779 |

Overlapping alternatives are retained. A maximal interval merely cannot be extended while preserving some compatible straight line. It is **not an identified institutional transition**: ordinary astronomical curves can look linear after minute rounding, and intervals touching the search boundary are censored there.

Only after discovery do we compare with the 56 existing model-labeled autumn runs. In either date interpretation, 54 fit inside exactly one discovered maximal interval, one inside two, and Helsinki Isha 2026 inside none. Unique containment conditional on our old labels does not make the generating rule unique.

| Example | Current model-labeled run | Maximal compatible interval containing it |
|---|---|---|
| Frankfurt Fajr 2027 | July 14–August 20 | July 13–August 20 |
| Frankfurt Isha 2027 | July 14–August 16 | July 11–August 16 |
| Narvik Fajr 2027 | September 15–October 5 | September 13–October 5 |
| Narvik Isha 2027 | September 15–30 | September 13–30 |

These examples motivate further joint boundary/geometry investigation, but do not justify moving an anchor by the displayed number of days. A line can remain rounding-compatible outside the interval in which the publisher actually uses it. The [discovery aggregate](research/autumn-discovery-2026-09-25.json) retains every maximal alternative, slope bounds, witnesses, break dates and post-discovery comparisons; the private full enumeration retains every compatible subinterval.

## Can a different universal Fajr factor explain the endpoints?

Keep each previously modeled autumn inner day and its sunrise `R`, sunset `S` and night `N`. Let `Bf` and `Bi` range over the independently feasible affine-line values there. The current seasonal model assumes:

```text
Bf = R − q N k
Bi = S + q N
k = (R − Bf) / (Bi − S), with R − Bf > 0 and 0 < Bi − S < N
```

Exact interval division allows `q` to vary per case, but asks whether **one common k** could explain all pairs. The model's `18/16` remains an inferred interpretation of the published additional Fajr angle, not a confirmed production equation.

| Separate sensitivity | Nonempty case intervals / 28 | Contain `18/16` / 28 | One common factor exists |
|---|---:|---:|---|
| Full runs | 27 | 16 | No |
| Remove one observation at each end | 28 | 18 | No |
| Remove two at each end | 28 | 22 | No |

The full-run Helsinki Isha tie remains empty; it is not discarded. The failure is also present between two nonempty cases: **Oulu 2026 requires k > 1.1288009, while Oslo 2027 requires k < 1.1196289** under these fixed assumptions. Their ranges remain disjoint in both trimming sensitivities. Thus even freely choosing each case's quotient and both event slopes does not rescue one constant factor at the current anchors.

This does not rule out a date/latitude-dependent angle-to-time conversion or a different anchor rule. No compatible factor is selected for the calculator. Trimming is a diagnostic, not a calendar policy. The [factor aggregate](research/autumn-factor-identification-2026-09-25.json) retains every case, bound, status and year/city intersection.

## Does horizon-processing order explain the fixed endpoints?

Four existing horizon stages independently supply the quotient-day and autumn-anchor-day inputs: physical horizons; seven-minute Temkin; daily five-hour clamp; final solstice/directional envelope. That produces 16 fixed assignments with `k=18/16` and unchanged days.

At all **56 sampled anchors**, the Temkin, daily-clamp and final-envelope horizons are identical. Here the 16 assignments therefore collapse to four numerical possibilities. This is not equivalence at other calendar dates or at the outer threshold crossings.

| Quotient input / inner input | Compatible Fajr / 28 | Compatible Isha / 28 | Both / 28 | Previously compatible event endpoints lost |
|---|---:|---:|---:|---:|
| Physical / physical | 0 | 0 | 0 | 21 |
| Physical / adjusted | 4 | 9 | 4 | 15 |
| Adjusted / physical | 0 | 0 | 0 | 21 |
| Adjusted / adjusted, current | 9 | 12 | 3 | 0 |

No assignment passes the predeclared diagnostic gate: improve joint compatibility without losing an existing compatible event or availability. The physical/adjusted case is a control related to earlier raw-horizon tests, not a newly discovered institutional formula. Compatibility is only necessary with independently free slopes, not a full-year forecast score. [Complete pipeline results](research/autumn-pipeline-identification-2026-09-25.json).

## Software reliability and reusable tools

Fourteen new public Node tests cover complete annual Gregorian rows, all six event fields, leap year 2028, DST, raw-to-rounded instants, local ISO/UTC consistency, latitude limits, synthetic UTC−12/+14 controls, explicit unsupported southern inputs, and ±180° aliases at 64.7°N. All pass. These are software invariants; synthetic location/zone pairs and unsupported southern controls do not establish worldwide Diyanet coverage.

The source-free [identification tools](diagnostics/transition-constraints/identification.py) expose `affine_runs` and `positive_ratio` for contributors. They contain no calendars or institutional prayer rules. Ten new Python tests bring that diagnostic suite to **19** tests. CI runs them alongside the Node suite. Input contracts and examples are in the [diagnostic README](diagnostics/transition-constraints/README.md).

Independent review rebuilt the discovery observations from archived rows and reproduced every maximal interval and the full compatible-subinterval sets in both interpretations. A separate factor membership oracle verified **4,150** cases by intersecting numerator and scaled denominator intervals. Review also verified all **2,688** pipeline endpoint memberships, 224 extracted stage pairs and 40,880 preserved model-input values. A separate public-helper review checked 84 factor intervals and 2,187 synthetic segment cases. The [verification bundle](research/autumn-identification-verification-2026-09-25.json) records scopes and hashes. None adds new reference observations.

### Review corrections and limits

Before publication, review caught a wrong per-year discovery window, an incomplete extension predicate, and an empty endpoint interval being incorrectly mapped to a feasible ratio. They were corrected and independently rechecked; invalid intermediate reports remain marked as superseded in the private archive. The factor plan accidentally wrote `k=18` and `k=16`; the requested `18/16` is the actual reported comparison, and an unplanned reciprocal check was removed. The discovery window and printed-date normalization amendments are recorded rather than described as an untouched original plan. A post-result dependency-hash supplement documents imports omitted from the pipeline plan's initial list.

These diagnostics narrow the remaining hypotheses. A future numerical candidate must explain boundary selection and event values together, recompute the complete calendars, retain unavailable/date-ambiguous fields, and disclose every correction and regression. The current timing defaults remain unchanged.
