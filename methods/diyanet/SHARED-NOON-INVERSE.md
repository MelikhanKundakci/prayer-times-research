# Offline inverse identification of a shared noon correction

**The existing archive supports a much closer conditional noon fit, but does not identify a transferable Diyanet formula.** With two shared annual coefficients and one fixed diagnostic intercept per city, the fitted 2026 model matches all **4,380** Dhuhr minutes. Applying exactly those parameters to the same cities in 2027 matches **4,366/4,380**. The shared correction alone slightly worsens accuracy at the original independent proxy points, so it is not adopted by the runtime.

This experiment uses **no new source request, prayer API, external data download or institutional contact**. It works from the previously archived calendars, independently resolved source UTC instants and frozen local forecasts. All these calendars were already exposed in earlier research. The 2026 fitting/2027 scoring split is a retrospective temporal test, not a fresh blind holdout.

## Fixed experiment

Before fitting, the plan selected every city in the archived 50-annual catalog with both 2026 and 2027 and identical proxy coordinates/timezone. Input checks found that Istanbul's two archived points differ, so the declared rule leaves **12 cities**: Adana, Berlin, Bodø, Cape Town, Helsinki, Kiruna, Oulu, Reykjavík, Stockholm, Tromsø, Trondheim and Ushuaia. Each year contains 365 resolved, nonzero noon cells per city. No comparison selected the exclusions. Istanbul's 2027 point remains in the separate shared-only geographic check.

For adjusted raw UTC noon `T₀` from the unchanged USNO UTC00 model, the diagnostic candidate is

```text
T = T₀ + δcity + a sin(g) + b cos(g)          [seconds]
g = 357.529 + 0.98560028 × (JDcarrier − 2451545)  [degrees]
a = −0.39880300108380506 seconds
b = −0.1244568093546361 seconds
```

`T₀` already includes Dhuhr's five-minute adjustment. The common harmonic has amplitude **0.417772 seconds** (rounded). It is a correction to the modeled clock, not an observed astronomical timing error. There is no shared constant coefficient: a constant clock correction and longitude are indistinguishable in this noon equation. `δcity` is a diagnostic nuisance parameter for that ambiguity, bounded to ±60 seconds, equivalent to the earlier ±0.25° longitude search box. It is not an identified Diyanet coordinate or a deployable city preset. The two harmonic coefficients were bounded to ±5 seconds.

Only the 4,380 observations from **2026** enter the fitter. A linear program minimizes the largest absolute distance between corrected raw noon and the published minute's start. Its optimum is **29.91653963 seconds**, placing all training values strictly inside the 60-second nearest-rounding cells. It is one frozen optimum; nuisance intercepts need not be unique. The complete candidate was written and hash-pinned before the evaluator loaded the scoring files. No 2027-driven coefficient adjustment followed.

## Complete comparisons and losses

The city-only control profiles each city's fixed intercept from its 2026 residual-range midpoint, with the same ±60-second bound. The shared-plus-city candidate fits both the common shape and the intercepts in 2026. The shared-only check applies only `a sin(g)+b cos(g)` at each original proxy and therefore needs no source-derived city input at calculation time.

| Model | 2026 fitting: exact / 4,380 | 2027 same cities: exact / 4,380 |
|---|---:|---:|
| Original proxy, unchanged model | 4,118 | 4,116 |
| Fixed city-only diagnostic | 4,370 | 4,358 |
| Shared shape plus fixed city diagnostic | **4,380** | **4,366** |
| Shared shape alone at original proxy | 4,118 | 4,115 |

All compared noon values stay within one minute. In 2027 the shared-plus-city candidate gains **18** exact minutes and loses **10** relative to city-only. The per-city comparison exposes the tradeoffs:

| 2027 city | City-only | Shared plus city | Paired gains / losses |
|---|---:|---:|---:|
| Adana | 365 | 365 | 0 / 0 |
| Berlin | 365 | 365 | 0 / 0 |
| Bodø | 363 | 365 | 2 / 0 |
| Cape Town | 363 | 364 | 1 / 0 |
| Helsinki | 363 | 364 | 2 / 1 |
| Kiruna | 363 | 365 | 2 / 0 |
| Oulu | 363 | 364 | 2 / 1 |
| Reykjavík | 358 | 360 | 4 / 2 |
| Stockholm | 364 | 365 | 1 / 0 |
| Tromsø | 365 | 364 | 0 / 1 |
| Trondheim | 364 | 360 | 1 / 5 |
| Ushuaia | 362 | 365 | 3 / 0 |

The separate **24 additional 2027 city proxies** contribute 8,760 noons. Shared-only correction changes exact agreement from **7,806 to 7,799**, with **14 gains and 21 losses**; all remain within one minute. The [aggregate](research/shared-noon-inverse-2026-09-25.json) includes every city's counts, frozen coefficients and diagnostic intercepts, paired regressions, input/plan/candidate hashes and verification. Those intercepts are evidence about a fitted hypothesis, not public location presets.

## Verification and meaning

The extractor reproduced every archived adjusted raw Dhuhr instant from the current solar formula before fitting. A separate Python expression of that formula checked all 17,520 selected city-days with maximum disagreement **0.000244141 milliseconds**, then independently reproduced all **52,560 variant decisions** and every cohort/city score. A nonnegative weighted combination of active constraints cancels all fitted parameters and matches the primal objective to about 8×10⁻¹⁴ seconds in ordinary floating arithmetic; this independently checks the minimax optimum, not formal interval-certified arithmetic or institutional accuracy.

The experiment shows that much of the displayed-minute difference can be represented by a static city shift, and a small shared annual shape can eliminate the remaining 2026 fitting contradictions. It does **not** establish that Diyanet uses that shape. Perfect training agreement did not produce perfect 2027 reproduction, and the shape alone regressed the geographic proxy comparison. All source data were previously exposed, there are only two years in the temporal split, and only one of six event columns is modeled.

The next offline inference must improve transfer beyond these controls and distinguish the city's intercept from the shared solar behavior. No institute response or live API is required to continue that research. Existing calculation defaults, other prayer events and notification eligibility remain unchanged.
