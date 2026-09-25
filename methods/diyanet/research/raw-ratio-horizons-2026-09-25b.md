# Astronomical horizons in the night quotient: rejected candidate

**The existing calculator remains unchanged.** One source-motivated interpretation improves total exact matches but introduces five three-minute errors. It fails the declared replacement test and is not exported as a calculation option.

The [Turkish Awqat criteria](https://www.awqatsalah.com/sub/34/tespit-kriterleri) describe a quotient between nights on the last day with real Fajr and refer to sunset. The [English version](https://www.awqatsalah.com/sub/18/calculation-criteria) instead names Maghrib. [Diyanet's Temkin explanation](https://vakithesaplama.diyanet.gov.tr/temkin.php) gives sunrise −7 and Maghrib +7 minutes. These sources leave the order of the quotient and adjustments unspecified; they do not confirm the tested interpretation.

## Single declared change

For the unchanged last-real-Fajr anchor, or June 21 when there is no Fajr gap, derive the quotient from the original astronomical sunrise and sunset. Previously it used their adjusted calendar clocks:

```text
q = (Fajr + 1440 − sunset) / (3 × (1440 + sunrise − sunset))
```

Here clocks are unrounded UTC minutes relative to the existing calculation-date carrier. The candidate changes only the two horizon inputs in this quotient. All 28 tested anchors have real, unclamped horizons, so astronomical sunrise is adjusted sunrise +7 minutes and astronomical sunset is adjusted Maghrib −7 minutes. An estimated/clamped anchor rejects; no guessed raw horizon is substituted.

Daily estimated events still use the original adjusted/policy horizons. Coordinates, raw USNO geometry, missing-window endpoints, fractional transition interpolation, five-hour/solstice rules, 18/16 factor, and final nearest-minute rounding stay unchanged. All four other event objects remain identical. The earlier inferred Berlin/Stockholm effective points are not used. This is an operational hypothesis, not an institutional correction.

## Full retrospective result

The plan fixed this candidate before computation and froze full forecasts before scoring. All **28 complete source city-years were already known**. Each variant has **61,320 planned fields**, **61,312 comparable**, and **eight unresolved original `00:00` fields**. No new calendar was requested.

This table uses the separately declared conditional assignment of nonzero Isha before Maghrib to the following civil date:

| Measure | Existing model | Candidate |
|---|---:|---:|
| Exact minute matches | 53,291 | 53,488 |
| Within ±1 minute | 61,267 | 61,262 |
| Largest difference | 2 min | 3 min |
| Earlier 24 city-years, exact / 52,554 | 45,200 | 45,446 |
| Later four city-years, exact / 8,758 | 8,091 | 8,042 |

There are **1,050 improved and 863 worsened absolute errors**; 1,042 fields become exact and 845 lose exactness. Eight old errors over one minute disappear, but thirteen new ones appear. Narvik's over-one-minute count rises 29→42; five Fajr dates worsen from +2 to +3 minutes: 21–22 September and 2–4 October 2027. Frankfurt improves 10→5 errors over one minute. The conflicting outcomes prevent a general replacement or selecting only favorable cities.

The candidate reduces the quotient at every anchor. In the frozen-ratio branch that makes Fajr later and Isha earlier, worsening Narvik's existing opposite-sign errors. This explains the candidate's direction, not the cause of the publisher mismatch.

The three cities that were fresh in the previous study, excluding reused Vienna, decline from 6,145 to 6,092 exact / 6,568 comparable. They are now retrospective evidence. The primary **printed-date actual-IANA** comparison is also retained: 53,215→53,413 exact, 61,190→61,185 within one minute, maximum 1,441→1,440 minutes. Its large date-assignment errors remain unresolved and are not repaired by this calculation.

The predeclared rejection criteria are met: Narvik Fajr and Isha lose within-one-minute matches, and the conditional maximum increases. The higher aggregate exact count does not establish better reliability.

## Evidence limits

[Machine-readable aggregates](raw-ratio-horizons-2026-09-25b.json) preserve both date interpretations, all city/event totals, paired improvements/regressions, source URLs and private evidence hashes. A separate Python implementation verified all 245,280 comparison rows and 820 aggregate groups; the same person authored candidate and recount. This is cross-language verification, not an independent-person or independent-astronomy review.

Original publisher calendars and their clock rows are not redistributed. Private artifact identifiers are provenance labels, not bundled files. These summaries do not allow reproducing the historical comparisons without lawful reference data. No official production coordinates, exact rounding contract or institutional algorithm is established, and no API is required by the local calculator.
