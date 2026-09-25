# La Paz and Suva 2027: two prospective Diyanet controls

**Result:** At two independently chosen city proxies, the unchanged local Diyanet southern reconstruction matched every 2027 official printed time within one minute. La Paz had **1,936/2,190** exact cells; Suva had **1,657/2,190** exact cells. In both calendars every non-exact model clock was one minute earlier. This supports the stated approximation at these two proxies and years, not exact institutional point identity or notification release.

## Frozen targets and official sources

The La Paz full-year baseline was frozen at **2026-09-25 18:09:45.773 UTC** before opening Diyanet's La Paz city page. It used the [UNGEGN La Paz point](https://ungegn.un.org/dashboard/cities/details?id=183), **−16.481233644°, −68.1257171577°**, `America/La_Paz`, and the published `south/usno-daily-utc0` model unchanged. The complete forecast SHA-256 is `9fdc1de7618da6a711fdda3bbc0cb65e08c018307156f4095d6556dc6684e9eb`. After that freeze, the Diyanet selector **BOLIVYA → LA PAZ** opened [official city 11958](https://namazvakitleri.diyanet.gov.tr/tr-TR/11958/la-paz-icin-namaz-vakti). Its annual Excel export SHA-256 is `92571873f41495bf6adf22e0f7f931f9998ee61657faf5a1438682968323fa85`.

The Suva city identity, **FIJI → SUVA, ID 12821**, was found before its prayer rows were read. A complete baseline and existing opt-in `south-civil-row` forecast at the independent [UNGEGN Suva point](https://ungegn.un.org/dashboard/cities/details?id=119), **−18.1179065976°, +178.491287276°**, `Pacific/Fiji`, was frozen at **2026-09-25 18:12:13.329 UTC** with SHA-256 `f47a7cf0dcfaa7a8d19a8dc1b47acec809998c643c40146a2a1b6b207be9e705`. Only then was the annual Excel export obtained from [official city 12821](https://namazvakitleri.diyanet.gov.tr/tr-TR/12821/suva-icin-namaz-vakti); its SHA-256 is `158e864d59a5e525d1a5d7c516e79167077b8fdd3f013ceb1f493fc708ed6b9d`.

Both original workbooks have 365 ordered Gregorian rows from 1 January through 31 December 2027, six populated `HH:mm` fields per row and no `00:00` cells. The source files, full frozen forecasts, plans and row-level reports are retained in private research. Public aggregates are [La Paz](research/la-paz-2027-2026-09-25.json) and [Suva](research/suva-2027-2026-09-25.json); original source rows are not redistributed here.

## Full-year comparison

Each source clock was conditionally assigned to its printed row date in its pinned IANA zone. All 4,380 cells resolved to a unique UTC instant, and every model event retained the printed local date. Comparisons use absolute UTC, not modulo-24 clock labels. The signed difference is **model minus source**:

| City | Exact / 2,190 | Model 1 minute earlier | More than 1 minute | Unavailable or ambiguous |
|---|---:|---:|---:|---:|
| La Paz | 1,936 | 254 | 0 | 0 |
| Suva | 1,657 | 533 | 0 | 0 |

An independent read-only extraction of each original XLSX with a second spreadsheet reader reproduced all dates, original column labels, file hashes and signed residuals directly against the frozen forecasts. Per-event counts are in the aggregates.

Suva was chosen to probe the civil-row ephemeris candidate, but its **already-frozen, source-free** forecast revealed `C=D` on all 365 dates. Its candidate and baseline therefore produce bit-identical UTC events in all 2,190 slots, with zero improvements or regressions. The preselected city was kept and scored. This calendar is another geographic control, **not** a new test of the date-line correction where `C≠D`. No default was changed. The La Paz control uses only the existing baseline.

These points come from UNGEGN, not a Diyanet production-coordinate catalogue. Neither annual page publishes its internal point, elevation, horizon, solar seconds, rounding sequence or a general event-date contract. The one-minute direction could reflect one or several missing inputs; adding a global minute to fit these cities would be unjustified. Both variants remain experimental and ineligible for automatic prayer notifications.
