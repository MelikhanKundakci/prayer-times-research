# Global Asr geometry diagnostic

**A source-motivated continuous Asr variant was rejected across 47 known annual calendars.** It reduces some polar-winter ordering problems, but substantially worsens agreement with institutional clocks. The public calculators remain unchanged.

## One declared mechanism

The official high-latitude criterion defines Asr through an additional object-length shadow, excluding the shadow at the Sun's highest position; if no Asr sign exists, Dhuhr also serves as Asr. The general Temkin explanation specifies a four-minute Asr addition. These statements motivate a numerical test, but do not identify Diyanet's ephemeris or production implementation. [Awqat English criteria](https://www.awqatsalah.com/sub/18/calculation-criteria), [Turkish criteria](https://www.awqatsalah.com/sub/34/tespit-kriterleri), [Diyanet Temkin explanation](https://vakithesaplama.diyanet.gov.tr/temkin.php).

The sole candidate fixes the factor-one shadow target at that day's converged meridian transit, then solves for a descending continuous solar-height crossing:

`cot(h_Asr) = cot(h_noon) + 1`

It uses the project's own USNO solar coordinates, adds the unchanged four minutes, and rounds the final UTC instant once to the nearest minute. The other five markers, coordinates, horizon assumptions and seasonal rules stay fixed. Meridian transit is the declared conventional noon; it need not be exactly the altitude maximum when declination changes. No atmospheric, terrain, fitted-minute or coordinate correction was introduced.

Where no positive noon geometry exists, the northern route retains its declared Dhuhr substitute. The low-latitude and southern routes receive no invented replacement. In this corpus all positive-noon cases have one valid descending root; no nonfinite or multiple-root failure was mistaken for an absent religious sign.

This differs from earlier tests of full continuous twilight, instantaneous-declination Asr targets and clamping Asr to Dhuhr. The candidate and complete forecasts were fixed before scoring. All references were already exposed; there is **no new holdout or worldwide accuracy guarantee**.

## Complete known corpus

The 47 annuals cover 17,155 city-days in 2025–2027, from 54.811°S to 69.727°N. There are **102,930 planned six-marker fields** and **102,476 comparable nonzero source clocks**. The remaining 454 `00:00` values stay semantically unresolved, not exact hits. No nonzero reference lacks a prediction in either model.

The following counts use the separately stated conditional evening-cycle interpretation. It is not a source-confirmed assignment of absolute event dates.

| Existing cohort | Annuals | Comparable fields | Baseline exact | Candidate exact | Baseline → candidate within ±1 minute |
|---|---:|---:|---:|---:|---:|
| Northern missing-window collection | 28 | 61,312 | 53,291 | 46,692 | 61,267 → 58,811 |
| Original Turkey collection | 8 | 17,520 | 17,051 | 16,031 | 17,520 → 17,520 |
| Mexico City / New Delhi | 2 | 4,380 | 3,443 | 3,358 | 4,380 → 4,380 |
| Later Turkish temporal years | 3 | 6,570 | 6,409 | 6,039 | 6,570 → 6,570 |
| Cape Town, Ushuaia, Sydney, Punta Arenas | 6 | 12,694 | 11,806 | 10,774 | 12,687 → 12,515 |
| **Total** | **47** | **102,476** | **92,000** | **82,894** | **102,424 → 99,796** |

Since only Asr changes, its result makes the failure clear:

| Asr alone | Baseline | Candidate |
|---|---:|---:|
| Exact / 17,155 | 15,553 | 6,447 |
| Within ±1 minute / 17,155 | 17,155 | 14,527 |
| Maximum | 1 min | 3 min |

There are 10,734 changed rounded Asr values: 515 previously unequal values become exact, **9,621 exact values regress**, 515 absolute errors improve and 9,962 worsen. A further 257 changes preserve absolute error. Thirty-one city/event groups fail the declared maximum/within-one-minute gate. The 85,775 other event objects are unchanged.

The primary comparison attaches clocks to the source's printed date using actual IANA rules. It remains fully visible: exact **91,889 → 82,783**, within one minute **102,287 → 99,659**, maximum **1,443 minutes** for both models. Those large existing differences reflect unresolved event-date interpretation; the conditional figures above must not conceal them. Date interpretations and repeated model variants do not add observations to the denominator.

## Ordering and southern limits

Raw Asr ordering reversals fall from 17 to 13 and rounded reversals from eight to three. This limited benefit does not justify the widespread losses or establish a production-ready algorithm. Existing quality flags continue to report problematic order without silently moving events.

No northern season rule was mirrored south. Diyanet's current activity page explicitly describes the 45th latitude and north and application from 2023; the detailed calculation criteria separately state a 44.5° threshold. Neither is a complete southern replacement specification. [Official high-latitude activity report](https://kurul.diyanet.gov.tr/tr/faaliyetler/2020-2025/ibadet-vakitleri-dini-gun-ve-gecelerin-tespiti/ileri-enlemlerde-namaz-vakitleri).

The six southern annuals contain 446 unresolved zero clocks. Existing daily-angle outputs, including after-midnight Isha, do not independently establish continuous physical sign availability or the publisher's event-date convention. Earlier failed southern 2028 requests remain unavailable evidence. This study made no new calendar requests and did not inspect a candidate holdout after failing its development gate.

## Verification and decision

An independent Python implementation checked all **16,815 positive-noon roots**, 340 northern policy substitutions, UTC rounding and local dates. Its largest root-time difference from JavaScript was **0.014 milliseconds** rounded upward. It also verified 205,860 comparison rows across both date interpretations, 682 aggregate groups and all frozen hashes. This reuses previously parsed reference instants; it is not another independent acquisition or original-calendar parser. A separate mathematical review confirmed the shadow equation and checked the scope of the no-sign fallback.

The [aggregate evidence](research/global-asr-geometry-2026-09-25.json) preserves every city/year's Asr results, cohort totals, losses and provenance hashes without redistributing calendar rows. The single candidate fails its predeclared gate; **no default change, notification approval or prospective candidate test follows**. Agreement with a daily institutional approximation and physical event modeling remain distinct research questions.
