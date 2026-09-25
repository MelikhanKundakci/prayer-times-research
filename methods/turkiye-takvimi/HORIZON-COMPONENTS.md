# Direct optical horizons do not resolve the remaining discrepancy

The [table-plus-caution interpretation](TABLE-COMPONENT.md) left sunrise mostly one minute late and Maghrib mostly two minutes early. A single follow-up replaced the common table correction on those two events with direct crossings of the source's combined optical horizon. **It worsened 480 of the 2,190 known Istanbul 2026 comparisons and improved only one. It is rejected; no public calculator or default changes.**

## A component replacement, with no extra solar-radius margin

The [calculation book](https://namazvakti.com/documents/tr.1.pdf), printed page 18, derives geometric solar-center sunrise/set from the half-day formula and then applies Temkin. Page 12 and page 6 of the [Temkin explanation](https://namazvakti.com/documents/Temkin.MuddetiNV.pdf) already include the solar semidiameter, refraction, terrain dip and parallax in a combined depression of **1°29′6.2″**. Adding another −16′ limb correction to the full table amount would count an included component again. That was not evaluated as a source-supported repair.

The one declared alternative was:

```text
sunrise = ascending solar-center crossing at −1°29′6.2″ − 120 seconds
Maghrib = descending solar-center crossing at −1°29′6.2″ + 120 seconds
```

The 679.16-second table amount is removed from these two events. The four other events retain it unchanged. The point, NOAA coordinates, nearest-minute rounding, original source dates and all other settings remain fixed. No other horizon, radius, weather, height or event-specific margin was tried.

This is a coherent mathematical interpretation of the combined components, **not a confirmed publisher rule**. The source describes a common fixed Temkin; separate event-time optical corrections differ from that instruction. The historical height, fixed refraction example and table/caution ambiguity also remain unresolved.

## Full known-year result

Complete forecasts and 23 dependencies were frozen before this candidate's evaluation. All 365 reference dates were already exposed; no new calendar was acquired.

| Known Istanbul 2026, all 2,190 values | Table+120 | Direct composite horizon |
| --- | ---: | ---: |
| Exact | 1,423 | 1,421 |
| Within ±1 minute | 1,830 | 1,578 |
| Maximum difference | 3 min | 4 min |
| Mean absolute difference | 0.516 min | 0.780 min |

There are 480 regressions, one improvement and two lost exact matches versus table+120. Fajr, Dhuhr, Asr and Isha are unchanged. Sunrise now has 0/365 exact and 115/365 within one minute; Maghrib has 0/365 exact and 3/365 within one minute. June has the sole improvement; the other eleven months contain the regressions. Every month and all baselines are retained in the [aggregate report](research/horizon-components-2026-09-25.json).

The evening expression exactly reproduces the previously rejected variable-Temkin Maghrib calculation. Its algebra is the same, so this is a required consistency check, not independent new evidence for that event.

The genuinely distinct morning calculation differs from reusing the evening optical interval by only **−1.653 to+1.635 seconds** across the full year. Just two sunrise minutes change relative to that older variable model: one improves and one worsens. Under this fixed component interpretation, the morning-versus-evening interval choice cannot account for the remaining minute-scale discrepancy.

## What was verified

Independent Python arithmetic checks all 730 optical roots and crossing directions, all 2,190 UTC comparisons, 19 event/month/year summary groups and 23 frozen hashes. Both older complete output objects replay exactly; all 1,460 non-horizon events retain the table candidate's values. Source clocks match the parent study's independently parsed original HTML and are never repaired.

Maximum independent root-epoch discrepancy is 0 ms in the recorded runtime, with an altitude residual below 7.6×10⁻¹⁰degrees. This verifies two implementations of the chosen NOAA approximation. It does not measure MICA accuracy, atmospheric conditions, observed terrain or religious validity.

No fresh official reference or notification validation was obtained. The prior bounded future-source lookup was not repeated, and no unadvertised year parameter was invented. The remaining problem needs an operational horizon/Temkin specification and independent source evidence; it cannot be resolved by treating an extra solar-radius margin as already established by these sources.
