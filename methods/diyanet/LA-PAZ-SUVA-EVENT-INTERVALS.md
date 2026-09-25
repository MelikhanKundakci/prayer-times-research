# Southern event intervals at the frozen city-proxy latitudes

This is a retrospective diagnostic on the already [frozen La Paz and Suva 2027 annuals](LA-PAZ-SUVA-2027.md), not a new algorithm or unseen-city validation. At each independent proxy latitude, it asks whether **one fixed longitude** under the unchanged southern USNO UTC00 geometry, published integer-minute adjustments and nearest-minute rounding could exactly reproduce a whole *individual* Diyanet event column. The [earlier noon study](LA-PAZ-SUVA-NOON-FEASIBILITY.md) proves a longitude-only exact repair impossible even without holding latitude fixed, because Dhuhr is latitude-independent.

For each of the 365 published `HH:mm` cells in an event column, the original Excel row date and named IANA timezone determine its UTC minute. With latitude and UTC carrier fixed, the unrounded event shifts by −240 seconds per degree of east longitude. Its permitted longitude interval is open at the lower endpoint and closed at the upper endpoint. The column is exact only if all 365 intervals intersect. All source cells here are nonzero and resolve to one printed-date UTC occurrence; the preserved input hashes and full-precision bounds are in the [aggregate](research/la-paz-suva-event-intervals-2026-09-25.json).

| City and event | Constraint separation | Best retrospective single-longitude agreement |
|---|---:|---:|
| La Paz Fajr | 2.379 s | 360/365 |
| La Paz Sunrise | 2.096 s | 360/365 |
| La Paz Dhuhr | 0.395 s | 364/365 |
| La Paz Asr | 0.686 s | 363/365 |
| La Paz Maghrib | 2.121 s | 361/365 |
| La Paz Isha | 2.645 s | 357/365 |
| Suva Fajr | 4.541 s | 356/365 |
| Suva Sunrise | 4.568 s | 355/365 |
| Suva Dhuhr | 0.419 s | 364/365 |
| Suva Asr | 4.383 s | 359/365 |
| Suva Maghrib | 4.478 s | 353/365 |
| Suva Isha | 4.425 s | 356/365 |

Each separation is the excess between two incompatible rounding constraints, **not an observed timestamp error** or an amount to add to a prayer time. The best counts come from sweeping interval endpoints; each event may attain its best count at a different fitted longitude. They cannot be summed into a six-event result or treated as identified Diyanet coordinates. A different latitude can change the non-noon geometry, so those five event-column rejections are only for the held proxy latitude. Dhuhr's independent rejection remains valid throughout the checked city box.

An independent Python calculation read every original XLSX cell with `openpyxl`, resolved its timezone using `zoneinfo`, and reproduced all twelve active constraint dates, gaps and maximum-overlap counts from the frozen raw forecasts. This analysis does not separate an incorrect proxy point from a different solar ephemeris, horizon, height, rounding or publication convention. No calculation default or notification status changed.
