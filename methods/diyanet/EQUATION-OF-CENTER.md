# Isolating the solar equation of center

**This unfitted astronomical substitution is rejected as a replacement formula.** Across 59 known annual calendars, it adds 29 exact matches under the conditional evening-cycle interpretation, but introduces four new errors exceeding one minute. No prayer calculator default or public core option changes.

This is an entirely offline experiment using already archived references: 21,535 days, 129,210 planned event fields, 128,755 source-comparable fields and 455 unresolved source zero cells. It is a replay of previously exposed data, not a fresh blind holdout. All routes use the existing `civil-date` option for a fair comparison with the same date-line behavior.

## One fixed component, no fitted solar coefficient

The [US Naval Observatory approximation](https://aa.usno.navy.mil/faq/sun_approx) uses a two-harmonic solar-longitude correction. The [NOAA source](https://gml.noaa.gov/grad/solcalc/main.js), functions `calcGeomMeanAnomalySun` and `calcSunEqOfCenter`, supplies a time-dependent three-harmonic correction. We replace that complete NOAA component, including its own mean anomaly, while retaining USNO's mean longitude, obliquity, `atan2` equatorial conversion and equation-of-time convention.

For Julian centuries `T = (JD − 2451545) / 36525`, with angles in degrees:

```text
M = 357.52911 + T (35999.05029 − 0.0001537 T)
C = (1.914602 − T (0.004817 + 0.000014 T)) sin(M)
  + (0.019993 − 0.000101 T) sin(2M)
  + 0.000289 sin(3M)
```

This is explicitly a **USNO/NOAA hybrid experiment**, not the complete NOAA algorithm and not a documented Diyanet procedure. It isolates a different mechanism from the previously rejected full-ephemeris and right-ascension substitutions. A resemblance between the secular term and a [previously fitted annual noon shape](SHARED-NOON-INVERSE.md) motivated the test; none of that study's fitted coefficients enters this provider.

The single candidate and replacement conditions were recorded before generating its calendar forecasts. There was no second anomaly variant, coefficient search, city correction, twilight-angle change, seasonal-rule adjustment or alternate rounding selected after scoring. The candidate forecast was hash-pinned before this comparison. All original observations were nevertheless already known.

## Full-calendar results, including regressions

| Source-date interpretation | Current exact | Candidate exact | Current within 1 minute | Candidate within 1 minute |
|---|---:|---:|---:|---:|
| Literal printed date | 114,590 | 114,621 | 128,493 | 128,489 |
| Conditional evening cycle | 114,770 | 114,799 | 128,703 | 128,699 |

Each row compares **128,755** resolved fields. The second row conditionally places after-midnight Isha in its evening-to-next-dawn cycle; this is not verified publisher timestamp ownership. Literal-date maximum discrepancy remains **1,443 minutes**; conditional-cycle maximum remains **3 minutes**. Neither table row is a worldwide reliability guarantee.

Under the conditional interpretation, the candidate gains **290** exact matches and loses **261**, while **116 of 354 city-year/event groups** have fewer exact matches. There are no gains in the within-one-minute measure and four losses. The predeclared requirement of aggregate improvement without city/event accuracy losses therefore fails.

These four regressions show how a small raw change can cross a displayed-minute boundary. Signed error is prediction minus reference:

| City/year | Date | Event | Error before → after | Raw change |
|---|---|---|---:|---:|
| Frankfurt 2027 | May 2 | Fajr | −1 → −2 min | −0.429 s |
| Frankfurt 2027 | July 2 | Fajr | −1 → −2 min | −0.341 s |
| Oulu 2026 | March 29 | Isha | +1 → +2 min | +0.120 s |
| Iqaluit 2027 | July 25 | Fajr | −1 → −2 min | −0.867 s |

The provider changes 555 rounded model fields. No availability, carrier-date, ephemeris-date or seasonal-anchor date changes occur. The largest raw change is **3.727 seconds** (rounded), for Isha in Ushuaia on November 14, 2026. Dhuhr's largest change is about **0.450 seconds**. This rejection is not explained by the abrupt seasonal-anchor jump observed in the earlier full SPA experiment.

## Secondary noon diagnostic: a transferable shape, conditional on city terms

The predeclared optional diagnostic reuses the earlier study's 12 fixed-coordinate city pairs and 2026/2027 split. For each formula separately, its city term is the midpoint of the minimum and maximum 2026 residual `sourceMinuteStart − rawNoon`, clipped to ±60 seconds. These terms remain fixed in 2027. The physical hybrid has **no fitted shared solar coefficient**; only the diagnostic city terms are profiled.

| Noon model | 2026 exact / 4,380 | 2027 exact / 4,380 |
|---|---:|---:|
| Current model at original proxies | 4,118 | 4,116 |
| Physical hybrid at original proxies | 4,121 | 4,119 |
| Current model with its 2026 city terms | 4,370 | 4,358 |
| Physical hybrid with its 2026 city terms | **4,380** | **4,371** |
| Earlier fitted harmonic with its 2026 city terms | 4,380 | 4,366 |

The physical hybrid with city terms gains **16** exact 2027 minutes and loses **3** against the city-only current-model control. All compared noons remain within one minute. The [noon aggregate](research/equation-center/noon-comparison.json) includes every city and the diagnostic terms; the [independent Python check](research/equation-center/noon-verification.json) confirms all 35,040 minute decisions for the first four rows using raw full-calendar forecasts instead of the agent's EOT-shift route.

This supports further investigation of the deterministic annual noon shape. It does not establish Diyanet's ephemeris: all data were already exposed, city terms are source-fitted nuisance quantities, and a constant noon shift is indistinguishable from longitude in this model. They must not be deployed as official coordinates or GPS corrections. The modest gain at original proxies and the failed six-event comparison remain visible; the secondary diagnostic does not reverse the replacement decision.

## Verification and reproducibility

The [research implementation and arithmetic verifier](research/equation-center/README.md) are separate from the app-facing core. A separately written Python expression checks 710 Julian dates; these are model-only checks, not 710 institutional observations. Two independently written calendar scorers check the minute comparisons. The [aggregate report](research/equation-center/comparison.json) retains the preregistered rule, forecast hashes, both date interpretations, every city/event aggregate and failed gates, without redistributing original publisher clocks.

A direct comparison with the archived NOAA component over 35,794 daily samples from 2001 through 2098 has maximum difference **2.22 × 10⁻¹³ degrees**. This verifies transcription of that component, not its use by Diyanet.

The public arithmetic checks can run without any prayer API or private archive. Reproducing the institutional comparison requires the same retained calendar observations and their unresolved date assumptions; the source-free checks do not substitute for that evidence.

The selected civil-date calculation consequently retains **114,770 exact and 128,703 within-one-minute matches**, conditional on the evening-cycle interpretation. Of its 52 larger discrepancies, 51 are Fajr/Isha. The archive does not yet identify a justified universal correction for them.
