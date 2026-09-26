# Why Berlin and Helsinki fail the exact endpoint test

**The Berlin contradictions are sensitive to changes of a few seconds in model horizons. Helsinki is a strict linearity/rounding-boundary conflict, not evidence for a positive minimum timing error.** These findings qualify the three failures in the [joint feasible-region study](JOINT-FEASIBLE-REGIONS.md). They do not identify the institution's hidden parameters or supply a new calendar formula.

This bounded retrospective investigation reused the existing archives. There were no new calendar/API requests or institutional contacts. The calculator, defaults, accuracy scores and notification status remain unchanged.

## Berlin: conditional sensitivity, with physical constraints retained

Keep `k=18/16=9/8`, the current model horizons and the same continuous autumn-anchor domain `[b−3,b+3]`. The original source-compatible Fajr/Isha lines have independently free slopes. First allow their shared night quotient `q` to vary in `(0,1)`, then separately hold it at the original model's `q0`.

Two precisely defined sensitivities are tested:

```text
Common clock shift:  R′ = R + c, S′ = S + c
Horizon half-span:   R′ = R − h, S′ = S + h
N′ = 1440 + R′ − S′ > 0
Bf = R′ − q N′ k, Bi = S′ + q N′
```

Positive `h` widens daylight and shortens the night. Neither perturbation is an identified physical cause: a real latitude or solar-model change need not produce a constant `h`, and a shifted longitude would require propagation through the complete calculator.

| Full-run case | Common-clock infimum, free `q` | Common-clock infimum, original `q0` | Half-span infimum, free `q` | Half-span, original `q0` |
|---|---:|---:|---:|---|
| Berlin 2026 | ≈3.007783 s | ≈4.251498 s | ≈51.132313 s | No feasible value |
| Berlin 2027 | ≈0.510447 s | ≈0.901119 s | ≈8.677596 s | ≈10.098726 s |

All finite bounds in this table are **unattained infima**: exact equality at the boundary is excluded by source-cell strictness. Nearby accepted witnesses are retained in the evidence. The free-quotient common-clock intervals overlap across both years, but each year still gets its own anchor and quotient. A compatible correction is not an inferred production coordinate.

The fixed-quotient control was separately frozen after the free-quotient results. It prevents the small free-quotient bounds from being described as a clock-only repair. Even with `q0` fixed, the transition location and source-line slopes remain free. Adding 4.25 seconds to current prayer times is **not** the tested operation and would not follow from this result.

For arbitrary independent horizon changes with `|ΔR|,|ΔS|≤ε`, the relaxed necessary bound follows from:

```text
Bf + k Bi = R + k S + ΔR + k ΔS
|ΔR + k ΔS| ≤ (1+k) ε
```

The independently checked common-clock projection supplies a matching physical witness for the reported free-quotient bounds, including the same unattained boundary. This certifies that diagnostic's minimum required maximum horizon change; it does not measure an error in Diyanet's raw event timestamps. Original observations contain whole minutes.

All 28 city-years remain controls. Zero-shift compatibility reproduces **25/26/27 cases** for full/one-end/two-end trimming with free `q`, and **13/16/19** with original `q0`. Helsinki's empty full-run source set remains empty under any horizon correction. [Full sensitivity results](research/three-case-sensitivity-2026-09-26.json), [fixed-quotient control](research/three-case-fixed-quotient-2026-09-26.json).

The earlier [coordinate-feasibility study](FEASIBLE-COORDINATES.md) already found no single Berlin point satisfying the selected two-year noon and horizon observations under the unchanged recipe. The new endpoint sensitivity does not overturn that result or justify a bundled fitted city point.

## The smallest Berlin contradictions contain four source cells

Every subset of at most three selected observations remains feasible under this endpoint model. At the declared leftmost anchor, each complete single-event run admits a physical quotient; a singleton of the other event can take the required endpoint value with a free slope because its observation day differs from that anchor. This proves feasibility for all-one-event and two-plus-one subsets, without mistaking a greedy deletion result for a cardinality proof.

We then exhaustively check all two-Fajr/two-Isha combinations:

| Case | Quartets tested | Infeasible quartets | Minimum contradiction size |
|---|---:|---:|---:|
| Berlin 2026 | 151,125 | 131 | 4 cells |
| Berlin 2027 | 185,328 | 9 | 4 cells |

All other quartets have an exact physical witness at a checked integer anchor. Each rejected quartet is certified over the **entire continuous interval**, not only an integer grid. Four-cell three-plus-one subsets are feasible by the same single-event argument.

One 2026 certificate uses Fajr on July 26 and August 6, paired with Isha on July 30 and August 16. One 2027 certificate uses Fajr on July 28 and August 16, paired with Isha on July 30 and August 18. These are conflicting constraints under our assumptions, not evidence that any particular source day is wrong. [All 140 certificates and the cardinality proof](research/berlin-minimum-witnesses-2026-09-26.json).

## Helsinki: one last row participates in every primary witness

The selected Isha run has 20 observations, August 23–September 11, 2026. All 20 singletons and all 190 pairs admit an affine line. Exactly **84 of the 1,140 triples** fail the current nearest-minute, ties-later convention. Each minimum witness contains:

- one date from August 23–29;
- one date from August 30–September 10;
- September 11.

The conflicts force a slope of exactly −1 minute per day, with incompatible inclusion of a half-minute boundary. Changing the global nearest-tie convention does not resolve the complete run:

| Rounding convention | Full run | Minimum conflicting triples |
|---|---|---:|
| Ties toward the later minute | Tie-only conflict | 84 |
| Ties toward the earlier minute | Tie-only conflict | 84 |
| Ties to the even minute | Tie-only conflict | 66 |
| Both bin boundaries included | Feasible closure relaxation | 0 |

The last row is an analytical dependency, not a demonstrated calendar mistake. Dropping September 11 makes the retained run affine-compatible; dropping only August 23 does not. A uniform one-day relabeling does not change the conflict. All 20 original local dates and UTC event dates agree, with UTC+03:00, so no after-midnight date reassignment is justified here.

A separately recorded local follow-up checks the actual model branch around that last date. On September 11, both the existing seasonal result and the raw-angle alternative already round to the archived Isha minute. On September 10 the seasonal result is one displayed minute later than the source, while September 12's angular result matches. Removing September 11 therefore removes a diagnostic contradiction without fixing a minute mismatch on that date. Previously tested integer/fractional endpoint conventions are not presented as a new candidate.

For each real tie policy, the infimum extra vertical bin tolerance is **zero but not attained**. Any positive expansion admits a line, while no exact line satisfies the unexpanded bins. Closing both ends is a mathematical relaxation, not a valid deterministic rounding policy to install. These observations do not establish a positive second-level discrepancy or a particular nonlinear transition equation. [Helsinki constraints, date witnesses and sensitivities](research/helsinki-minimum-witnesses-2026-09-26.json).

## Implementation and verification

The source-free [perturbation helper](diagnostics/transition-constraints/perturbations.py) eliminates the shared endpoint night duration and then the continuous location using exact rational linear inequalities. Strict bounds remain strict. The [fixed-quotient helper](diagnostics/transition-constraints/fixed_quotient.py) keeps the original quotient and explicitly requires a positive perturbed night. Their **11 new tests bring the Python diagnostic suite to 53**, including 1,250 elimination-versus-point comparisons. The existing 141 Node tests are unchanged.

The main driver verifies 3,285 projection witnesses, 2,190 direct coupled-quotient checks and 168 zero-shift controls. Independent rational vertex optimization reproduces all 252 signed correction unions and all 252 minimum/infimum results, using 1,494 open-piece and 1,743 knot problems. The fixed-quotient control independently reproduces all 168 sets and extrema, retains all 168 inclusions in the free-quotient sets and replays the earlier fixed-quotient zero-shift results. A separate Berlin audit reparses all 117 selected observations from the archived original JSON/HTML, checks their UTC conversion, and independently reproduces all 140 continuous quartet contradictions. The Helsinki checker passes 1,358 exact subset/policy checks and reparses all 20 timezone conversions. Source reparses, independent reviews, correction notes and publication hashes are retained in the [verification bundle](research/three-case-verification-2026-09-26.json).

The published helpers and synthetic tests are directly runnable. Complete archive-based replay also requires the private source calendars and study drivers; published hashes identify those inputs but do not supply them.

Review corrected an initial reporting flag that marked two equally empty projections as a certified bound despite having no witness. The final report requires feasible bound/witness sets; Helsinki's full-run certificate is false. No feasible interval or numerical result changed, and the original draft is preserved privately.

Review also caught an inverted assertion in the secondary Helsinki checker: it compared zero-tolerance infeasibility with positive-tolerance feasibility as though they should have the same status. The corrected checker explicitly verifies feasibility for positive tolerance under every policy and passes. The main frozen analysis and its results were unchanged.

## Decision

No source-grounded complete-calendar replacement emerged. The unresolved issue is the institution's numerical and transition contract: actual calculation point and solar intermediates, exact transition membership, and rounding behavior. The existing minute tables constrain these jointly but do not identify them separately. This round supplies specific small certificates and sensitivity bounds; it does not supply permission to add a city offset, discard a difficult day or change the Fajr factor.
