# Why the two local models differ at Asr and Maghrib

**In this controlled accounting, changing when solar coordinates are sampled contributes much more to the difference than switching between USNO and SPA at the same sample time.** This explains differences between our two implementations. It does not recover Diyanet's production algorithm, measure observed prayer onset, or justify a new numerical default.

The study uses retained model forecasts for the same **59 city-years, 21,535 days and 43,070 Asr/Maghrib fields** as the [calendar comparison](LOCAL-CALENDAR-COMPARISON.md). It reads no original prayer calendars and performs no new calendar-accuracy scoring. No personal GPS location is included. The [aggregate evidence](research/asr-maghrib-attribution-2026-09-26.json) preserves all 262 groups, exclusions, endpoint checks and provenance.

## What is being compared

Both current models use Asr shadow factor one with a four-minute margin, and a Maghrib center-altitude threshold of −50 arcminutes with a seven-minute margin. The local model fixes the Asr shadow target from solar declination at the day's transit and solves a continuous descending crossing. The reconstruction uses the printed date's UTC00 solar coordinates in its daily geometry. Both are geocentric models without a terrain, observer-height or topocentric-parallax calculation. The [rule audit](LOCAL-RULE-AUDIT.md) separates supported religious criteria and margins from these implementation conventions.

For altitude `h`, latitude `φ`, declination `δ` and positive afternoon hour angle `H`, the static calculation is:

```text
cos(H) = (sin(h) − sin(φ) sin(δ)) / (cos(φ) cos(δ))
Asr h = atan(1 / (1 + tan(abs(φ − δ_target))))
Maghrib h = −50 / 60 degrees
```

The analysis holds each saved SPA event instant and transit instant fixed. It combines the two coordinate providers with UTC00/event-time sampling of declination and equation of time, plus UTC00/transit sampling of the Asr target. This yields **516,840 static algebra cells**. Those cells are conditional sensitivity calculations, not independently solved continuous prayer-time alternatives.

The forward path removes any selected daily-policy displacement, changes the coordinate provider, changes equation-of-time sampling, changes altitude-declination sampling, changes the Asr target sample, and restores the local selection. Endpoint arithmetic residuals are retained separately. A reverse-provider path changes sampling under USNO first and changes the provider last. Both paths are retained: the component sizes depend on the chosen order and are not uniquely identifiable physical causes.

## Results on common selected subsets

All rows below use the same **21,067 Asr fields** and the same **19,096 Maghrib fields**, respectively. Values are mean absolute displacements in seconds along the declared forward path.

| Component | Asr | Maghrib |
|---|---:|---:|
| Coordinate provider at fixed UTC00 sample | 0.640 s | 0.784 s |
| Equation-of-time sample moved to saved event instant | 7.163 s | 8.745 s |
| Altitude declination sample moved to saved event instant | 90.783 s | 69.068 s |
| Asr target sample moved to saved transit | 50.559 s | 0 s |
| **Actual net selected-model difference** | **42.126 s** | **70.379 s** |

**Do not add these absolute means.** Signed components can oppose each other, notably the Asr declination and target changes. The reverse-order provider displacement averages 0.639 s for Asr and 0.784 s for Maghrib on these same subsets; all interaction statistics are retained. Seasonal horizon-policy displacements are separate from the raw geometry and are not assumed to vanish merely because an event's status is `calculated`.

The common selected subset includes 147 Maghrib fields estimated by the reconstruction and calculated by the local profile. It is not an all-ordinary subset. Sixteen selected daily-policy displacements exceed 1 ms; they remain explicit in the accounting.

The measured quantities are model displacements, not errors against a publisher or observations. A daily approximation can agree more closely with a calendar while a continuous model follows its declared physical equation more closely. That difference cannot be resolved by adding the mean displacement as a correction.

## Coverage and verification limits

Of all 43,070 planned fields, **41,894** admit the complete physical decomposition. Exclusions are 1,041 missing saved physical roots, 134 missing required algebra cells, and one endpoint identity outside the predeclared 1 ms tolerance. The complete selected-output chain contains **40,163** fields; an additional 1,731 physical-chain cases have no selected endpoint in one of the models. Missing and policy-blocked results are not filled from the other model.

The single tolerance failure is Asr at Bodø on 8 December 2027, with an algebraic endpoint discrepancy of 1.211 ms rounded upward. It remains excluded; the tolerance was not relaxed. All 40,163 directly checked ordinary daily endpoints agree within 0.000245 ms, rounded upward. These endpoint identities test wiring of the same saved model instants, not independent astronomical or observational accuracy. The evidence records the separately performed review and any limitations of that review.

A separate Python arithmetic checker recalculated all 516,840 static cells from retained coordinate samples: 504,750 available results and 12,090 missing controls. Availability and reason classifications agree; the largest finite-cell timestamp difference is 0.000245 ms rounded upward. It also checks endpoint classifications, common selected coverage and both telescoping paths. This does not independently recalculate the solar-coordinate samples or verify observations. The ordinary daily endpoint check uses an explicit rule allowlist in addition to status; its count happens to equal the differently defined selected-chain count.

The plan and matrix were fixed before evaluation. A syntax-only repair to the report writer was recorded separately, together with explicit common-subset component summaries; the forecast inputs, algebra cells and tolerance remained unchanged. Original reports and the amended writer retain separate hashes.

## Practical result

The [browser prototype](../../examples/local-app/README.md) now exposes the existing offline comparison after selecting the Diyanet SPA profile. It displays model times, pre-rounding differences, actual dates and availability without changing the selected schedule. The numerical kernels, angles, margins and profile defaults are unchanged.

No new ordinary Asr/Maghrib rule was identified by the primary-source or code audit. The earlier [continuous Asr experiment](GLOBAL-ASR-GEOMETRY.md) and [global numerical alternatives](GLOBAL-NUMERICS.md) already rejected broad substitutions for calendar compatibility. Further numerical changes need a supported mechanism and explicit regression accounting; these conditional displacements alone do not establish one.
