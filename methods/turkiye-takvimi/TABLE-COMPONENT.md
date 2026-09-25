# A conditional table-plus-caution interpretation

One source-derived interpretation substantially improves the **already known Istanbul 2026** comparison: **1,423/2,190 exact**, versus zero for the fixed ten-minute baseline. It brings 1,830 values within one minute, with a three-minute maximum. No baseline value worsens, but eleven values worsen against the earlier daily variable-Temkin experiment. **The sunrise/Maghrib problem remains; this is not a confirmed institutional recipe, fresh validation or a change to the public default.**

## Why this is a distinct source question

The publisher's [calculation book](https://namazvakti.com/documents/tr.1.pdf), printed page 12, first links its Temkin table and then says calculated amounts receive two minutes of caution. The operative passage begins “Hesâb ile bulunan Temkin mikdârlarına iki dakîka ihtiyât ilâve ederek”. The following clause explicitly describes Istanbul's inclusive mean as ten minutes. The same sequence appears on page 6 of the [Temkin explanation](https://namazvakti.com/documents/Temkin.MuddetiNV.pdf).

The [linked numerical table](https://www.turktakvim.com/index.php?link=html/temkin_cedveli.html) gives 9 min 11 s at latitude 41°/height 250 m and 9 min 23 s at 41°/275 m. It defines height as the locality's highest point above its lowest point. The book's historical Çamlıca example supplies 267 m; that is **not a verified present-day production height**. The publisher's [technical explanation](https://namazvakti.com/documents/Son_Teknoloji.pdf), page 4, permits interpolation between table entries.

The new conditional reading is that the table supplies the calculated component before the stated caution:

```text
table component = 551 + (267 − 250)/(275 − 250) × (563 − 551)
                = 559.16 seconds
candidate total = 559.16 + 120 = 679.16 seconds
```

This differs from adding two minutes to the **already-inclusive** ten-minute mean, which the earlier [source audit](COMMON-HORIZON.md#source-interpretation) correctly rejected. The previous argument that using 559.16 seconds alone worsens the baseline also remains valid. The table does not explicitly state whether it includes caution, and the book's stated ten-minute inclusive mean is contrary evidence. Numerical improvement cannot settle this ambiguity.

For source provenance, the saved book extraction has the table-link/caution sequence at lines 599–602; the separate Temkin extraction has it at 270–273. Those private extraction identifiers and original PDF hashes are recorded in the [aggregate evidence](research/table-component-2026-09-25.json). The public PDF pages are the primary citations; extraction line numbers do not claim to be publisher numbering.

## Exactly one candidate, frozen before scoring

The complete 365-day forecasts and 18 inputs were frozen at **2026-09-25 13:59:05 UTC**, before evaluating this candidate. Every source date had already been exposed. There was no new parameter search, city/day adjustment or second candidate selected after scoring.

Only the shared Temkin changes: subtract 679.16 seconds before noon and add it from Dhuhr onward. The following remain fixed:

- Istanbul 41°N/29°E and Europe/Istanbul.
- Own continuous NOAA coordinates; these are not the MICA system named by the publisher.
- Fajr −19°, Isha −17°, geometric solar-center horizon 0°, true transit for Dhuhr and factor-one Asr using transit declination.
- One nearest-minute rounding of each adjusted absolute UTC instant, with original source dates and no modulo-day comparison.

No additional solar radius, refraction, terrain dip, horizon correction or event-specific clock margin is stacked onto this interpretation. The candidate code remains a private diagnostic; the existing runnable public calculator is unchanged.

## All dates, events and regressions retained

| Model, all 2,190 known values | Exact | Within ±1 minute | Maximum | Mean absolute difference |
| --- | ---: | ---: | ---: | ---: |
| Fixed 600 seconds | 0 (0.00%) | 1,020 (46.58%) | 4 min | 1.802 min |
| Earlier daily variable Temkin | 480 (21.92%) | 1,408 (64.29%) | 4 min | 1.287 min |
| Conditional table+120 seconds | **1,423 (64.98%)** | **1,830 (83.56%)** | **3 min** | **0.516 min** |

Against fixed 600 seconds, 2,162 absolute differences improve, 28 remain the same and none worsen. Against the earlier variable candidate, 1,438 improve, 11 worsen and 741 remain the same; 953 values become exact while 10 previously exact values regress. No value is missing or excluded.

| Event | Exact /365 | Within ±1 minute | Maximum |
| --- | ---: | ---: | ---: |
| Fajr | 358 | 365 | 1 min |
| Sunrise | 2 | 358 | 2 min |
| Dhuhr | 355 | 365 | 1 min |
| Asr | 357 | 365 | 1 min |
| Maghrib | 0 | 12 | 3 min |
| Isha | 351 | 365 | 1 min |

The four non-horizon event groups are all within one minute. Sunrise remains mostly one minute late and Maghrib mostly two minutes early. The 360 differences outside one minute consist of seven sunrises and 353 Maghrib values. The earlier [shared-horizon](COMMON-HORIZON.md) and [729 rounding-policy](ROUNDING-POLICIES.md) exclusions are not overcome by this candidate.

Every month has a lower total absolute difference than **both** earlier models. Month-level regressions below are individual absolute-error increases against the daily variable model; there are none against fixed 600 seconds.

|2026 month|Exact /compared|Within ±1 minute|Maximum|Regressions vs variable|
|---|---:|---:|---:|---:|
|January|120/186|155|2 min|3|
|February|101/168|139|2 min|3|
|March|122/186|155|2 min|0|
|April|115/180|151|2 min|0|
|May|120/186|155|2 min|3|
|June|118/180|149|2 min|2|
|July|124/186|156|2 min|0|
|August|123/186|156|2 min|0|
|September|117/180|152|2 min|0|
|October|120/186|155|3 min|0|
|November|120/180|150|2 min|0|
|December|123/186|157|2 min|0|

All year/month/event histograms and paired comparisons are in the aggregate. Raw publisher rows and per-day derived reference values are not redistributed.

## What the physical scale check does—and does not—show

Using the source's combined depression −1°29′6.2″ at latitude 41°, the geometric 0°-to-depressed-horizon interval is 472.292 seconds at declination 0° and approximately 551.299–560.449 seconds at declinations −23.44°/+23.44°. The first reproduces the printed 7 min 52.29 s example. The tabular 559.16 seconds has a plausible geometric seasonal scale.

This check was declared before evaluation. It does **not** reconstruct how the table was generated, establish maximum-season sampling or prove that caution was excluded. The equinoctial value plus 120 seconds is 592.292 seconds, consistent with the source's rounded ten-minute mean. That counterevidence remains even though the different table interpretation scores better.

## Verification and the missing fresh test

Both earlier complete model outputs replay identically on all 365 days. Independent Python parsing checks every original HTML cell, independently recomputes 2,190 adjusted UTC minutes, recounts 19 summary groups and verifies all 18 frozen hashes. The nearest half-minute rounding boundary is only 0.038244 seconds away; these displayed-minute matches are not an ephemeris-accuracy measurement. A separate source review confirms that the interpretation is reasonable only when kept conditional.

A full 2027 forecast was then frozen before a bounded search for a normally advertised Istanbul 2027 annual calendar. The observed interface exposed only the current-year annual link and monthly selection; the one primary-domain search found no qualifying future source. No new calendar was requested, and all 2,190 future comparison slots remain unacquired. This does not prove that no future calendar exists. No other city was assigned Istanbul's historical height.

The next useful evidence is a source-confirmed table/caution order, current production height, and sunrise/Maghrib convention, followed by an independently acquired calendar after a forecast freeze. The public default and all non-production limitations remain unchanged.
