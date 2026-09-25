# Location scope: GPS points and Diyanet city clocks

**A local calculation for a user's coordinates is not automatically an exact reproduction of Diyanet's named-city calendar.** The current implementation calculates at the supplied point. It does not implement a verified global Diyanet city-selection policy, and this study adds none.

## What the institution documents

[Diyanet's Temkin explanation](https://vakithesaplama.diyanet.gov.tr/temkin.php) says calendars determine one time for a settlement. It discusses differences between eastern/western and lower/higher areas as reasons for adjustments. This is a settlement-wide publication convention, not a promise that every GPS coordinate receives a separately calculated institutional clock.

The official [2020–2025 calendar activity report](https://kurul.diyanet.gov.tr/tr/faaliyetler/2020-2025/ibadet-vakitleri-dini-gun-ve-gecelerin-tespiti/namaz-vakitleri-takvim-calismalari) describes calculations using settlement coordinates and adding missing cities to a database. It reports 18,642 calculation points after additional airline/ocean work. A [related platform report](https://kurul.diyanet.gov.tr/tr/faaliyetler/2020-2025/ibadet-vakitleri-dini-gun-ve-gecelerin-tespiti/ileri-enlemlerde-namaz-vakitleri) describes worldwide city calendars based on those reference points. This is the report's historical description, not an independently verified current point count.

The documents do not publish a complete production-coordinate table or an operational global rule for choosing the city, distance limit, administrative boundary, coordinate precision or fallback. The airline/ocean work does not establish a universal grid to apply to all users. Six older published Turkish example coordinates remain useful explanatory inputs, not a confirmed current production catalogue.

## A bounded, measured example

An earlier public location-contract probe fixed these two inputs before acquisition:

| Input | Latitude | Longitude | Returned city |
|---|---:|---:|---|
| A | 52.52 | 13.405 | BERLIN, ID 11002 |
| B | 52.52 | 13.505 | BERLIN, ID 11002 |

Both archived coordinate responses are byte-identical; their daily objects also match a separate city-ID request. Each contains the same **48 core event fields across 23–30 September 2026**. This supports city assignment in that observed service sample. It does not establish the service's worldwide selection rule or Berlin's hidden calculation point.

A new, predeclared **retrospective** offline calculation used those unchanged inputs and all 48 fields. The current local model shifts every raw event **24 seconds earlier** at point B. With nearest-minute rounding, 25 displayed minutes move one minute earlier and 23 remain unchanged, although the institutional reference is identical.

| Model minus source UTC minute | Point A | Point B |
|---|---:|---:|
| −1 minute | 6 | 31 |
| Exact | 42 | 17 |
| Other differences | 0 | 0 |
| Within ±1 minute / compared | 48 / 48 | 48 / 48 |
| Missing or ambiguous / planned | 0 / 48 | 0 / 48 |

The complete event distribution is also retained:

| Event | A: exact / −1 minute | B: exact / −1 minute |
|---|---:|---:|
| Fajr | 7 / 1 | 0 / 8 |
| Sunrise | 6 / 2 | 3 / 5 |
| Dhuhr | 8 / 0 | 3 / 5 |
| Asr | 7 / 1 | 4 / 4 |
| Maghrib | 7 / 1 | 4 / 4 |
| Isha | 7 / 1 | 3 / 5 |

All 25 changed fields lose exactness; none improves. Both source-date interpretations give identical results here because no Isha crosses midnight. The comparison uses actual `Europe/Berlin` UTC offsets, not the unrelated `+03:00` attached to a source date label. There are **48 unique source cells**, not independent evidence multiplied by two points or two comparison modes. No point was fitted or replaced after scoring, and point A's better agreement does not identify it as the official point.

## Consequences for a fully local app

Keep the requested GPS position and the actual calculation position explicit. A coordinate-based profile should describe its astronomical rules and validation scope. Named-city compatibility additionally needs an independently documented reference point and city-selection rule. Choosing the nearest GeoNames centre or rounding a user's coordinates is not presently an established Diyanet convention.

A versioned catalogue of independently documented reference locations could be bundled locally; the arithmetic needs no runtime API. Such a catalogue would still need coverage, versioning and geographic selection evidence. Our earlier inferred effective points and coordinate-quantization experiments do not supply that authority. No runtime lookup, city preset, mathematical correction or notification release is added by this study.

No new city/year holdout was requested. Future validation must fix its intended target, independent coordinates, timezone and full forecast before accessing new source calendars. An arbitrary proxy can test a declared approximation; it cannot silently become the publisher's production point.

## Evidence and limits

This is one already known city and eight dates, not a worldwide accuracy estimate. The primary documentation supports reference-location publication, while the precise global selection policy remains unconfirmed. Source requests were not repeated and no authenticated operation was used.

Private working evidence is identified below for provenance; these files and original calendar rows are not bundled. The forecast was fixed before this new scoring pass, but references were already known. A separate Python recount verified all 192 repeated point/mode comparison rows and all residual groups; it was written by the same author and is not an independent solar implementation.

| Private artifact identifier | SHA-256 |
|---|---|
| `research/diyanet-global-location-2026-09-25/plan.json` | `b08a7cb886aa5db7c0f326d81e260e96bf0e0757b0d3c673bf5e26ed7190d8e3` |
| `research/diyanet-global-location-2026-09-25/forecast.json` | `4144b943435d3b31470af4f6642fec5d349545a997a6a156bedd78b57c34b5c7` |
| `research/diyanet-global-location-2026-09-25/report.json` | `fcca0b27d856512ea65a0f5f5014f15345c79517a0b804bfbb8eefb93b24efd0` |

The published calculators and all existing validation results remain unchanged.
