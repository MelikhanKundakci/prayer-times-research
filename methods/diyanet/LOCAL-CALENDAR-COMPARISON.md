# Local point calculations and Diyanet calendar agreement

**The daily-coordinate reconstruction agrees more closely with the retained Diyanet minute rows than the continuous local SPA profile at the same historical points. No numerical default changes follow from this study.** The result concerns calendar compatibility; it does not show that continuous solar-position arithmetic is less accurate or identify Diyanet's unpublished production algorithm.

This retrospective study covers **59 city-years, 21,535 days and 129,210 six-marker fields**, all previously exposed during research. Coordinates are unchanged historical proxies or derived points, not certified publisher calculation points. The reconstruction was developed against this corpus. There is **no new holdout**, no new timetable/API acquisition and no personal GPS case. Original source rows remain private. The [full aggregate evidence](research/local-calendar-comparison-2026-09-26.json) retains every event, region, case, month, season, cohort and year grouping, with both date interpretations and signed histograms.

## Same-point, paired comparison

The principal comparison uses **105,134 fields** with a usable source and an available selected instant in both models. It does not compare percentages from different coverage subsets. Both methods use explicit coordinates; neither calculation reads calendar rows at runtime.

| Source-date interpretation | Model | Exact / 105,134 | Within ±1 minute / 105,134 | Maximum absolute difference |
|---|---|---:|---:|---:|
| Printed source date | Daily civil-date reconstruction | 95,130 (90.48%) | 105,072 (99.941%) | 1442 min |
| Printed source date | Continuous local SPA profile | 60,203 (57.26%) | 93,808 (89.227%) | 1463 min |
| Conditional evening-cycle date | Daily civil-date reconstruction | 95,165 (90.52%) | 105,130 (99.996%) | 3 min |
| Conditional evening-cycle date | Continuous local SPA profile | 60,203 (57.26%) | 93,808 (89.227%) | 23 min |

The primary interpretation attaches a printed clock to its printed date in the actual IANA timezone. The secondary interpretation conditionally moves Isha to the next date when its printed clock precedes that row's Maghrib. This changes 215 source fields in the full corpus; its intended publisher semantics are still unconfirmed. The two interpretations describe the same observations and must not be added together. Day-scale primary differences are retained rather than wrapped modulo 24 hours.

Restricting the comparison further to **104,498 pairs where both statuses are `calculated`** gives conditional exact agreement of **90.53% for the reconstruction and 57.31% for the local profile**. Excluding explicit estimates does not remove the main difference. It also does not equate sampling epochs, event ownership or other numerical conventions.

Under the conditional interpretation, switching the compared model from reconstruction to local SPA makes 3,050 previously unequal fields exact, but loses 38,012 exact matches. Absolute error improves for 3,050 fields, worsens for 39,293 and is tied for 62,791. Every one of the 59 case-years has lower paired exact agreement for the local profile. These are development-corpus comparisons, not prospective estimates of worldwide error.

## Which events differ

The following uses the explicitly conditional interpretation above. Each row has its own paired denominator because the local profile leaves unresolved events empty.

| Event | Paired fields | Reconstruction exact | Local SPA exact | Local maximum difference |
|---|---:|---:|---:|---:|
| Fajr | 11,885 | 90.33% | 79.18% | 7 min |
| Sunrise | 19,096 | 90.27% | 62.54% | 11 min |
| Dhuhr | 21,535 | 91.26% | 85.72% | 1 min |
| Asr | 21,519 | 90.04% | 43.95% | 3 min |
| Maghrib | 19,096 | 90.26% | 31.28% | 5 min |
| Isha | 12,003 | 91.04% | 41.33% | 23 min |

Asr and Maghrib account for many of the ordinary-calendar differences. The models apply the same ordinary selected angles and integer margins, but the reconstruction uses solar coordinates sampled at UTC00 of the requested civil date while the local profile evaluates changing solar coordinates at each event. This time-sampling difference varies with event, location and season; it is not a uniform one- or two-minute correction. Northern policy behavior also differs and must be inspected separately. The [per-prayer source audit](LOCAL-RULE-AUDIT.md) distinguishes published rules from each implementation's conventions.

The largest conditional local residual is Isha at Ushuaia on 13 November 2027: **+23 minutes**, versus +1 for the reconstruction, with both Isha statuses `calculated`. Its primary residual is +1,463 minutes because of the separate source-date interpretation issue. The local and reconstructed selected instants differ by about 22.43 minutes. This occurs near disappearing southern twilight. An independent retained Python/pvlib SPA solver reproduces all five present physical/selected events within 0.000108 seconds and confirms Fajr's physical absence at that point and date. That verifies arithmetic under the same assumptions, not observational accuracy or the publisher's rule. The aggregate evidence retains this additional check.

## Coverage is part of the result

All **129,210 planned fields** remain visible, including 455 original ambiguous `00:00` values excluded from scoring.

| Model status | Reconstruction | Local SPA profile |
|---|---:|---:|
| Calculated | 112,979 | 104,797 |
| Estimated by that model's policy | 15,785 | 341 |
| Policy-blocked | 0 | 23,625 |
| Unavailable physical/geometry result | 446 | 447 |
| All six selected outputs present, out of 21,535 days | 21,300 | 11,886 |

The local blocked fields comprise 18,731 unresolved northern twilight selections, 4,878 northern horizon selections and 16 selected-order conflicts. These are not silently replaced with reconstruction values. Completeness means populated outputs under the model's rules, not notification eligibility or institutional approval. The reconstruction's extra coverage includes unverified seasonal hypotheses; it is not automatically more reliable because it returns more clocks.

For the reconstruction's entire own comparable subset of 128,755 fields, conditional exact agreement is 114,770/128,755 (89.14%), with 128,703 within one minute and a maximum of three minutes. Those figures have a different denominator from the paired comparison and must not be substituted into its side-by-side percentages. Full printed-date values and all exclusion accounting are retained in the evidence JSON.

## What was verified and what changed

The study plan, programs, input identities and numerical import closure were pinned before generating the forecasts. All 129,210 current reconstruction raw and rounded fields reproduce its separately retained civil-date forecast exactly. The complete forecast was pinned before source scoring. Because the references were already exposed, that sequence improves auditability but does not create an unseen validation set.

A separate standard-library Python implementation checked the full source/date resolution and independently recomputed **2,608 group reports**, with zero mismatches. It retained all 455 ambiguous zero fields and found no mismatch in the two stated source-date interpretations. This reuses retained normalized source rows; it is not a fresh acquisition or independent original-calendar parser. The public evidence contains the model/source/forecast/verifier hashes and a compact verification record. Public CI checks the model pins and aggregate accounting; it cannot revalidate private original clocks.

The new [offline comparison API and command](../../core/diagnostics/) make a point/day discrepancy reproducible, preserving selected instants, rounding, rules, availability and actual dates. The numerical kernels, prayer-rule parameters, browser selection and timing defaults are unchanged. No unexplained offset is promoted into the app, and no notification readiness is inferred from these percentages.

## Decision for further work

Keep the two targets explicit. The existing daily-coordinate reconstruction remains the evidence-backed starting point for improving compatibility with these Diyanet calendar publications. The continuous local profile remains a separate implementation of documented criteria under declared point-astronomy conventions. Choosing between them requires the intended product contract; a higher calendar percentage alone does not validate religious onset or real-world physical accuracy.

A new rule change should identify a specific supported mechanism, preserve unavailable cases and source-date uncertainty, and report losses as well as gains. All 59 annuals in this comparison are already known development evidence. Rearranging them into new subsets does not make a prospective holdout. The earlier [Asr](GLOBAL-ASR-GEOMETRY.md) and [rounding/ephemeris](GLOBAL-NUMERICS.md) counterexperiments remain relevant negative evidence.
