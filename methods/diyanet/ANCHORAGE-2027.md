# Anchorage 2027: northern Diyanet clocks and unresolved Isha dates

A complete, frozen offline forecast for Anchorage, Alaska reproduces the published Diyanet clocks closely, but **the publisher's after-midnight event dates are not established**. With every source clock assigned to its printed Gregorian row date, 73 Isha comparisons differ by about a day. Under a separately declared interpretation that assigns Isha to the next date when its clock precedes that row's Maghrib, **2,112/2,189 comparable fields are exact and all 2,189 are within one minute**. One printed `00:00` Isha remains ambiguous and excluded in both views. The conditional result must not be read as a confirmed UTC timestamp contract or notification approval.

## Predeclared location and forecast

The unchanged `north-missing-window` calculation, including its later additive ordering flags, was frozen at **2026-09-25 14:43:27 UTC** before any Anchorage Diyanet calendar was read. The input was Anchorage 2027 at **61.2181°N, −149.9003°**, `America/Anchorage`, using an [Alaska Department of Environmental Conservation coordinate](https://dec.alaska.gov/media/4674/2014-spenardareawidepacp1.pdf). That is an independent city proxy, not a Diyanet production point. The public Diyanet USA location file had already identified `ANCHORAGE / ALASKA`, ID **8584**, without displaying calendar times. Every one of the 365 × 6 forecast slots was retained.

The create-once freeze script retained a prose typo, “other Fairbanks namesakes,” from an unsuccessful preceding Fairbanks study. A separate identity amendment recorded the correction to “other Anchorage namesakes” **before the first Anchorage calendar request**. City, year, coordinates, timezone, recipe and full forecast were unchanged. The [official Anchorage page](https://namazvakitleri.diyanet.gov.tr/tr-TR/8584/anchorage-namaz-vakitleri) then identified ID 8584, state `ALASKA`, country `ABD`, and 365 ordered 2027 rows. The legacy [USA location file](https://namazvakitleri.diyanet.gov.tr/assets/locations/USA.json) uses `USA` for the same ID; the labels were checked rather than silently conflated.

| Source-date interpretation | Comparable / planned | Exact | Within one minute | Maximum | Excluded |
|---|---:|---:|---:|---:|---:|
| Printed row date, actual IANA timezone | 2,189 / 2,190 | 2,043 | 2,116 | 1,441 min | One ambiguous `00:00` Isha |
| **Conditional** next-day Isha when its clock is before Maghrib | 2,189 / 2,190 | **2,112** | **2,189** | **1 min** | The same ambiguous `00:00` Isha |

All 73 values more than one minute apart in the primary view are Isha date-scale differences; the other five event columns are entirely within one minute. The date interpretation changes no calculation. It only changes how published `HH:mm` is mapped to a possible UTC instant. The source does not publish event-specific UTC instants or an explicit after-midnight row rule. No missing model events or source rows were hidden.

Source and forecast pins: complete forecast SHA-256 `d01c0cd2f361e1de9b7e8683b2d2ef40e814a831d74bdb3b66cf225141750b86`; original Diyanet HTML SHA-256 `80a9406162bb9c46c9071526da3cd34dfba217827184202ddd45437714e10705`; USA city-list SHA-256 `8209dd846346332e46fa3b7d5b831a93a4aceade87cd6579caa3f18372970824`. Reference rows remain outside this public repository. Runtime calculation used Node 26.7.0, ICU 78.3 and pinned tzdb 2026d. An independent source parser and the public pinned-runtime [`compareCalendars`](../../validation/index.mjs) resolver reproduced both comparisons and the full forecast. The resolver also checked the 2027 Anchorage DST gap and fold; no nonzero source clock in this cohort mapped ambiguously. These checks validate the reported comparison under its stated date interpretations, not which interpretation Diyanet intends.

## Why this does not complete global Diyanet support

The preceding Fairbanks 2027 forecast was also frozen without reading Diyanet times. Fairbanks was absent from the **461 entries in the public legacy USA location file**, so that planned named-city comparison has no verified official city ID or source calendar and **no accuracy score**. Absence from this one file is not proof that Diyanet has no Fairbanks service or newer location record. It illustrates why neither an unverified nearest-city rule nor a missing source should be treated as a validation hit.

The broader northern model still has city/year-specific two-minute residuals, unknown official production points, and unconfirmed high-latitude interpolation and after-midnight semantics. The source's one-minute clocks cannot certify observational seconds or a religiously approved fallback. The calculation remains `productionReady: false` and automatic notifications remain disabled.
