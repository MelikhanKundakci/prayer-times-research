# Hobart 2027: a frozen southern Diyanet transfer check

The unchanged, fully offline southern Diyanet reconstruction matches **1,743 of 2,190** displayed minutes in the official Hobart, Tasmania 2027 calendar. Every other comparable value differs by exactly one minute: 442 model-earlier and five model-later. There are **no missing rows or events, source `00:00` clocks, timezone-fold ambiguities or local event-date shifts** in this case. This is evidence for one independently chosen city proxy, not worldwide or official-production-point accuracy.

## Prospective protocol

At **2026-09-25 15:13:31 UTC**, the complete 365-day, six-event forecast and code hashes were frozen before looking up Diyanet Hobart timing rows. Input: **42.89°S, 147.33°E**, `Australia/Hobart`, 2027. The independent point comes from the [Australian Bureau of Meteorology's Hobart (Ellerslie Road) station 094029](https://www.bom.gov.au/climate/averages/tables/cw_094029_Info.shtml). It is a nearby city proxy and **not** a verified Diyanet calculation point, elevation or horizon. The recipe is the existing [`south` UTC00 calculator](implementation/south/candidate.mjs); no Hobart parameter or one-minute correction was fitted.

After the freeze, the [official Hobart annual page](https://namazvakitleri.diyanet.gov.tr/tr-TR/11420/hobart-namaz-vakitleri) identified city **11420**, country `AVUSTRALYA`, and provided exactly 365 ordered 2027 rows. The original response was parsed with the existing strict annual-table parser and a separate independent HTML parser. The public pinned-IANA [`compareCalendars`](../../validation/index.mjs) comparator resolved each printed clock as an event on its printed Gregorian date. A separate Python `zoneinfo` UTC-instant recount matched every residual and verified that all source clocks have a unique legal instant in `Australia/Hobart`. A conditional next-day-Isha reading produces identical results because no Isha clock in this table precedes its row's Maghrib.

| Event | Exact / 365 | Model −1 minute | Model +1 minute | Within ±1 minute |
|---|---:|---:|---:|---:|
| Fajr | 252 | 113 | 0 | 365 |
| Sunrise | 291 | 74 | 0 | 365 |
| Dhuhr | 301 | 64 | 0 | 365 |
| Asr | 292 | 73 | 0 | 365 |
| Maghrib | 283 | 82 | 0 | 365 |
| Isha | 324 | 36 | 5 | 365 |
| **Total** | **1,743 / 2,190 (79.59%)** | **442** | **5** | **2,190 / 2,190** |

This meets the predeclared **within-one-minute transfer gate** without any numerical change. It does **not** meet an exact-minute imitation goal: 447 values differ, mostly in the model-earlier direction. The source publishes minute clocks, not original seconds or Diyanet's Hobart production coordinates; the cause cannot be identified from this calendar alone. A one-minute global shift would regress the 1,743 currently exact values and contradict the opposite residual direction observed in [Tokyo 2027](GLOBAL-SOURCES-2026-09-25.md).

## Provenance and limits

The private original HTML SHA-256 is `6a12c675d81cb597d6466a273e7dd7e7d82c3dbfaa12ae5e22adddad29dc71c7`; frozen complete forecast SHA-256 is `d9eb0f94d8c6900c143dc649cc16d2f1c69562000f83895d9e0208afba158c64`. Private full comparison and independent-review SHA-256 values are `9998298d64a4862360759b3ab6386943af7981939261f04bf169c424e33cf5ec` and `48bbfe1c68347fb4d14e39ae39e0ca4e340d200456cdbc44df9a8c5ce44e5d57`. [Public aggregate evidence](research/hobart-2027-2026-09-25.json) gives the distribution without redistributing reference rows. Node 26.7.0, ICU 78.3 and pinned tzdb 2026d produced and compared the forecast; Python independently checked civil-time resolution.

This test extends the fresh evidence to a southern DST-observing location. It does not establish Diyanet's worldwide GPS-to-city assignment, exact official point, untested high-southern-latitude rules, future timezone law or religious/notification approval. `productionReady` remains false and the public calculator is unchanged.
