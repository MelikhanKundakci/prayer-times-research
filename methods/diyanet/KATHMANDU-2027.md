# Kathmandu 2027: prospective fractional-zone Diyanet check

**Result:** The unchanged, fully local Diyanet low-latitude reconstruction at a separately chosen Kathmandu city point matched **2,017 of 2,190** printed Diyanet times exactly. The other **173** were one minute earlier than the official clock. This is a complete one-city, one-year comparison in `Asia/Kathmandu` (UTC+05:45), not a verified Diyanet production-point calculation or worldwide accuracy claim.

## Frozen forecast and original source

Before opening Diyanet's Kathmandu page, we fixed the [UNGEGN Kathmandu point](https://ungegn.un.org/dashboard/cities/details?id=101), **27.70877°N, 85.32716°E**, year 2027, and `Asia/Kathmandu`. The existing `diyanet/low-latitude` recipe produced all six events for all 365 dates. The complete forecast was frozen at **2026-09-25 18:01:40.869 UTC** with SHA-256 `91ee60dc184c3953c0b86ae8d4043c5b8f3fc042d96b43eb751389abfcb43f0e`. Its plan SHA-256 is `847a984bb094f371f8d66056db6ece1c1861aa8097889934808bda8c5dc6f600`; the unchanged model file hash is `1f6c00873f3082efa0ce9fa0807a0f2342c1891c437c6794cff8418e2450ebf2`. The model used repository-pinned tzdb 2026d.

After the freeze, the official site selector **NEPAL → KATHMANDU** opened [Diyanet city page 15563](https://namazvakitleri.diyanet.gov.tr/tr-TR/15563/kathmandu-icin-namaz-vakti). Its annual table's Excel button yielded an original XLSX file with SHA-256 `fd03ed195569cb4fef484b1407b9227d7342157dc51414dcc5202ef83fd13822`. The file contains all 365 consecutive Gregorian rows from 1 January through 31 December 2027, six populated `HH:mm` columns per row and no `00:00` cell. The original workbook and complete frozen forecast are retained in private research; only [aggregate results](research/kathmandu-2027-2026-09-25.json) are redistributed here.

## Comparison

Each official clock was conditionally attached to its printed Gregorian row date in the pinned IANA zone. All 2,190 source clocks resolved to one legal UTC instant. Each forecast event retained that same local date. The comparison used absolute UTC differences, never modulo 24 hours. The signed difference below is **model minus Diyanet**:

| Event | Exact / 365 | Model one minute earlier | More than one minute |
|---|---:|---:|---:|
| Fajr | 331 | 34 | 0 |
| Sunrise | 339 | 26 | 0 |
| Dhuhr | 335 | 30 | 0 |
| Asr | 341 | 24 | 0 |
| Maghrib | 330 | 35 | 0 |
| Isha | 341 | 24 | 0 |
| **Total** | **2,017 / 2,190** | **173** | **0** |

A separate read-only extraction of the original workbook with a second spreadsheet reader reproduced all 365 dates, six original labels, the workbook hash and every signed residual directly against the frozen forecast. No location coordinate, angle, offset, rounding rule or output was changed after the source was opened.

The fractional UTC offset is handled consistently in this test, including source times whose UTC instant falls on the preceding date. The result does not identify Diyanet's actual city calculation coordinates, elevation, horizon or unpublished solar intermediates. It also cannot prove how Diyanet associates all printed `HH:mm` values with event dates elsewhere. The local method remains experimental and ineligible for automatic prayer notifications.
