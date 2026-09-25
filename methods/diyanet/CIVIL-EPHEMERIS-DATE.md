# Civil-row ephemeris: an opt-in compatibility candidate

One declared change improves the known Apia 2027 comparison and transfers to a separately frozen Nuku'alofa 2027 whole-year holdout. It is available as an **opt-in research variant** for the existing low-latitude and southern domains. Existing defaults and the northern seasonal model remain unchanged. This is not a verified Diyanet production rule or a claim of more accurate physical astronomy.

## Result and scope

Each annual comparison contains 365 days × six events = 2,190 observations. The minute error is predicted absolute UTC minus the explicitly interpreted original source UTC; there is no modulo 24-hour score or fitted clock shift.

| Case | Role | Original exact | Civil-row exact | Within 1 minute, both models | Corrected to exact | Newly non-exact |
|---|---|---:|---:|---:|---:|---:|
| Apia 2027 | Known development | 1519/2190 (69.36%) | 2112/2190 (96.44%) | 2190/2190 | 639 | 46 |
| Nuku'alofa 2027 | Prospective whole-year transfer | 1299/2190 (59.32%) | 2174/2190 (99.27%) | 2190/2190 | 881 | 6 |

All 46 Apia regressions and six Tonga regressions are one-minute changes. Every prayer-event group gains exact matches; no group loses within-one coverage. Tonga has 16 remaining misses: 15 late and one early by one displayed minute. In the candidate's own raw model, these fall approximately 0.004–0.839 seconds outside the source-minute nearest-rounding cells. Those distances are **not known errors in official raw event times** and do not identify a cause. Their opposing signs also prevent one uniform subsecond clock shift from fixing all 16. No such correction was fitted.

The complete development gate covered **51 previously exposed city-years**, not only Apia: 111,690 planned fields, 111,235 compared and 455 unresolved printed zeros. All 50 other annual predictions remain exactly unchanged. Both source-date interpretations share the same observations and must not be added together:

| Development interpretation | Original exact | Candidate exact | Within 1 minute, unchanged | Maximum, unchanged |
|---|---:|---:|---:|---:|
| Primary printed-date, actual IANA | 98899 | 99492 | 110973 | 1443 minutes |
| Conditional evening-cycle, actual IANA | 99079 | 99672 | 111183 | 3 minutes |

The large primary-date discrepancies are retained pre-existing northern source-date ambiguities; this candidate does not repair them. No city-year, geographic region, prayer-event, or city-event aggregate loses exactness or within-one coverage in either interpretation. Individual regressions remain visible. There are no changed UTC carriers or model local event dates, and independent within-row/inter-day chronology checks found no new violations.

| Event | Apia original → candidate exact, /365 | Tonga original → candidate exact, /365 |
|---|---:|---:|
| Fajr | 241→352 | 181→363 |
| Sunrise | 242→350 | 187→365 |
| Dhuhr | 281→347 | 283→363 |
| Asr | 244→354 | 256→358 |
| Maghrib | 257→355 | 199→360 |
| Isha | 254→354 | 193→365 |

Full city/event/region aggregates, regressions, hashes and the separate transfer result are in [the evidence JSON](research/civil-ephemeris-date-2026-09-25.json). It contains no original calendar rows. Apia remains development evidence; Tonga is the single prospective transfer year.

## The single numerical change

Let `D` be UTC00 of the requested civil calendar row and `C` the UTC00 carrier whose solar transit falls on that row in the requested IANA zone. They often coincide. Around the international date line, a civil row can have its transit on a different UTC date; both tested Pacific cases use `C = D − 1 day`.

The original daily recipes evaluate declination and equation of time at `C`. This candidate evaluates both at `D`, while preserving the absolute time carrier:

```text
coordinates = USNO(D)
transitUTC = C + (12 − longitudeDegrees / 15 − coordinates.equationOfTimeHours) hours
```

All spherical hour-angle calculations use that same daily declination. The sunrise/sunset horizon, Fajr 18°/Isha 17°, shadow factor 1, fixed minute adjustments and nearest-minute UTC rounding are unchanged. There is no final extra day, longitude shift, timezone correction, named-city branch, or newly selected coefficient. The rule applies generically in both directions of a carrier-date difference. Where `C = D`, the event calculations are exactly identical.

This differs from the rejected [local-mean-midnight/ephemeris/rounding alternatives](GLOBAL-NUMERICS.md), which changed sampling or rounding throughout their domains. The [primary-source intermediate-value audit](INTERMEDIATE-VALUES.md) did not identify an official production sampling epoch. The present hypothesis came from an already exposed Apia noon-pattern inconsistency and was explicitly declared before its candidate scoring. Matching institutional labels does not establish which physical ephemeris or internal convention the publisher uses.

## Use the opt-in implementation

The method-specific module is [implementation/civil-ephemeris/candidate.mjs](implementation/civil-ephemeris/candidate.mjs). It exports:

- `calculateLowLatitudeDay`, `calculateLowLatitudeYear`: 0≤latitude<44.5.
- `calculateSouthDay`, `calculateSouthYear`: −60≤latitude<0.

Day inputs contain exactly `date`, `latitude`, `longitude`, `timeZone`; annual inputs use `year` in place of `date`. Dates/years remain limited to 2000–2099. Unknown fields, accessor properties, invalid dates/zones and out-of-domain latitudes are rejected. No northern seasonal fallback is introduced.

```js
import { calculateSouthDay } from './implementation/civil-ephemeris/candidate.mjs';

const day = calculateSouthDay({
  date: '2027-01-01',
  latitude: -21.1345386521,
  longitude: -175.223892147,
  timeZone: 'Pacific/Tongatapu',
});
// day.variant === 'south-civil-row'
// day.ephemerisDate === '2027-01-01'
// day.solarTimeCarrierDate === '2026-12-31'
// day.notificationEligible === false
```

The legacy `solarCalculationDate` field retains the absolute UTC time-carrier meaning; `ephemerisDate` explicitly gives the new sampling date. Outputs include the candidate’s absolute UTC instants and actual local event dates, and retain the existing unavailable-sign representation and fields. Metadata marks the result as experimental, unofficial, unverified for the publisher's production point and ineligible for notifications. No source calendar, network service, city table or external astronomy library is read at calculation time.

## Freeze, source and verification

The 51-year development declaration preceded forecasts, freeze and comparison. The complete Tonga candidate forecast was frozen at **2026-09-25T15:43:01.050Z**, after the development gate passed and before any Tonga identity/calendar was obtained. Independent pre-source review passed before acquisition. The unchanged baseline had already been separately frozen at 15:30:37.583Z. The official [Tonga country listing](https://namazvakitleri.diyanet.gov.tr/assets/locations/TONGA.json) subsequently identified the [Nuku'alofa annual page](https://namazvakitleri.diyanet.gov.tr/tr-TR/16375/nukualofa-namaz-vakitleri), City ID 16375. Its original 365 rows/2190 clock fields were parsed and independently recounted, with IANA `Pacific/Tongatapu` and no clock repair. The [UNGEGN point](https://ungegn.un.org/dashboard/cities/details?id=207) is an independent city proxy, not an identified Diyanet calculation point.

The initial freeze pins 41 files. A supplemental pin for one unchanged transitive Python parser helper was added at 15:45:06 UTC, **after unsuccessful target search had begun but before the Tonga listing/calendar was returned**. That timing is explicitly retained; it is not described as 42 dependencies pinned before every search. No numerical forecast, candidate, evaluator or parser implementation changed. Source timestamps are saved-file records, not cryptographic proof of prior ignorance.

Verification includes independent Python reconstruction of 223,380 development interpretation rows, 1,492 aggregate variant groups and 117,530 direct geometry cells; independent original-Tonga parsing and 8,760 model/interpretation row checks; and exact public-module replay of 50,370 raw/rounded fields across all 23 applicable development/transfer annuals. Public tests cover full-year unchanged-event parity, model-generated Pacific regression examples, both carrier directions, strict inputs, leap/skipped dates, unavailable signs, and network/reference-denied execution under two host zones. The [tests](../../tests/diyanet-civil-ephemeris.test.mjs) use model snapshots rather than copied institutional calendars.

One successful independent city-year supports a scoped compatibility improvement. It does not validate arbitrary GPS positions, other years, every date-line timezone, production city points, or the unchanged northern high-latitude policy. Further frozen whole-year transfer tests are needed before considering a default change or notification use.
