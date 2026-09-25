# Iqaluit 2027: high-latitude availability and civil-time audit

An independently selected Iqaluit point and a forecast frozen before the 2027 official calendar was opened provide a prospective check of high-latitude output availability and daylight-saving conversion. The frozen `north-missing-window` forecast produced all six events on all 365 dates. Every printed Diyanet clock was within one minute of the forecast at the same printed Gregorian row date. This is evidence about displayed clocks for one city proxy and year; it does not establish Diyanet's production coordinates, event-date contract, or general notification suitability.

## Selection and source

The holdout was chosen because Iqaluit is a Diyanet-listed high-latitude city with seasonal clock changes and a full 2027 calendar available on its public city page. Before opening those year values, the forecast and analysis rules were frozen for **63.75°N, 68.5166666667°W**, `America/Iqaluit`, using `north-missing-window`. These are independent city-proxy coordinates, not a claimed Diyanet production point. The model freeze was **2026-09-25 17:00:11 UTC**; the plan and complete frozen forecast are retained in the private research folder. The official [Diyanet Iqaluit page](https://namazvakitleri.diyanet.gov.tr/en-US/9085/iqaluit-prayer-times) identifies city ID **9085** and publishes an annual table with Gregorian row date, Hijri date, and six `HH:mm` columns.

The annual export contained 365 consecutive Gregorian dates from 1 January through 31 December 2027, with all six clock cells populated on every row. There were no `00:00` values. The page does not attach an event-specific UTC instant or a written rule for after-midnight rows to those values.

## Frozen clock comparison

The comparison kept each official clock beside its own printed row date and compared its minute label with the frozen forecast's local clock for that date. **1,839 of 2,190** values matched exactly; all remaining **351** differed by one minute. The table reports the sign of **source minus model**.

| Event | Exact / 365 | Source one minute later | Source one minute earlier |
|---|---:|---:|---:|
| Fajr | 252 | 113 | 0 |
| Sunrise | 314 | 51 | 0 |
| Dhuhr | 314 | 51 | 0 |
| Asr | 314 | 51 | 0 |
| Maghrib | 322 | 43 | 0 |
| Isha | 323 | 35 | 7 |
| **Total** | **1,839 / 2,190 (83.97%)** | **344** | **7** |

All model event objects have `localDate` equal to their output row date. Every event has a calculable model clock, but statuses vary between `estimated` and `adjusted`; none is marked unavailable. All six events on all 365 dates have `eligibleForAutomaticNotifications: false`.

## Row dates, daylight saving, and UTC

The primary comparison above is explicitly a **printed-row-date interpretation**. When each of the 2,190 nonzero source clocks is conditionally mapped to its own printed Gregorian date in `America/Iqaluit` using the repository-pinned IANA rules, it has exactly one legal UTC occurrence. No tested clock falls into a nonexistent daylight-saving gap or a repeated fold. Isha is later than Maghrib on every row, so the separately used “move Isha to the next date only when it precedes same-row Maghrib” diagnostic would change no dates here. These are properties of this calendar under that mapping, not proof that the publisher defines all event dates this way.

The pinned timezone database gives Iqaluit offsets of UTC−05:00 before the 2027 spring transition and UTC−04:00 afterward, then returns to UTC−05:00 in autumn. The Diyanet table's clocks jump forward by about an hour on 14 March and backward on 7 November in the same manner. The frozen model shows the same civil-time transitions. This supports that the runtime applies local daylight-saving offsets for these rows; it does not independently verify Diyanet's underlying astronomical instants.

Iqaluit tests high latitude and daylight-saving behavior, not the international date line. The separate [Apia 2027 Diyanet comparison](APIA-2027.md) covers a city west of the date line: its complete source calendar and model clocks also had no missing output, no `00:00`, and no local event-date shift under the printed-row-date comparison. Together these cases provide bounded coverage across a high-latitude DST zone and a Pacific date-line zone. Neither proves a universal event-date convention.

## Reproducibility and limits

The frozen model forecast SHA-256 is `16e87fba6c2ec01ca868232f1b05c4c5df81b059236c356873325cba3c0d561d`. The exported official annual workbook SHA-256 is `f1aead2a58c10623fb3c8630517aa9c75aab3dd8e5e54a4c3ea337fa824e9320`; original row values are retained in private research, not this public repository. The comparison used Node 26.7.0, ICU 78.3 and the repository-pinned tzdb 2026d. The aggregate counts are in [`research/iqaluit-2027-2026-09-25.json`](research/iqaluit-2027-2026-09-25.json).

The minute table cannot establish source seconds, rounding convention, horizon, production coordinates, or semantic event dates. The current Diyanet method remains experimental and notification-ineligible. No runtime behavior was changed because this audit found no date, availability, DST, or dateline defect to justify a general correction.
