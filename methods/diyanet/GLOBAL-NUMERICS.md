# Global ephemeris, rounding and Temkin diagnostic

**None of four predeclared numerical alternatives improves the known worldwide corpus without regional losses.** The unchanged public calculations remain selected. This study explains why Tokyo's predominantly late predictions and Nairobi's early predictions cannot justify adopting one of these global changes.

All **50 annual calendars, 18,250 city-days and 109,500 planned fields** were already exposed before this experiment. There are 455 unresolved source `00:00` fields and 109,045 baseline comparisons. These are development observations, not a new holdout. Coordinates remain the existing independently sourced city proxies; they are not certified institutional production points.

## Exactly four alternatives

The plan was recorded before complete candidate forecasts and scoring:

1. **Floor:** round the unchanged final UTC event downward to a minute.
2. **Ceiling:** round it upward to a minute.
3. **NOAA UTC00:** substitute the existing independently implemented NOAA/Meeus solar coordinates at the same daily UTC00 carrier, retaining nearest rounding.
4. **Local-mean midnight:** retain USNO, but evaluate daily solar coordinates at `JD − longitude/360`. East-positive longitude moves local-mean midnight earlier in UTC. The UTC event carrier is unchanged; no second clock shift is applied. This is an explicit compatibility hypothesis, not a documented Diyanet convention or an established bug fix.

No combinations, fitted thresholds, city exceptions, coordinate changes or new safety margins were tried. Existing angles, horizons, northern seasonal transformations and minute adjustments remain fixed. Floor, ceiling and NOAA extend previously unsuccessful diagnostics to the broader corpus; they are not presented as newly discovered algorithms.

The current [USNO approximation](https://aa.usno.navy.mil/faq/sun_approx) describes its Julian-date argument as Universal Time. Although [Terrestrial Time](https://aa.usno.navy.mil/faq/TT) is used for astronomical ephemerides generally, this does not establish that adding TT−UTC to this specific approximate recipe repairs it. No such correction was inserted. The NOAA alternative uses the project's existing independent expression of the [published NOAA equations](https://gml.noaa.gov/grad/solcalc/main.js); astronomical accuracy and institutional minute agreement are separate questions.

## Complete results and losses

The following uses the explicitly conditional evening-cycle source-date interpretation. A displayed Isha earlier than Maghrib is interpreted as belonging to the following day under the previously stated source convention. It is not independently confirmed source event ownership. Both date interpretations are fully retained in the evidence and count the same observations.

| Variant | Comparable | Exact | Within ±1 min | Maximum | Newly exact | Previously exact lost |
|---|---:|---:|---:|---:|---:|---:|
| Unchanged USNO UTC00 / nearest | 109,045 | 97,560 | 108,993 | 3 min | — | — |
| Floor | 109,045 | 55,593 | 108,870 | 4 min | 6,394 | 48,361 |
| Ceiling | 109,045 | 53,067 | 108,820 | 3 min | 4,706 | 49,199 |
| NOAA UTC00 / nearest | 109,045 | 97,560 | 108,997 | 3 min | 1,015 | 1,015 |
| USNO local-mean midnight / nearest | 109,043 | 88,377 | 107,942 | 14 min | 2,428 | 11,611 |

Local-mean midnight also introduces two unavailable predictions against nonzero originals. They remain planned fields and failures, not exclusions used to improve the score. NOAA's four additional within-one-minute values and unchanged total exactness conceal regional losses:

| Region in this corpus | Baseline exact | Floor | Ceiling | NOAA UTC00 | Local-mean midnight |
|---|---:|---:|---:|---:|---:|
| Europe, excluding Turkey | 53,291 | 30,793 | 30,158 | 53,366 | 48,625 |
| Turkey | 23,460 | 11,525 | 12,565 | 23,405 | 22,165 |
| North America | 4,094 | 2,466 | 1,910 | 4,107 | 2,596 |
| South Asia | 1,461 | 1,819 | 367 | 1,463 | 1,465 |
| Southern Africa | 4,086 | 2,486 | 1,894 | 4,088 | 4,074 |
| South America | 5,621 | 2,577 | 3,530 | 5,591 | 4,433 |
| Oceania | 2,099 | 1,008 | 1,182 | 2,090 | 1,590 |
| East Asia | 1,355 | 1,912 | 278 | 1,364 | 1,352 |
| East Africa | 2,093 | 1,007 | 1,183 | 2,086 | 2,077 |

These labels describe the sampled locations, not accuracy guarantees for entire regions. The aggregate preserves denominators, maxima, signed histograms and paired losses for every region, city-year and aggregate event. It also retains complete event breakdowns for Tokyo and Nairobi.

The primary printed-row-date comparison is not hidden: baseline exact **97,380**, floor **55,451**, ceiling **53,003**, NOAA **97,380**, local-mean midnight **88,298**. Corresponding maxima are **1,443 / 1,442 / 1,443 / 1,443 / 1,448 minutes**. These day-scale differences retain the unresolved Isha date interpretation. No modulo-24 comparison or prediction-selected source date repairs them.

## Tokyo and Nairobi

Every one of Tokyo's 835 nonzero residuals is model +1 minute; all 97 Nairobi residuals are −1 minute. Both signs occur across all six events:

| Event | Tokyo +1 values /365 | Nairobi −1 values /365 |
|---|---:|---:|
| Fajr | 162 | 17 |
| Sunrise | 137 | 14 |
| Dhuhr | 140 | 21 |
| Asr | 127 | 15 |
| Maghrib | 141 | 12 |
| Isha | 128 | 18 |

Floor raises Tokyo from 1,355 to 1,912 exact values but reduces Nairobi from 2,093 to 1,007. Ceiling resolves Nairobi's 97 old differences while breaking 1,007 exact values. NOAA produces a smaller tradeoff: Tokyo gains nine net exact values, Nairobi loses seven. Local-mean midnight worsens both and introduces two-minute differences in Tokyo. None supports a transferable replacement.

Uniform residual direction across events is compatible with several unresolved causes, including the city calculation point. It does not identify coordinates, rounding or ephemeris uniquely. No location or rounding parameter was fitted in this study.

## What Temkin ordering can and cannot explain

The [published Temkin explanation](https://vakithesaplama.diyanet.gov.tr/temkin.php) gives integer-minute adjustments: Fajr 0, sunrise −7, Dhuhr +5, Asr +4, Maghrib +7, Isha 0. For integer `k`, adding `k` before final floor, ceiling or nearest-minute rounding equals adding it afterward. This identity was checked on all **109,054 finite raw model fields**, including floating arithmetic at their actual values.

Consequently, changing only that final addition/rounding order cannot resolve these residuals. This statement does **not** permit moving adjustments through the nonlinear northern horizon bounds, night quotients or seasonal interpolation. Nor does it test a different adjustment magnitude or establish the institution's internal computation order.

## Verification and stopping decision

The plan, six import-only model copies, full forecasts, references and dependencies were pinned before scoring. An independent Python verifier checked all **219,000 date-interpretation rows**, **547,500 quantized variant fields**, **3,660 aggregate-variant groups**, loss gates and hashes. It independently recomputed **169,725 direct geometry cells**—all low-latitude/southern raw events and northern noon under the three coordinate variants. The largest discrepancy was below **0.000245 milliseconds**. The northern seasonal transformations reuse unchanged code; they are not a second Python implementation. References reuse earlier parsed instants, with the unchanged strict HTML reader replayed for Nairobi and Anchorage; this is not new institutional acquisition.

The declared gate forbids losses in exactness, within-one-minute counts, maximum or availability for any city-year, region or event. All four candidates fail. **No new calendar was opened for candidate validation, no public runtime changed, and no notification eligibility was granted.** Fairbanks has no acquired reference and contributes no accuracy denominator. The separate unused Hobart study was not inspected.

The [aggregate evidence](research/global-numerics-2026-09-25.json) contains both source-date interpretations and complete rejection accounting without raw calendar rows. Further progress requires a more specific independently supported mechanism or new identifying evidence; selecting whichever variant suits each observed city would not establish a worldwide rule.
