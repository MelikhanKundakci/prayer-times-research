# Offline refinement study — 25 September 2026

**A fixed-point diagnostic improves Berlin/Stockholm's retrospective 2027 agreement from 88.17% to 97.19%; seven global formula alternatives failed their comparison gates.** The inferred points are not established institutional coordinates, and the published calculation defaults remain unchanged. All calendar references used for these numerical comparisons were already exposed; none of the results below is a new blind validation or a worldwide accuracy guarantee.

## One fixed calculation point per city

The prior coordinates were independent city proxies, not confirmed Diyanet production points. This experiment asks how much mismatch a different fixed point can explain without changing the formula. Only latitude and longitude vary, each within ±0.25° of the previous proxy. The own USNO UTC00 ephemeris, −50′ horizon, −7/+5/+7-minute sunrise/Dhuhr/Maghrib adjustments and nearest-minute rounding remain fixed.

The fit uses **636 observations per city**: the three listed markers on 212 dates in January–March and September–December **2026**. Every observation participates. Fajr, Asr and Isha are excluded from fitting. No daily correction, prayer-specific fitted offset or reference table is used in the resulting forward calculation. All training horizons remain outside seasonal clamping throughout the permitted coordinate boxes.

The selected point minimizes the worst violation of rounded-minute constraints, rather than maximizing the number of exact matches. The complete unchanged missing-window model then calculates all six markers for every day of **2027**. Those forecasts were saved and hashed before the separate 2027 scoring step. This separation does **not** make the already exposed 2027 calendars a fresh holdout.

| City / complete 2027 year | Previous point exact | Diagnostic point exact | Within ±1 minute, either point | Corrected / regressed |
|---|---:|---:|---:|---:|
| Berlin | 1,912 / 2,190 | 2,120 / 2,190 | 2,190 / 2,190 | 245 / 37 |
| Stockholm | 1,950 / 2,190 | 2,137 / 2,190 | 2,190 / 2,190 | 219 / 32 |
| **Combined** | **3,862 / 4,380** | **4,257 / 4,380** | **4,380 / 4,380** | **464 / 69** |

There are still **123 unequal minutes**. Every city/event aggregate improves, including the three prayers not fitted, but 69 individually exact values become unequal. Printed-date and conditional Isha-next-date metrics happen to coincide for these two calendars; this does not settle the wider northern date ambiguities. Per-event, city and month totals are retained in the aggregate JSON.

| City | Previous latitude, longitude | Selected diagnostic latitude, longitude | Minimum extra rounding-cell half-width |
|---|---|---|---:|
| Berlin | 52.520000, 13.405000 | 52.52540716934566, 13.374766785317282 | 0.768747–0.770236 s |
| Stockholm | 59.32531504, 18.06036520 | 59.331935876524255, 18.031948002943174 | 0.952709–0.955472 s |

The decimals preserve reproduction; they are **not measured location precision, official presets or GPS corrections**. Longitude is exactly confounded with a common clock shift in these training equations: the fitted shifts correspond to +7.256 and +6.820 seconds respectively. Latitude can also absorb errors in fixed horizon or ephemeris assumptions. Better agreement therefore does not identify the true physical point or a uniquely correct formula.

The positive lower bounds show that **no point inside either declared box reproduces every training minute under these assumptions**. The bounds concern extra widths of rounded-minute constraints, not measured errors against unknown publisher seconds. They come from a 50,001-point latitude grid, an analytic derivative bound and local refinement, independently reimplemented in Python. Ordinary floating-point arithmetic was used, not formal outward-rounded interval arithmetic. Each selected point fits 625/636 training values; 11 remain unequal in each city.

These findings narrow the remaining problem: point/common-clock mismatch explains much of these two cities' residuals, but a coordinate change alone is insufficient for exact reproduction. The library does not substitute either point automatically. The public [offline point-consistency diagnostic](diagnostics/README.md) lets contributors investigate their own lawfully obtained observations and reports its assumptions and unresolved constraints.

## Five northern seasonal alternatives

Every alternative keeps the existing angles, Temkin, nearest-minute rounding and location proxies. None uses fitted city/day offsets. The five hypotheses were defined in separate recorded plans before their respective evaluations:

1. Replace only the autumn missing-window boundary with the fractional date where the fixed-daily Fajr geometry becomes available again.
2. Use fractional physical-availability boundaries at both ends of the season.
3. Retain the missing-window endpoints but use the preceding evening's sunset in the last-real-Fajr night quotient.
4. Retain all endpoints and interpolate transition times relative to solar transit rather than absolute UTC clock time.
5. Retain all endpoints and interpolate transition times relative to sunrise for Fajr and sunset for Isha.

The last two change only the interpolation frame. The transit frame uses the actual unchanged solar transit, not the midpoint of horizons that may already have seasonal envelopes applied. These are operational hypotheses about an incompletely specified gradual transition, not newly discovered institutional rules.

The following table covers the same **28 already known complete city-years**, with **61,312 comparable fields out of 61,320 planned fields**. Eight original `00:00` fields remain unresolved. It uses the explicitly conditional assignment of nonzero Isha before Maghrib to the next civil date.

| Recipe | Exact | Within ±1 minute | Largest difference |
|---|---:|---:|---:|
| Published missing-window baseline | 53,291 | 61,267 | 2 min |
| Fractional autumn boundary | 53,258 | 61,246 | 2 min |
| Both fractional boundaries | 53,229 | 61,240 | 2 min |
| Previous-evening quotient | 51,005 | 61,159 | 3 min |
| Transit-relative transition | 53,017 | 61,083 | 3 min |
| Horizon-relative transition | 52,831 | 60,720 | 13 min |

All five worsen both aggregate measures. For example, the fractional autumn boundary improves some Bremen clocks while producing eleven new two-minute Rovaniemi Isha differences. The previous-night, transit-relative and horizon-relative variants worsen the within-one-minute count in 19, 15 and 17 city/event groups respectively. No candidate was advanced to new calendar acquisition.

The primary **printed-date** comparison is retained in the [aggregate evidence](research/offline-refinement-2026-09-25.json). Its baseline has 53,215 exact and 61,190 within-one-minute fields, with a maximum of 1,441 minutes caused by unresolved after-midnight event-date semantics. A good conditional clock comparison does not resolve those source dates. Repeated variants and the two date interpretations reuse the same observations; they must not be added as independent data.

## Two published solar coefficient alternatives

The unchanged own USNO implementation was compared with two fixed published sets of approximate-solar constants. The first is printed in [NASA TM 101630, Appendix D](https://ntrs.nasa.gov/api/citations/19900015852/downloads/19900015852.pdf) and the appendix of [Zhang et al. (2020)](https://ntrs.nasa.gov/api/citations/20200003207/downloads/20200003207.pdf). After that comparison, a separate plan tested the different constants in Zhang's main text. The conflicting printed values were visually checked. Both use the same true Julian-date argument at UTC00; no fitted coefficient or time-scale shift was added.

| Already exposed cohort | Current USNO exact | Legacy appendix exact | Zhang main-text exact | Compared |
|---|---:|---:|---:|---:|
| Eight Turkish city-years, 2027 | 17,051 | 17,057 | 17,069 | 17,520 |
| Mexico City and New Delhi, 2027 | 3,443 | 3,442 | 3,440 | 4,380 |

All values in these cohorts remain within one minute. Both alternatives improve the Turkish aggregate slightly but worsen individual cities and event groups, and reduce the two-city non-Turkish total. A separate longitude-interval consistency check on 22 northern Dhuhr years improves neither: feasible years are 15/22 for current USNO, 15/22 for the legacy set and 14/22 for the main-text set. These feasibility intervals are not observed production coordinates or measurements of original seconds.

## Arithmetic and local execution checks

An independently expressed Python calculation checked the current own USNO code at **146,100 instants** across 2000–2099. Another 2,352 fixed northern daily geometries checked 10,416 finite and 1,344 absent height crossings, including direction and domain conditions. The largest forward-height residual was approximately 7.05×10⁻¹⁰ degrees. Twelve public day calculations additionally exercised civil-date, fractional-offset, leap-year and date-line cases. These checks found no implementation defect; they establish arithmetic consistency, not continuous physical-event accuracy, institutional agreement or an extension of the published approximation's accuracy range.

The [public offline test](../../tests/diyanet-offline.test.mjs) verifies the actual exported Diyanet code with network access denied and reference fixtures, examples and external prayer-library files inaccessible. All five variants reproduce their stored rendered results under UTC and Honolulu host timezones. A calculation needs only its explicit inputs and bundled timezone rules. An API account is not part of this runtime contract.

## Source clarification

The public [Diyanet Berlin page](https://namazvakitleri.diyanet.gov.tr/en-US/11002/berlin-prayer-times) also displays astronomical sunrise and sunset separately from adjusted clocks. On the already known date 25 September 2026, the differences are the documented −7 and +7 minutes. These public fields have only minute precision and supply no confirmed production coordinates. This observation refines the earlier source note; it does not add another independent accuracy cohort.

Machine-readable totals, every city total, city/event regressions and internal evidence hashes are in [offline-refinement-2026-09-25.json](research/offline-refinement-2026-09-25.json). Historical `research/...` identifiers name private working evidence, not bundled files. Original calendars and reference rows are not redistributed. Public arithmetic tests and these aggregate summaries do not let a reader independently repeat the historical publisher comparisons without obtaining lawful reference data.
