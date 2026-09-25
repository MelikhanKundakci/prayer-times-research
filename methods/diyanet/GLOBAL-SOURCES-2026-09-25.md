# Official-source audit and Tokyo 2027 transfer check

**The unchanged local calculation matches every tested Tokyo 2027 minute within one minute, but it does not reproduce the calendar exactly.** The source audit also identifies an important missing input: Diyanet confirms internal coordinate data without publishing the production points in the standard documentation reviewed here. No calculator, default or notification eligibility changes in this study.

## A new full-year comparison

One case was declared before any Diyanet Tokyo search: Tokyo, Japan, 2027, using the independent [UNGEGN city point](https://ungegn.un.org/dashboard/cities/details?id=113), **35.68°N, 139.68°E**, and `Asia/Tokyo`. The point is credited to Japan's Geographical Survey Institute; it is not a confirmed Diyanet calculation point. The unchanged [own low-latitude implementation](implementation/low-latitude/model.mjs) generated all 365 days and six events before acquisition. It uses the existing USNO UTC00, 18°/17°, −50′ horizon, Temkin and nearest-minute recipe.

The complete forecast and 14 dependency pins were frozen at **2026-09-25 14:33:46 UTC**, before the first institutional search exposed Tokyo clocks. The original [official Turkish page](https://namazvakitleri.diyanet.gov.tr/tr-TR/14833/tokyo-namaz-vakitleri) identifies city 14833 in Japan and supplies the complete 2027 table. The independently parsed English page agrees on all 2,190 values. No point, year, angle, rounding or other parameter was changed after exposure.

| Event | Exact / 365 | Within ±1 minute | Maximum absolute difference |
|---|---:|---:|---:|
| Fajr | 203 | 365 | 1 minute |
| Sunrise | 228 | 365 | 1 minute |
| Dhuhr | 225 | 365 | 1 minute |
| Asr | 238 | 365 | 1 minute |
| Maghrib | 224 | 365 | 1 minute |
| Isha | 237 | 365 | 1 minute |
| **Total** | **1,355 / 2,190 (61.87%)** | **2,190 (100%)** | **1 minute** |

All **835 nonexact values are model +1 minute**. Every month is retained in the [aggregate evidence](research/global-sources-2026-09-25.json). No missing, ambiguous `00:00` or excluded values occur. Comparison assigns each nonzero printed clock to its printed Gregorian date in the actual IANA zone and compares complete UTC instants; there is no modulo-day correction. That date assignment remains an explicit interpretation, not a publisher-provided event timestamp.

A separate Python parser and `zoneinfo` calculation verified every value, the six event groups, 12 months, all freeze pins and cross-language parity. This checks the comparison, not physical solar accuracy. The Node forecast uses pinned tzdb 2026d; Python independently confirms the constant-offset civil conversions used in these cases. Local timestamps and hashes document ordering but are not an external timestamp certification. This is new geographic evidence for an unchanged recipe, not an improvement selected against the new calendar.

## What the current official publications establish

**High-latitude scope and chronology.** The [official activity report](https://kurul.diyanet.gov.tr/tr/faaliyetler/2020-2025/ibadet-vakitleri-dini-gun-ve-gecelerin-tespiti/ileri-enlemlerde-namaz-vakitleri) explicitly describes 45° and north and implementation of the 2021 congress decisions from 2023. Older online decisions must not silently replace that policy. The current public [English](https://www.awqatsalah.com/sub/18/calculation-criteria) and [Turkish](https://www.awqatsalah.com/sub/34/tespit-kriterleri) criteria were retrieved through their observed public CMS endpoints and are byte-identical to the previously archived texts. They support the stated northern angles, five-hour minimum day/night, ratio anchor and gradual transition. They still do not uniquely specify interpolation endpoints, ephemeris, rounding or a southern seasonal mirror. The existing reconstructions remain hypotheses where those details are missing.

**Coverage is a set of calculation points.** The [official 2020–2025 calendar activity report](https://fetva.diyanet.gov.tr/tr/faaliyetler/2020-2025/ibadet-vakitleri-dini-gun-ve-gecelerin-tespiti/namaz-vakitleri-takvim-calismalari) explains that 8,600 existing places plus 10,042 added coordinates brought the service to **18,642 points** during work for Turkish Airlines in 2023. It also says coordinate information became accessible through a separate airline role. This establishes neither universal GPS coverage nor ordinary public access to production coordinates. The same report's 1,649 calendar locations for 2025 concerns a different publication scope; these counts are not interchangeable. No restricted role or authenticated endpoint was accessed.

**There is a documented institutional API.** The current [official API site](https://awqatsalah.diyanet.gov.tr/index.html) describes registration, authentication, country/state/city discovery, `CityDetail` and a date-range prayer-time request. It states a monthly limit of **10 annual/date-range requests per place**. The [public OpenAPI document](https://awqatsalah.diyanet.gov.tr/openapi/v1.json), resolved through the site's linked documentation script, confirms Bearer authentication and a `cityId`, `startDate`, `endDate` request. Its generic response schema does not provide a complete event payload contract. An API that distributes calculated results is not an open mathematical implementation; public documentation also does not establish redistribution rights or guaranteed availability.

**Date metadata does not settle event dates.** The linked [official API guide](https://awqatsalah.diyanet.gov.tr/files/56d83ac4-f7f5-4f6e-9b9e-b1ffeebf1b6a.pdf), printed pages 9–10, shows identity/Qibla information for `CityDetail`, with no calculation latitude, longitude or elevation. Its daily example has six `HH:mm` fields, a separate date-midnight ISO value and `greenwichMeanTimeZone`. Those fields do not specify an individual UTC instant or the date ownership of after-midnight Isha. The guide's older examples also omit the currently documented date-range operation. A verified event-date contract remains necessary for reliable notifications.

These bounded checks found no complete operational specification for solar coefficients/epoch, production points, minute rounding and adjustment order, or after-midnight event dates. That is a finding about the inspected material, not a claim that Diyanet has no such documentation. Direct archival GETs for three calculation FAQ pages returned 403; those attempts were preserved and not retried.

## Future files and the southern availability limit

The inspected official calendar pages configure **PDF and Excel export of the loaded annual table**. This is a useful downloadable reference, but it does not imply access to arbitrary future years. Religious-day tables extending into later years are also not daily prayer-time calendars.

The separately frozen **Sydney, Australia, and Punta Arenas, Chile, 2028** forecasts were preserved unchanged. One newly authorized ordinary request to each previously observed annual endpoint again returned **HTTP 502**. Both official HTML city pages remain accessible but show 2027 only; no 2028 selector or link was observed. Therefore **0 of 4,392 planned 2028 values were acquired**, and no new southern accuracy percentage is reported. The already exposed 2027 rows were not substituted. A separate sandbox DNS failure preceding Sydney's actual request is also retained in the private acquisition log.

## Practical implication

The [separate Nairobi check](NAIROBI-2027.md) was independently recounted during this audit: 2,093/2,190 exact, with 97 model −1 differences and all values within one minute. Its opposite residual direction to Tokyo means a blanket one-minute shift cannot preserve the observed ±1-minute agreement in both cities. These two cases do not identify the cause of either discrepancy and are not pooled into a worldwide reliability claim.

The next useful evidence is the publisher's actual location metadata and precise rounding/event-date contract. Further models should keep independent points, complete forecast freezes, all missing data and geographic regressions. No individual source calendar or clock rows are redistributed here. The aggregate includes hashes of private research evidence for provenance; hashes alone do not make publisher accuracy reproducible without lawful access to the references.
