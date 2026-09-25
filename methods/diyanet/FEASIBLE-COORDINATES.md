# Can multiple calendars identify Diyanet's city coordinates?

**These calendars do not establish production coordinates.** A predeclared, retrospective constraint analysis found a common Dhuhr longitude interval in only **3 of 9 cities** with both 2026 and 2027 calendars. Adding ordinary sunrise and Maghrib observations makes the tested Berlin and Stockholm coordinate boxes empty. No point was fitted, selected or added to the calculator.

This answers a narrower question than finding the best match: does *any* fixed coordinate satisfy every selected published minute under the unchanged model? An empty region rejects that combination of geometry, adjustments, rounding and coordinates. It does not show that the institution used an incorrect coordinate.

## Data and assumptions

All **28 previously exposed northern city-years** contribute their full 365 Dhuhr observations: **10,220 source minutes**, with no missing noon cells. Nine cities have both years, supplying **6,570** of those observations. Every source minute uses its independently resolved actual IANA timezone. No new calendars were acquired, and neither conditional Isha dates nor `00:00` interpretations enter this analysis. The Hobart source calendar and comparison were kept unread throughout this northern stage; the separate subsequent transfer is described below.

The declared model is the existing USNO equation of time sampled at UTC00, transit plus five minutes, and nearest-minute rounding. For the supplied city proxies and their ±0.25° longitude boxes, all dates retain the same UTC00 carrier and local civil date. The necessary longitude bounds all lie inside those boxes. Conclusions are conditional on that carrier contract; they do not search for alternative date policies.

For a reference UTC minute `M`, expressed as seconds after the carrier's UTC midnight, and model Dhuhr `t = B − 240λ`, where `λ` is east longitude in degrees:

```text
nearest-minute agreement:  M − 30 ≤ B − 240λ < M + 30
longitude constraint:     (B − M − 30)/240 < λ ≤ (B − M + 30)/240
all observations:         λ ∈ (max(lower bounds), min(upper bounds)]
```

The lower endpoint is open and the upper endpoint closed. Touching bounds do not produce a feasible singleton. There is no fitted clock offset or added tolerance; a 10⁻⁷-second numerical guard only distinguishes resolved results from floating-point boundary uncertainty.

## Two-year longitude intersections

Here, “feasible” refers **only to Dhuhr**, under those assumptions. Bounds below are rounded for display; the [aggregate evidence](research/feasible-coordinates-2026-09-25.json) preserves full values, endpoint dates and all 28 single-year results. Among individual city-years, 18 of 28 have a nonempty noon interval.

| City | 2026 noon interval | 2027 noon interval | Joint 2026–2027 result |
|---|---|---|---|
| Berlin | Feasible | Feasible | `(13.373937944, 13.374489719]°` |
| Tromsø | Feasible | Feasible | `(18.949537697, 18.950281472]°` |
| Bodø | Feasible | Feasible | `(14.382134305, 14.384088607]°` |
| Stockholm | Feasible | Empty | Empty; 0.075882 s constraint gap |
| Helsinki | Feasible | Empty | Empty; 0.293956 s gap |
| Kiruna | Feasible | Empty | Empty; 0.230198 s gap |
| Reykjavík | Empty | Empty | Empty; 0.578776 s gap |
| Trondheim | Feasible | Feasible | Empty; 0.023470 s gap |
| Oulu | Empty | Empty | Empty; 0.500026 s gap |

The gap expresses the separation between incompatible longitude constraints, multiplied by 240 seconds per degree. It is **not a measured timestamp error** or a prescription to add that many seconds.

Trondheim illustrates the transfer problem. Its 2026 interval is `(10.408016903, 10.409168406]°`; its 2027 interval is `(10.409266196, 10.409324418]°`. Each year admits exact noon agreement, but no longitude satisfies both. The active conflicting observations are 30 September 2026 and 25 February 2027. Even a tiny inconsistency matters to a claim of exact feasibility; it does not imply a large practical minute error.

The surviving intervals correspond to only 0.132426 s, 0.178506 s and 0.469033 s of transit shift for Berlin, Tromsø and Bodø respectively. That narrowness is conditional constraint precision, **not geographical measurement accuracy**. A uniform unmodelled one-second clock shift moves effective longitude by 1/240°—wider than any of these intervals. Dhuhr provides no latitude information.

## Testing full coordinate feasibility

For Berlin and Stockholm, the second stage combines all 730 noon cells with sunrise and Maghrib on a fixed, previously used set of months: January–March and September–December in both years. Each city contributes **1,578 constraints**: 730 noon and 848 horizon observations. The other months' horizon cells are outside this declared test, not discarded after scoring.

The model uses the unchanged daily declination, −50 arcminute horizon, sunrise minus seven minutes and Maghrib plus seven minutes. Every selected day has real horizons throughout the entire coordinate box, stays strictly clear of the five-hour day/night clamps, and is below the 60° solstice-envelope threshold. The latitude and longitude domains remain the existing independent proxies ±0.25°.

| City | Latitude domain | Longitude domain | Exact two-year region | Certified minimum constraint-gap bracket |
|---|---|---|---|---:|
| Berlin | `[52.27, 52.77]°` | `[13.155, 13.655]°` | Empty | 1.708786–1.725236 s |
| Stockholm | `[59.07531504, 59.57531504]°` | `[17.8103652, 18.3103652]°` | Empty | 2.425321–2.453096 s |

These brackets bound the minimum separation of the incompatible longitude envelopes over the whole latitude box. They are not fitted point confidence intervals, observational tolerances or notification timing errors. Each year alone is also inconsistent in these boxes. The earlier [point-consistency study](RESEARCH-ROUND-2.md) had already proved inconsistency in a smaller 2026 observation set; this result extends the constraints across years rather than discovering a new best-fit point.

For reproducibility, at each latitude `φ`, intersect every event's longitude interval with the longitude box, obtaining `L(φ)` and `U(φ)`. Use 10,001 uniformly spaced latitude nodes. If each raw horizon event has derivative magnitude at most `K` seconds per latitude degree, the envelope gap `240(L−U)` is at most `2K`-Lipschitz. Its global minimum is at least the smallest grid value minus `K × grid spacing`. Both lower bounds remain positive. The derivative bound includes the horizon cosine's possible interior extremum, not just its endpoint values. A numerical grid alone would not prove an empty region.

## Decision and verification

**Do not turn these intervals into bundled Diyanet city presets.** First establish the missing formula, epoch, rounding or publication conventions; then freeze a complete candidate and test untouched calendars. Arbitrary GPS points and publisher city clocks remain distinct targets, as discussed in [Location scope](LOCATION-SCOPE.md). A shared fitted offset or daily corrections would change this question and could conceal the contradictions.

A separate Python implementation recomputed all 10,220 noon constraints, checked 30,660 source date/clock conversions, and reproduced all six single-year/two-year latitude-cover certificates. The largest noon-bound discrepancy was below 3×10⁻¹¹ seconds. Another agent independently reviewed the interval endpoints, derivative bound, clamp checks and inference limits. Private source rows are not redistributed; code and evidence hashes are included in the aggregate JSON. The working scripts and original inputs remain private, so the public artifact supports inspection and reimplementation rather than replay of the archived calendars. The existing [offline diagnostic](diagnostics/README.md) accepts independently supplied observations.

This northern stage is retrospective evidence about a declared reconstruction, not a blind test, an institutional rule, or worldwide validation. No calculation, default, timestamp or notification eligibility changed.

## Separate southern and dateline transfer

After the northern analysis was committed, a separate plan fixed the same Dhuhr inequality before this analyst opened the [Hobart 2027](https://namazvakitleri.diyanet.gov.tr/tr-TR/11420/hobart-icin-namaz-vakti) and [Apia 2027](https://namazvakitleri.diyanet.gov.tr/tr-TR/16182/apia-namaz-vakitleri) source calendars. Another researcher had already acquired them using forecasts frozen before source access. This is **analyst-blind transfer of the diagnostic on existing holdouts**, not a claim that this feasibility plan preceded their acquisition. Hobart's forecast freeze was 15:13:31 UTC and Apia's 15:19:31 UTC on 25 September 2026; the separate transfer plan was fixed at 15:26:37 UTC. No source request or mathematical variant was added here.

Both independent location proxies and their ±0.25° longitude boxes were retained. All **730 Dhuhr source cells** were resolved in actual IANA timezones, without missing or zero markers. Replaying the hash-pinned southern model reproduced all **4,380 frozen six-event output fields** exactly before constructing the noon constraints. The parent forecast files contain rounded fields; raw transit and calculation-carrier information were recreated from that unchanged code, not recovered from source residuals.

| Case and timezone | Original independent proxy | Verified noon carrier | Exact noon longitude region | Constraint gap |
|---|---|---|---|---:|
| Hobart 2027, `Australia/Hobart` | `−42.89°, 147.33°` | Row date `D`, all 365 days | Empty | 0.069772 s |
| Apia 2027, `Pacific/Apia` | `−13.8300994551°, −171.7678648027°` | UTC date `D−1`, all 365 days | Empty | 41.129925 s |

Hobart's active bounds require longitude `>147.284619272°` on 28 February and `≤147.284328556°` on 31 October. Apia requires `>−171.687095438°` on 18 September and `≤−171.858470124°` on 6 January. These conflicts occur inside the declared longitude boxes. Longitude cannot resolve them under the unchanged solar sampling and rounding rules, regardless of latitude. In Apia, the previous UTC-day carrier is verified across the whole box and preserves the actual civil date; replacing it after seeing the source would be a different candidate requiring a separate study.

The original proxies' noon residuals remain visible: Hobart has 301 exact and 64 one-minute-early cells; Apia has 281 exact, 33 one-minute-early and 51 one-minute-late cells. Every noon residual is within one minute. The larger Apia constraint gap is still not a 41-second observed source timestamp error: the originals supply whole minutes, and the gap measures failure of a common longitude to satisfy those rounding cells.

The northern two-dimensional horizon certificate was **not extended to southern latitudes**. Noon inconsistency is already a necessary-condition exclusion of full-coordinate exactness within the verified carrier domain; no southern latitude was fitted or certified. Independent Python source-clock resolution, UTC-carrier enumeration and interval calculation reproduced all 730 constraints, with maximum numerical disagreement below 3×10⁻¹¹ seconds. An independent agent also reviewed the carrier, half-open bounds and necessary-condition inference. The [separate aggregate evidence](research/feasible-coordinates-transfer-2026-09-25.json) preserves full bounds, input hashes, date witnesses and scope. Original forecasts, northern results and all calculator defaults remain unchanged.
