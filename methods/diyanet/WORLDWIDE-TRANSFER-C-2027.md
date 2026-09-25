# Diyanet worldwide solar-date transfer check: 2027

**Result:** At the three predeclared 2027 city proxies, the unchanged Diyanet reconstructions match every official printed event within one minute. The existing opt-in `south-civil-row` hypothesis produces no changed value in any of these comparisons. All three forecasts have the same UTC solar-date carrier and requested row date on every day (`C=D`), so this is a control check; it supplies no new test of the candidate on a `C≠D` date.

## Frozen comparison and sources

The full baseline and candidate forecasts were frozen on 25 September 2026 at **16:59:16.963 UTC**, before official city-page identity or prayer-time rows were sought. The forecast hash is `339b38dd3ab8770092d6e0fbe7774788e36035955db4ea7af385ef66accb2cb0`. The unchanged baseline is `usno-daily-utc0`; the already existing candidate is `south-civil-row`. It changes only the UTC00 date used to sample USNO solar declination and equation of time, from carrier date `C` to civil row date `D`, retaining the remaining recipe. No new angle, offset, coordinate, or rounding choice was introduced.

After the freeze, official annual tables were exported using each page's own Excel button. Each downloaded workbook contains exactly 365 rows from 1 January through 31 December 2027. The source links and SHA-256 hashes are in the [public aggregate](research/worldwide-transfer-2027-2026-09-25.json). Original exports and normalized rows remain in the private research folder and are not redistributed here.

The comparison was first run with the host's tzdb 2026a, then rerun with the repository-pinned tzdb 2026d. Only the comparison timestamp and reported tzdb version changed; every city result and the frozen forecast hash stayed identical. The original host-tzdb report is retained privately for audit, and the public aggregate reports the pinned rerun.

| Official Diyanet calendar | Independent named-city proxy | Zone | Baseline and candidate result |
|---|---|---|---|
| [Jakarta, ID 12726](https://namazvakitleri.diyanet.gov.tr/tr-TR/12726/jakarta-icin-namaz-vakti) | −6.17797994918°, 106.774887126° | `Asia/Jakarta` | 1,660 / 2,190 exact; all within 1 min |
| [Cape Town, ID 13496](https://namazvakitleri.diyanet.gov.tr/tr-TR/13496/cape-town-icin-namaz-vakti) | −33.92888°, 18.41722° | `Africa/Johannesburg` | 2,045 / 2,190 exact; all within 1 min |
| [Auckland, ID 16640](https://namazvakitleri.diyanet.gov.tr/tr-TR/16640/auckland-icin-namaz-vakti) | −36.86666667°, 174.7666667° | `Pacific/Auckland` | 2,072 / 2,190 exact; all within 1 min |

These independent coordinates come from the [UNGEGN named-city records](https://ungegn.un.org/dashboard/cities/details?id=122), [Cape Town record](https://ungegn.un.org/dashboard/cities/details?id=2699), and [Auckland record](https://ungegn.un.org/dashboard/cities/details?id=553). They are reproducible comparison proxies only. They do not identify Diyanet's calculation points, elevation, horizon, or rounding implementation.

## Results and interpretation

All **6,570 of 6,570** source cells were present and resolved as a unique absolute instant under the proxy's IANA time zone and the printed Gregorian row date. There were no source `00:00` cells, missing events, model-unavailable events, or predicted local-date changes. No comparison uses modulo-24 clock arithmetic. Exact counts by event are in the aggregate; the signed model-minus-source residuals are:

A separate read-only extraction of the three original XLSX files verified each pinned SHA-256, all 365 ordered Gregorian dates per city, the six original column labels, and the signed distributions below directly against the frozen forecast.

| City | −1 min | exact | +1 min | >1 min |
|---|---:|---:|---:|---:|
| Jakarta | 0 | 1,660 | 530 | 0 |
| Cape Town | 0 | 2,045 | 145 | 0 |
| Auckland | 116 | 2,072 | 2 | 0 |

The candidate forecast is bit-identical to baseline in all 6,570 slots: zero changed times, improvements, regressions, newly introduced errors over one minute, or date mismatches. This follows from the frozen forecast's `C=D` count of 365 dates for each city. It is not evidence that the candidate transfers to other longitude/zone relationships. The predeclared plan's expected Auckland carrier `C=D−1` was incorrect; the already-frozen source-free forecast showed `C=D` on every Auckland date. The city cohort and calculation were left unchanged after this discovery and before official prayer-time access. See the [post-freeze erratum](research/worldwide-transfer-erratum-2026-09-25.md).

The earlier [civil-row study](CIVIL-EPHEMERIS-DATE.md) documents the candidate's known Apia and Nuku'alofa evidence. These new control calendars do not strengthen that positive `C≠D` transfer evidence. They also do not establish physical-event truth, religious validity, production-point identity, or a general worldwide accuracy rate. No calculation default or notification eligibility changes.

The high-southern Ushuaia 2026 and 2027 model/source comparisons already appear in the published [civil-row analysis](research/civil-ephemeris-date-2026-09-25.json) and [global numerics analysis](research/global-numerics-2026-09-25.json). Ushuaia is therefore exposed evidence, not a new blind holdout, and it was not added to this frozen cohort.

The public aggregate retains summaries and source links only, not the original source rows. Reproduction of this report requires retrieving the annual exports from the linked official pages; the frozen model output and original exports are preserved privately. Source and proxy limitations apply to every reported match.
