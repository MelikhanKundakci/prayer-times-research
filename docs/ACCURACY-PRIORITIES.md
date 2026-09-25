# Where agreement still needs the most work

This is a research-priority assessment of the repository's current implementations, not a ranking of religious traditions or of the institutions themselves. We compare calculated values with published reference clocks; an institution's complete original implementation is not necessarily available. The observations below have different cities, dates, markers and exposure histories, so they must not be combined into a single accuracy score.

**The clearest widespread numerical mismatch is Türkiye Takvimi. The largest remaining non-hour-scale discrepancies in the broader known sample are in the ARC comparison.** Date, timezone and availability problems remain a separate priority even where clock agreement is otherwise strong.

## Larger numerical discrepancies

| Exported reconstruction and particular sample | Exact | More than one minute apart | Maximum | Interpretation |
|---|---:|---:|---:|---|
| [Türkiye Takvimi](../methods/turkiye-takvimi/), Istanbul 2026, eleven months acquired after the twelve variants were frozen | 0 / 2,010 | 1,075 / 2,010 (53.48%) | 4 min | The retained default is a failed reconstruction, not a production option. |
| [ARC own USNO](../methods/shia-angles/), seven already known annual calendars | 7,695 / 14,986 comparable; 356 excluded | 865 / 14,986 (5.77%) | 62 min primary; 16 min in a separately reported diagnostic excluding known source-DST cells | Does not describe all Shia profiles. Twilight-boundary and date conventions require investigation. |
| [Generic FCNA 15°/15°](../methods/fcna/), Roseville July–October 2025, Fajr/Isha only | 106 / 246 | 68 / 246 (27.64%) | 2 min | Most larger differences are Isha. A separately exported publisher-specific experiment already improves the situation; see below. |
| [UAE/Awqaf V2](../methods/uae-awqaf/), three regions, April 2025 and October 2026 | 778 / 1,098 | 44 / 1,098 (4.01%) | 2 min | All 44 larger differences are sunrise: 33 in Al Ain and 11 in Zayed. |
| [JAKIM all-points extrema](../methods/jakim/), three 2026 zones | 5,283 / 6,570 | 75 / 6,570 (1.14%) | 2 min | All 75 larger differences belong to KDH03 sunrise, suggesting a bounded zone/geometry problem. |

These rows deliberately retain weak and older alternatives when they explain an unresolved problem. They are not interchangeable with the best result of another variant on another sample.

### Türkiye Takvimi: reconstruct the horizon/Temkin sequence

The default assumes a geometric solar-center horizon of 0° and a fixed Istanbul Temkin of ten minutes, subtracting before noon and adding afterward. Its errors have a structured sign: Fajr and sunrise are late; Dhuhr, Asr, Maghrib and Isha are early. That points toward the horizon/adjustment recipe rather than random numerical noise, but it does not identify a unique correction.

All twelve predeclared solar-engine/epoch/rounding alternatives failed the one-minute objective. A later source-motivated variable-Temkin hypothesis also failed. Under that hypothesis's geometry and rounding, 553 of 1,460 same-sign event-pair constraints cannot share a single daily Temkin. Merely choosing one attractive extra minute is not an established solution.

A new [common-horizon diagnostic](../methods/turkiye-takvimi/COMMON-HORIZON.md) allows both arbitrary daily Temkin and arbitrary daily shared sunrise/Maghrib altitude, yet excludes at least **62/365** days under the current nearest-rounding geometry. Floor and ceil families fail too. This is a conditional mathematical exclusion, not proof of publisher error or a new fitted method. The source also includes the two-minute precaution and solar semidiameter within its illustrative mean Temkin; stacking them again is not a supported correction.

The useful next work is to resolve the publisher's order of operations: MICA solar coordinates, true/apparent horizon, observer height, city-wide safety margin and final rounding. Intermediate values from the published worked derivations are more informative here than searching for a daily correction table. See the method's [primary technical references](../methods/turkiye-takvimi/README.md#sources).

A newly inspected [publisher Temkin table](https://www.turktakvim.com/index.php?link=html/temkin_cedveli.html) defines its height input as the city's highest-minus-lowest terrain height. That is not simply an observer's altitude above sea level. This is a concrete input-definition lead, but another shared Temkin value alone cannot resolve the already demonstrated same-sign event-pair contradictions.

The [complete event-specific rounding sensitivity study](../methods/turkiye-takvimi/ROUNDING-POLICIES.md) also excludes all 729 fixed nearest/floor/ceil policies under the retained Türkiye geometry, even allowing arbitrary daily shared Temkin and horizon. The weakest policies fail three days; small February gaps are ephemeris-sensitive. No new clock model is selected.

### ARC: separate physical calculation from publisher compatibility

The own profiles calculate actual continuous height crossings with explicit unavailable events and next-day semantics. A publisher calendar can use different approximations, date handling or replacement conventions. Matching those clocks does not automatically make a physical solver more correct.

Keep the primary 62-minute maximum visible while separately examining the source-DST discrepancies. The 16-minute residual after that diagnostic exclusion is still material and must not be dismissed as ordinary minute rounding. Fajr near the boundary where twilight disappears, the Julian-date argument, and the midnight interval's day assignment are the highest-value checks. Any exact reproduction of a publisher-specific anomaly would need a separately named compatibility experiment, not a silent change to Tehran, Leva or all Shia profiles.

A new **retrospective replay of an existing unchanged compatibility candidate** on the already exposed Kiritimati 2031 calendar gives **1,836/2,190 exact and all within one minute**, versus the own USNO profile's **1,445 exact and 2,169 within one minute**. It corrects 446 previously unequal values but makes 55 previously exact values unequal. This is evidence that publisher compatibility can improve, not a newly discovered or validated religious calculation rule. The candidate intentionally models conjectured publisher date/rounding conventions; it is now available through a separate explicit compatibility entry; the physical own-angle runtime is unchanged. The [aggregate replay evidence](../methods/shia-angles/research/compatibility-replay-2026-09-25.json) preserves the scope and provenance. That earlier replay acquired no new original calendar. The subsequent [compatibility export and three fresh annuals](../methods/shia-angles/ARC-COMPATIBILITY.md) now provide a runnable local candidate: **5,458/6,576 exact**, **6,564 within one minute**, and a primary maximum of **60 minutes**. The twelve larger differences are New York’s DST transition dates; they are retained. There are 2,190 corrected and 273 regressed exact values relative to the own-USNO model. This is source compatibility, not a replacement for physical or religious semantics.

### UAE/Awqaf: own atmosphere implementation now available

In V2's original holdout, sunrise matches only **50/183** minutes and contains all 44 two-minute differences; every other marker is within one minute. That localizes the larger discrepancy rather than suggesting that all six prayer-time formulas need replacement.

An already studied V3 experiment supplies evidence for a mathematical improvement, but uses a GPL/native PAL dependency excluded from this MIT runtime. On V3's six later monthly PDFs, a paired comparison gives **V2: 791 exact / 1,049 within one minute / maximum two**, versus **V3: 825 exact / all 1,098 within one minute / maximum one**. These are the same 1,098 observations; comparing V3 directly with V2's earlier 778-exact cohort would mix different months. Abu Dhabi loses four exact values in the paired result despite the overall improvement.

The new opt-in [own-ray implementation](../methods/uae-awqaf/OWN-RAY.md) now supplies that independent JavaScript calculation. Across four already exposed, nonoverlapping cohorts it improves **6,840 → 7,239 exact / 9,684**, with **all 398 two-minute differences removed**. It corrects 883 values and regresses 484; **2,445 one-minute differences remain**. It reproduces the earlier PAL candidate’s rounded outputs while using neither its code nor runtime. A separate radial-coordinate implementation checks the integral. This is progress on the known data, not fresh institutional validation; the default remains V2.

The next UAE evidence needs are confirmed production point/horizon settings and new comparisons after freezing this candidate. A varying solar disk/parallax follow-up gained twelve exact values overall but worsened two city/sunrise groups and was rejected. Changing atmospheric coefficients to fit calendar minutes would not establish the publisher’s actual method.

## Many unequal minutes can still mean small timing differences

Several comparatively low exact-match percentages are predominantly rounding-scale differences:

| Particular comparison | Exact | Within one minute | Maximum |
|---|---:|---:|---:|
| [Bayynat](../methods/bayynat/), three point-months | 238 / 546 (43.59%) | 545 / 546 | 2 min |
| [Fazilet V2](../methods/fazilet/), six primary markers in three new cities | 385 / 576 (66.84%) | 576 / 576 | 1 min |
| [Oman V2](../methods/oman-mara/), three later monthly responses | 374 / 552 (67.75%) | 552 / 552 | 1 min |
| [MUIS own USNO](../methods/muis-singapore/), known 2024–2026 calendars | 4,608 / 6,576 (70.07%) | 6,556 / 6,576 | 2 min |

Bayynat's original three-month differences are all model-late. A subsequent [uniform nearest-rounding counterexperiment](../methods/bayynat/NEAREST-MINUTE.md) improves known exact agreement to 482/546, but its three fresh point-months give 454/552 exact versus ceiling's 299 while worsening 62 cells and introducing three two-minute Tokyo Fajr differences. It is rejected as a general replacement; the ceiling default remains unchanged. A subsequent [event-time solar candidate](../methods/bayynat/CONTINUOUS.md) improves six known point-months to 1,090/1,098 exact, all within one minute, with five regressions against ceiling. A separate adaptive within-range Buenos Aires alias probe gives 177/180 exact versus 110 with no regressions. The original failed/out-of-range acquisition studies and Berlin/Sydney timezone conflicts remain separate and visible. MUIS's 20 two-minute cases are concentrated in Maghrib in March 2025 and Asr in September 2025; that concentration is not proof of a Ramadan rule. These patterns are useful diagnostic constraints, not permission for arbitrary seasonal offsets.

The [Roseville-specific experiment](../methods/fcna/) already raises its **paired** two-month Fajr/Isha result from 70/122 to 90/122 exact, with all 122 within one minute in both variants. This is a local publisher experiment, not a revised general FCNA rule. Its development Fajr score and a separately year-ambiguous cohort also regress. The generic row above must not conceal this progress or turn it into a universal guarantee.

Likewise, JAKIM's separately exported KDH03 map-plus-R19 experiment has 1,577/2,190 exact values and all within one minute on its later **2025** comparison. That does not establish R19 as the official point or permit combining its score with the older three-zone **2026** row.

## Date and availability errors are a separate release concern

- **Diyanet northern Isha:** the primary four-city comparison reaches 1,441 minutes because source row date and after-midnight event date are unresolved in 39 comparisons. Under the separately stated next-day-Isha interpretation, all 8,758 comparable values are within one minute. Two original `00:00` fields remain ambiguous. The conditional interpretation does not establish the provider's intended date.
- **Moonsighting Committee:** the known regression sample retains 28 one-hour disagreements in Sydney/Wellington, while other subsequently acquired city-years match exactly. A good aggregate must not conceal those date-specific failures. Kiritimati additionally has a separately documented source-row hypothesis.
- **ARC:** missing twilight, an unavailable Fajr endpoint for midnight, and source/model availability disagreements need explicit results rather than manufactured clock values.
- **Bayynat:** known Berlin and Beirut source calendars have separate fixed-offset/DST ambiguities. The three-point-month result above uses other places with constant offsets; it does not resolve those older source conventions.

An app needs an actual event date and a defined missing-event policy, not only a matching `HH:mm` string. A universal notification release is not justified by these research comparisons.

## Recommended work order

1. **The own UAE refraction kernel is implemented and numerically verified.** Keep its retrospective results distinct from future fresh comparisons. The largest unresolved gaps still call for ARC twilight/date-boundary investigation and Türkiye Takvimi horizon/Temkin reconstruction.
2. **Before notifications:** resolve the applicable method's event dates, timezone assumptions and unavailable-event behavior. This is necessary even for methods with high exact-minute agreement.
3. **Then improve minute-level agreement:** study fixed institution calculation points, documented rounding and narrower regional conventions for Diyanet, JAKIM, Bayynat, Fazilet, Oman and MUIS.

For example, the [Diyanet fixed-point diagnostic](../methods/diyanet/RESEARCH-ROUND-2.md) explains much of the Berlin/Stockholm mismatch without changing the formula, but does not discover official coordinates. All future candidates should retain every observation and regression, preserve the old recipe, and distinguish already exposed development data from genuinely new comparisons.

The historical counts are scoped research measurements recorded in the linked method documents and their `validation.json` files, with the paired UAE and Roseville comparisons explicitly identified in those documents. The additional ARC compatibility replay is labeled separately and linked to its aggregate evidence. This assessment changes no numerical default, retrospectively upgrades no validation status, and requires no API in the calculation runtime.
