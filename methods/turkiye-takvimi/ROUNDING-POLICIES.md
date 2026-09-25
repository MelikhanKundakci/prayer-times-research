# Can fixed event-specific rounding resolve the shared-horizon contradiction?

**No: all 729 globally fixed nearest/floor/ceil policies fail at least three of the 365 known Istanbul 2026 days under the retained geometry.** This is a stronger conditional constraint, not an improvement to the published clock calculations. No rounding policy, daily correction or replacement calculator is selected.

The [earlier diagnostic](COMMON-HORIZON.md) assumed one rounding operator for every event. The publisher's [Temkin explanation](https://namazvakti.com/documents/Temkin.MuddetiNV.pdf), page 6, says published seconds are rounded into minutes without specifying the operator. Its [event definitions](https://namazvakti.com/documents/VakitlerinAciklamalari.pdf) distinguish sunrise as an ending marker from prayer starts and the Imsak boundary. Those distinctions motivate testing the uniform-rounding assumption; they do not establish a particular institutional policy.

## Exhaustive finite family

Assign nearest, floor or ceil independently to Fajr, sunrise, Dhuhr, Asr, Maghrib and Isha. Each of the resulting **3⁶ = 729 policies** is fixed for the entire year. Operators never change by day, season or city. Every previously exposed source day remains in every test.

Keep the published point 41°N/29°E and the existing own continuous NOAA geometry: Fajr −19°, Isha −17°, true transit and factor-one Asr with a target based on transit declination. The publisher names MICA; our calculation is not a verified MICA reproduction. As a deliberately permissive mathematical relaxation, allow any common Temkin `T(d)` and any shared sunrise/Maghrib solar-center horizon `H(d)` on each day. No values of those daily quantities are selected as a model.

For each event's printed minute `M`, form its closed outer rounding cell: nearest `[M−30s,M+30s]`, floor `[M,M+60s]`, ceil `[M−60s,M]`. Closing the actual half-open endpoints makes satisfaction easier. First intersect the four non-horizon Temkin intervals. If that survives, propagate its full range to conservative sunrise and Maghrib altitude bounds. Disjoint altitude ranges exclude a shared horizon. Each horizon may even choose its own Temkin inside the same four-event interval, another conservative relaxation.

The altitude enclosures use the [previously reviewed derivative bounds](COMMON-HORIZON.md#verification-and-scope) on the implemented NOAA formula. An overlapping enclosure is only inconclusive; it is never counted as an exact clock or a valid calculation rule.

## Results and limitations

| Classification | Policy/day cases |
|---|---:|
| Four-event Temkin intersection already empty | 142,893 |
| Additional shared-horizon exclusions | 41,233 |
| Outer overlap, still inconclusive | 81,959 |
| **729 policies × 365 days** | **266,085** |

All 729 policies have at least one exclusion. Every policy fails on **at least three days**; the maximum is 364 excluded days. No policy survives the outer test for the full year, so the predeclared second stage for coupled feasibility witnesses is not used. No daily fitted Temkin or horizon values are produced.

The three uniform policies exactly reproduce the previous diagnostic: nearest has 2 non-horizon plus 60 horizon exclusions, floor 267 plus 87, and ceil 285 plus zero. Allowing event-specific operators removes many of those exclusions, but not the full-year contradiction.

For transparency, three policies have only three excluded days:

| Fajr | Sunrise | Dhuhr | Asr | Maghrib | Isha |
|---|---|---|---|---|---|
| nearest | ceil | nearest | nearest | ceil | nearest |
| floor | ceil | ceil | ceil | ceil | ceil |
| ceil | ceil | floor | floor | ceil | floor |

These are limits of the exclusion proof, **not selected recipes**. All three have small non-horizon contradictions on **February 8 and 9**, approximately **0.735 and 1.216 seconds**. A different ephemeris or a small geometry change could affect those cases. They also have a larger shared-horizon conflict on **December 17**, with conservative altitude ranges separated by approximately **0.1086–0.1088°**. Their other 362 days merely pass a necessary condition; they have not been demonstrated to reproduce those days.

No single day excludes every policy. The constraint is that **no one policy satisfies the complete year consistently**. Choosing a different operator for each date would answer a different question and is not used here.

## Verification and next step

A plan and input hashes were saved before evaluation. The complete existing baseline objects remain identical on all 365 days. An independent Python calculation reproduces all **266,085 policy/day classifications**. Three focused private tests check signed rounding cells, conservative altitude containment, and synthetic feasibility/exclusion cases for the unused optional stage. The [aggregate report](research/rounding-policies-2026-09-25.json) retains every policy's counts and private evidence hashes; original calendar rows, derived time intervals and the full per-day matrix are not redistributed.

All source days were already known, so this is not fresh institutional validation. The exported calculator, default, original error measurements and previous negative findings remain unchanged. The result does not establish publisher error or exclude different production points, MICA geometry, event meanings or a different horizon/Temkin construction. It does show that another fixed choice of nearest/floor/ceil for each column is insufficient under the current assumptions. A current worked institutional calculation with intermediate quantities remains more useful than another unsupported clock adjustment.
