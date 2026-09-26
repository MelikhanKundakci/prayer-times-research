# Local point calculations under documented rules

This is the shared implementation of the app's primary goal: compute astronomical events at a supplied point and apply an explicitly named prayer-rule profile. Matching a city calendar is a separate compatibility question. No city lookup, empirical city correction, prayer API or reference calendar enters this calculation.

The first profile, `diyanet-published-point-v1`, independently applies published Diyanet criteria and margins to continuous point astronomy. It is **not an official Diyanet GPS service or its undisclosed production algorithm**. The [rule contract](RULES.md) identifies the evidence, interpretations and missing regional policies. The earlier [Diyanet calendar reconstruction](../diyanet/) remains available for its different research purpose.

## Calculate a point day

```js
import {calculateLocalDay, LOCAL_PROFILE} from './core/local/index.mjs';

const day = calculateLocalDay({
  date: '2027-03-20',
  latitude: 41.0082,
  longitude: 28.9784,
  timeZone: 'Europe/Istanbul',
  profile: LOCAL_PROFILE,
});

console.log(day.events.fajr.time);
console.log(day.events.fajr.utc);
console.log(day.coverage);
```

```sh
npm run calculate:local -- 2027-03-20 41.0082 28.9784 Europe/Istanbul diyanet-published-point-v1
```

All five fields are required; unknown fields and executable/getter inputs are rejected. Dates span 2001–2098, latitude −89° through 89°, and longitude −180° through 180°. Supply an appropriate IANA timezone; this module does not request GPS permission or infer a timezone. These mathematical input bounds do not imply complete religious-policy coverage at every point. A skipped civil date or non-unique solar-transit date fails explicitly.

## Shared profile registry

Version **0.5.0** defines **22 local profiles** in [profiles.mjs](profiles.mjs), with per-event roles, source evidence, margins, quantization and resolution: six existing institution-inspired or worked-example profiles, plus 16 explicitly composed five-prayer profiles. Read [PROFILES.md](PROFILES.md) for the source-versus-convention boundary and [COMPOSED.md](COMPOSED.md) for the compositions. The angle/night variants require opting into their estimate rule.

```js
import {calculateLocalDay, listLocalProfiles, getLocalProfile} from './core/local/index.mjs';
const definitions = listLocalProfiles(); // detached definitions; safe for a selector UI
const definition = getLocalProfile('fcna-usa-2017-point-v1'); // deeply frozen
const day = calculateLocalDay({
  date: '2027-03-20', latitude: 40.7128, longitude: -74.006,
  timeZone: 'America/New_York', profile: definition.id,
});
console.log(day.events.fajr.role); // prayer-start-model
console.log(day.events.dhuhr.role); // solar-noon-marker
console.log(day.coverage.prayerStartsComplete); // false: three starts are unspecified
```

```sh
npm run calculate:local -- --profiles
npm run calculate:local -- 2027-03-20 -6.2 106.8 Asia/Jakarta kemenag-worked-example-point-v1
```

An astronomical marker is not automatically a selected prayer start. Egypt and FCNA supply source-backed Fajr/Isha rules; their other events explicitly remain project-defined geometry markers. Kemenag's selections quantize to minutes before the stated margins, so `seconds` and `secondsDate` are null even though an ISO serialization can end in `:00`. `basis` retains the raw astronomical input, minute quantization and elapsed margin. None of these four profiles inherits the Diyanet northern policy or its Temkin values.

`coverage.complete` checks the presence of all six output fields. `coverage.prayerStartsComplete` additionally requires all five prayer names to carry `prayer-start-model` roles and available values; it stays false for the current Egypt/FCNA angle-only profiles. `coverage.nonPrayerStartEvents` lists the remaining geometric markers among those five names. Neither completeness field is institutional endorsement or notification approval.

## Explicit local summer calculation

Introduced in version **0.3.0**, a second explicitly selected profile, `local-northern-seasonal-v1`, supplies seasonal estimates. It inherits the ordinary point rules and northern threshold, and uses a fully specified local night-fraction policy for northern Fajr/Isha. It can produce a complete annual series at supported real-horizon points, including summer dates with no true Fajr or Isha crossing. It does not change the first profile or claim to recover Diyanet's undisclosed transition algorithm.

```js
import {calculateLocalDay, LOCAL_SEASONAL_PROFILE} from './core/local/index.mjs';
const day = calculateLocalDay({
  date: '2027-06-21', latitude: 50.1109, longitude: 8.6821,
  timeZone: 'Europe/Berlin', profile: LOCAL_SEASONAL_PROFILE,
});
console.log(day.events.fajr.status); // estimated
console.log(day.coverage.estimatedEvents);
```

```sh
npm run calculate:local -- 2027-06-21 50.1109 8.6821 Europe/Berlin local-northern-seasonal-v1
```

Computed example for **21 June 2027**, point **50.1109°N, 8.6821°E**, `Europe/Berlin` (CEST), rounded to the nearest minute:

| Event | Selected clock | Status |
|---|---|---|
| Fajr | 03:22 | Estimated by the local summer policy |
| Sunrise marker | 05:08 | Calculated with the profile's −7-minute margin |
| Dhuhr | 13:32 | Calculated |
| Asr | 17:51 | Calculated |
| Maghrib | 21:46 | Calculated |
| Isha | 23:03 | Estimated by the local summer policy |

These are reproducible model outputs, not reference-calendar observations.

Read [SEASONAL.md](SEASONAL.md) for the complete equations, source-versus-choice table, one-sided 20-minute blend, year/absence boundary checks, and supported domain. The profile uses one frozen annual ratio, including a declared `11/8` conversion of that night-third for the morning estimate. Those choices are explicit local conventions; the missing-Fajr source's separate “2° difference” is not claimed to have been reconstructed. Every candidate or blended twilight selection is `estimated`, with its mode, candidate, weight and reason retained. `calculation.seasonalPolicy` exposes the context and daily evidence; `coverage.estimatedEvents` identifies which displayed events use estimates.

The seasonal policy requires a complete annual context within 2002–2097. It does not provide five-hour replacement horizons for Oslo's short summer nights or polar regions, and it is not mirrored into the southern hemisphere. All selected summer nights are checked as dated UTC sequences, including `Maghrib < Isha < next Fajr < next sunrise`. Outside the supported domain, selected twilight remains explicitly blocked. Complete coverage means complete outputs under this named rule, not demonstrated institutional or observed accuracy.

## Astronomy and selected prayer times

`astronomy` retains the raw solar-cycle events. The 16 new compositions explicitly select the Reda–Andreas Solar Position Algorithm (SPA) point implementation in [`../astronomy/spa-point.mjs`](../astronomy/spa-point.mjs) and continuously solve crossings at the requested location. The six earlier profiles retain their prior USNO numerical model. Each profile keeps its own thresholds, roles and conventions. The SPA point model uses a level, unobstructed horizon; it does not model terrain, observer height, changing weather or a local skyline. The numerical root tolerance is not a statement of observational accuracy. See the [SPA method, assumptions and independent implementation evidence](../astronomy/SPA-POINT.md).

The six earlier profiles retain their documented factor-one rules where selected; the 16 new compositions explicitly offer factor one or two beyond the shadow at that day's meridian transit. That noon reference stays fixed while the afternoon Sun moves. This is an explicit conventional interpretation of the noon-shadow criterion. Raw crossings carry their direction and physical availability; a grazing contact is not silently turned into a crossing.

For the two Diyanet-inspired profiles, `events` contains the **selected** times after the published margins. GPS does not automatically remove Temkin. The profile retains Fajr 0, sunrise −7, Dhuhr +5, Asr +4, Maghrib +7 and Isha 0 minutes. `sunrise` is the profile's adjusted sunrise marker, seven minutes before `astronomy.events.sunrise`, the model's horizon crossing. It is not a prayer-start event. The standard twilight angles are 18° Fajr and 17° Isha. See [the rule evidence](RULES.md) for dates and scope.

| Selected-event status | Meaning |
|---|---|
| `calculated` | An available astronomical event and the implemented profile rule supply an instant. |
| `estimated` | A specifically documented substitution supplies an instant, when implemented. |
| `unavailable` | The required astronomical event cannot be established; no replacement time is invented. |
| `policy-blocked` | The profile needs an unimplemented regional rule or encounters a selected-event order conflict. All selected time fields are null. |

In the original `diyanet-published-point-v1` profile, at and above **44.5° north**, the API can select a bounded subset of ordinary 18°/16° Fajr/Isha crossings using the documented [northern annual guard](NORTHERN-ORDINARY.md). It requires a complete padded year of point calculations and admits only real events strictly outside the declared daily and annual transition bounds. The night endpoints and transit-relative time frame are explicit local conventions; this is not a recovered Diyanet seasonal algorithm. Missing summer events and dates near the unresolved transition remain `policy-blocked`. A raw crossing alone is insufficient.

The two Diyanet-inspired profiles’ northern sunrise/Maghrib use actual preceding/following horizon nights, along with the current day, checked both before and after the published margins. Every relevant interval must exceed five hours. Missing or shorter horizons remain blocked; no replacement endpoints are invented. A failed annual twilight guard does not suppress a separately valid current-day sunrise or Maghrib. Southern missing twilight is not given a mirrored northern rule.

`calculation.northernPolicy` contains the annual guard status, failure reason, parameters and the queried day's evidence. Its padded-year scope is 2002–2097. Up to four computed annual contexts are cached locally; returned diagnostics are detached copies, so caller edits cannot change later results. The first northern query for a point/year computes its annual context, while subsequent day queries reuse it.

When the northern noon Sun is not above the geometric horizon, the documented Asr substitution returns selected Dhuhr as `estimated`, with its reason and rule identifier. It keeps Dhuhr's +5-minute margin, without adding another +4. Other unresolved northern Asr cases stay blocked. Selected instants are checked in chronological order, including across missing intermediate events; only this documented Dhuhr/Asr substitution permits equal instants. The optional summer policy checks its complete padded sequence across nights; a schedule consumer must still preserve chronology when combining years, locations or different profiles.

Every selected event keeps its selected `rawEpochMilliseconds` (fractional for model instants, whole-minute for minute-defined rules), integer `epochMilliseconds`/`utc`, actual `localDate`, and separate nearest-minute display fields. `time` is display rounding, not an alarm cursor. `seconds`, where provided, is model precision, not a guarantee of true prayer onset to the second. Actual event dates can differ from the owning solar-cycle date; no modulo-day conversion conceals that fact. `coverage.complete` means all six selected fields have results under the implemented profile, not institutional approval or guaranteed physical accuracy.

The day API is complemented by [`schedule.mjs`](schedule.mjs), which calculates a bounded 1–31-day local schedule with actual event dates and exports `nextLocalPrayer(schedule, nowEpochMilliseconds)` to select the next event by absolute instant. The browser prototype uses the seven-day schedule to display the next available event in that period. The app requests location only after user action; the operating system timezone is a suggested IANA identifier that the user must verify for the selected point. Platform background execution and mobile alarms remain outside this module.

## Acceptance and limits

The [local validation contract](../../docs/LOCAL-VALIDATION.md) separates astronomical arithmetic, religious-rule coverage, date correctness and optional publisher compatibility. The [verification record](verification.json) records the independent numerical comparison and software checks. Public tests exercise the same rules without network access or calendar tables.

A correctly implemented angle model predicts when its chosen solar condition occurs. It does not establish that one angle captures every observable dawn under all atmospheric conditions. There is no universal seconds-level accuracy claim, and no arbitrary new twilight or polar rule is inferred from a good calendar score.
