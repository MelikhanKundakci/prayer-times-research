# A published right-ascension series does not repair Diyanet noon

**The new series hypothesis loses more exact minutes than it gains, including after controlling for an unknown fixed city longitude.** The existing Diyanet solar calculation remains unchanged. This experiment uses only previously archived data and no new calendar/API request or institutional contact.

## A distinct, documented astronomical hypothesis

The NASA-hosted [Solarsoft EVE solar-almanac routine](https://soho.nascom.nasa.gov/solarsoft/sdo/eve/doc/eve_sun_almanac-code.html) uses a truncated right-ascension expansion. For ecliptic longitude `lambda` and obliquity `epsilon`, all in radians:

```text
t = tan(epsilon / 2)^2
alpha ≈ lambda − t sin(2 lambda) + (t^2 / 2) sin(4 lambda)
```

Earlier legacy-coefficient experiments retained the trigonometric `atan2` transformation. This is therefore a different mechanism, not a repetition of that coefficient-only test. The source documents a solar approximation, not Diyanet's operational algorithm. The [original implementation](research/ra-series/) keeps all four variants available as research code, outside the prayer calculator.

We predeclared current-constants/atan2, legacy-constants/atan2, the published legacy-constants/series, and a current-constants/series hybrid control. All use the same UTC00 carrier, city proxy, five-minute Dhuhr margin and nearest-minute rounding. There is no fitted solar coefficient, terrestrial-time shift or intermediate rounding.

## Fair comparison despite unknown calculation points

The [earlier inverse study](SHARED-NOON-INVERSE.md) supplies the fixed split: 12 city pairs with identical proxy inputs in 2026 and 2027, plus 24 additional 2027 cities. Thus there are 4,380 training noons, 4,380 temporal-test noons and 8,760 separate geographic noons. Every source was already exposed; this is a retrospective split, not a new blind holdout.

Each variant receives its **own** constant city nuisance term, fitted only on 2026. For source-minute start `M` and adjusted raw model noon `T`, the term is the clipped midrange of `M − T`, bounded to ±60 seconds. This minimizes the maximum absolute raw residual; it does not maximize rounded matches. All terms and code hashes were frozen before the evaluator read 2027. Using a term fitted for one ephemeris with a different ephemeris would confound a constant offset with its seasonal shape.

These terms are diagnostic, source-calibrated quantities. A constant shift and longitude are indistinguishable in this fixed-epoch noon equation. They are neither official coordinates nor deployable GPS corrections. Original-proxy results are reported separately.

## Complete result

| Formula | 2026 exact with its fitted city term /4,380 | 2027 exact with the same term /4,380 | 2027 gains / losses against current control | Additional 2027 cities at original proxies /8,760 |
|---|---:|---:|---:|---:|
| Current atan2 | 4,370 | 4,358 | — | 7,806 |
| Legacy atan2 | 4,369 | 4,357 | 0 / 1 | 7,806 |
| Published legacy series | 4,360 | 4,349 | 7 / 16 | 7,805 |
| Current-series hybrid | 4,357 | 4,351 | 8 / 15 | 7,804 |

All compared noons remain within one minute. At the unshifted proxies for the 12 temporal-test cities, the same variants score 4,116, 4,117, 4,114 and 4,113 exact respectively. Thus the rejection is not produced only by the fitted-city procedure. The aggregate preserves every city, signed histogram and paired regression, including the geographic controls' gains and losses.

A joint two-year quantization check asks whether **any** fixed nuisance term within the declared bound can reproduce every noon in each city. Both atan2 models admit three of the twelve cities; each series variant admits only one. This is a compatibility constraint, not a fitting or validation score. For correction `d`, the admissible interval is `[max(M−T)−30, min(M−T)+30)` seconds: the lower endpoint is closed and the upper one open. An empty interval cannot be repaired by selecting a different fixed longitude under these same assumptions.

The previous two-term annual harmonic with fitted city terms reached 4,366 temporal-test matches, but it had additional fitted shape parameters and failed its shared-only geographic check. It remains a separate diagnostic, not an official solar recipe or a reason to tune this new series after scoring.

## Scope and verification

The baseline replay checks all 17,520 adjusted raw noons and their original rounded instants. The [aggregate report](research/ra-series-transfer-2026-09-25.json) records the fixed coefficients, training-only city terms, full results, witnesses and input/code hashes. Original calendar rows are not redistributed. Public fixtures test the solar arithmetic; they are not a replay of the private source archive.

A [separate Python verifier](research/ra-series-verification-2026-09-25.json) independently reproduced 70,080 raw calculations, all 48 nuisance fits, 288 quantization intervals, 308 scoring groups and 105,120 minute decisions. The largest raw-instant difference was below 0.000245 milliseconds. This checks implementation and reporting, not the institution's unknown second-level times. The public [mathematical fixtures and generator](research/ra-series/) and [regression tests](../../tests/diyanet-solar-series.test.mjs) permit code checks without the source archive.

This result rejects the tested two-term right-ascension replacement as a Diyanet noon improvement. It says nothing definitive about the institution's private source code, every possible ephemeris, twilight policy or the accuracy of other prayers. No runtime default, point preset or notification eligibility changes.
