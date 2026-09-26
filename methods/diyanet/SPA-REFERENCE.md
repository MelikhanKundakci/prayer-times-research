# Independent SPA astronomy and complete-calendar comparison

**The new apparent-geocentric solar-coordinate implementation agrees with its reference checks, but substituting it into the existing Diyanet recipes makes institutional calendar agreement worse.** This experiment identifies a large sensitivity in the inherited northern seasonal rule. It supplies a reusable astronomical reference and intermediate tracing; it does not improve the selected calendar formula.

The [source-free implementation and CLI](research/spa-reference/README.md) remain outside the app's method registry. No runtime default, prior accuracy claim or notification eligibility changes.

## What changed

The baseline is the unchanged USNO daily UTC00 recipe. The only candidate, `spa-utc00`, substitutes apparent geocentric declination and equation of time from the documented [Reda–Andreas SPA procedure](https://docs.nlr.gov/docs/fy08osti/34302.pdf). The JavaScript implementation uses the complete SPA longitude/latitude/radius series and 63-term nutation tables, with aberration and apparent right ascension. It is checked against the report's worked example and a separately executed pvlib implementation. The pvlib-derived coefficient data retain their full BSD-3-Clause license.

The comparison assumes UT1=UTC and a fixed TT−UT1 of 69.184 seconds. The official worked example instead uses its own 67 seconds. Neither value is inferred from the prayer calendars. This is a daily geocentric-coordinate substitution, not a full SPA topocentric/refraction or continuous-event prayer solver.

The solar-carrier UTC00 sampling, independent location proxies, religious angles, fixed horizon, Asr rule, Temkin, five-hour limits, solstice envelopes, seasonal equations, carrier resolver and final minute rounding stay unchanged. The candidate recomputes downstream values and branch choices from its new astronomy. All of those assumptions are fixed before scoring; no city parameters are fitted.

The northern continuous-Asr calculation remains a separate USNO diagnostic that never selects a prayer time; it is omitted from the candidate traces. Some copied internal metadata still describes the historical USNO recipe. The enclosing `solarModel`/`models` identity specifies the active provider, and the trace exposes its actual declination and equation of time. The CLI prints the active identity explicitly.

## Corpus and complete result

The experiment uses **59 previously exposed city-years, 21,535 days and 129,210 unique planned fields**. It starts with the earlier 50-calendar corpus and adds Hobart, Apia, Nuku'alofa, Jakarta, Auckland, Iqaluit, Kathmandu, La Paz and Suva 2027. Anchorage and Cape Town were already present and are not counted twice. All six events are retained. There were no new timetable/API downloads or institute contacts; the new downloads were technical astronomy documentation and openly licensed reference code.

The archived readings are development data. Fixing the candidate before scoring does not make these known calendars a new holdout. Of the planned fields, **455 source midnight clocks remain ambiguous**, leaving **128,755 comparable fields** in either interpretation. Neither model has an unavailable output against a nonzero source value.

| Source-date interpretation | Model | Exact minutes | Within ±1 minute | Maximum difference |
|---|---|---:|---:|---:|
| Printed Gregorian row date | Baseline | 113,122 | 128,493 | 1,443 min |
| Printed Gregorian row date | SPA | 112,711 | 128,161 | 1,443 min |
| Conditional evening-cycle date | Baseline | 113,302 | 128,703 | 3 min |
| Conditional evening-cycle date | SPA | 112,854 | 128,333 | 14 min |

The conditional interpretation moves Isha to the following civil date only when its source clock precedes that row's Maghrib. This remains publisher-unconfirmed. The day-scale errors in the primary interpretation are retained rather than hidden by a modulo-day comparison. Both interpretations refer to the **same observations** and must not be added together.

Under the conditional interpretation, SPA makes **896** previously non-exact fields exact but loses **1,344** previous exact matches: a net loss of **448**. Printed-date scoring gives 894 gains and 1,305 losses. In all, 2,304 rounded model outputs change. The predeclared conservative replacement gate fails in **498 aggregate groups across both interpretations**; these overlapping groups are not 498 independent calendar errors. The [full report](research/spa-calendar-comparison-2026-09-26.json) includes every case, event, region, cohort, signed histogram and gate failure.

## Where small astronomical changes become large calendar changes

Across the sampled carriers, the largest SPA−USNO declination difference is about **16.04 arcseconds**, and the largest equation-of-time difference is about **2.64 seconds**. These are differences between two astronomical models, not observed institutional timestamp errors.

Reykjavík 2026 is the strongest amplification. The current rule obtains its frozen night quotient from the last day with a real Fajr crossing. On April 10, a declination change of about −6.67 arcseconds moves the daily Fajr hour-angle cosine from −1.0000325902 (no real crossing) to −0.9999614320 (a real crossing). This moves the first missing-Fajr day from April 10 to April 11, and therefore changes the ratio reference day from April 9 to April 10. The resulting quotient changes from approximately **0.189524882 to 0.167870530**.

At the unchanged September 2 autumn anchor, that quotient change propagates to approximately **+812.13 seconds for Fajr** and **−721.66 seconds for Isha**. These are candidate-minus-baseline raw model differences. The full-year source comparison reaches the reported 14-minute maximum. The same amplification changes Isha's rounded local event date on 44 Reykjavík rows; it is not a changed timezone rule. The full corpus has no changed solar carrier dates and no changed availability, but 8 Fajr and 5 Isha branch changes. The retained horizon policies also produce changed policy/estimate flags on two daily rows.

This traces a mechanism in our inherited reconstruction. It does not show that Diyanet uses that numerical threshold, nor establish that replacing the quotient rule would improve institutional agreement. Previously rejected fractional-boundary conventions do not become successful merely because this new sensitivity has been located. No follow-up parameter or alternate rule was selected after seeing these results. [All model-intermediate differences](research/spa-intermediate-differences-2026-09-26.json).

## Independent verification

- The official worked example and a 64-sample pvlib coordinate fixture pass, with explicit units and the example's time convention.
- A separate direct pvlib replay checks all **1,095 unique carrier Julian dates** used by the full forecast. Maximum discrepancies are below 7.3×10⁻¹³ degrees in declination and 2.5×10⁻¹³ hours in equation of time. The implementations share coefficient data; this is numerical implementation agreement, not independent physical observation.
- All **129,210** baseline UTC fields match their prior frozen forecasts. Independent checks reparse the nine added source sets, verify **258,420** interpretation rows, **257,528** finite quantization cells, **1,748** aggregate/variant groups and the complete gate decision.
- The original six calendar modules are copied with import substitutions only. Source-free tests check unchanged complete-year baseline parity on all three routes, adjusted/raw trace semantics, final rounding and context isolation.

The [verification bundle](research/spa-verification-2026-09-26.json) records plans, source/candidate hashes, scope and independent reviews. Full source-calendar replay requires the private archives; published hashes do not supply them. The source-free astronomy and model calculations are runnable from this repository.

## Decision

Keep the existing calendar recipes. Retain SPA as an independently checked astronomical comparison tool. The demonstrated sensitivity of the last-real-day quotient is a concrete target for future source-supported transition research, but this experiment supplies no new institutional formula or worldwide notification guarantee.
