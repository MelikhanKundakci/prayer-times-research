# Missing twilight: a 45° reference-night option

This is an **opt-in local adaptation of a dated council rule**, available with the MWL and Egyptian angle families. It does not reproduce a current national calendar, the complete MWL policy, or Diyanet's summer procedure. The default profiles still use their existing rules.

## Source and scope

The MWL Islamic Fiqh Council's 1986 resolution and 2007 clarification describe proportional estimation when twilight signs disappear between 48° and 66° north or south, recommending a 45° reference. Existing late signs and personal hardship concessions are discussed separately. [Dar al-Ifta's 2012 republication](https://www.dar-alifta.org/ar/fatwa/details/13433/حكم-الجمع-في-البلاد-التي-تنعدم-فيها-العلامات) supplies the relevant text; [Saudi Press Agency](https://www.spa.gov.sa/497737?lang=ar&newsid=497737) reports the council clarification.

Offering this option with Egyptian angles reflects that cited ruling; it does **not** identify the Egyptian Survey Authority's production fallback. Likewise the common MWL 18°/17° software angles are not established by the council's high-latitude text. Neither source specifies our complete coordinate-to-time implementation.

The later [IAC/MWL 2009 local-relative method](https://astronomycenter.net/latitude.html?l=ar) uses a different ratio and transitions. It is not implemented by these profile IDs. See the [eight-family special-rule audit](SPECIAL-RULES.md) for the distinction.

## Exact local conventions

The new module [`sunni-reference.mjs`](sunni-reference.mjs) wraps the unchanged physical Sunni calculation. Profile IDs are:

```text
sunni-mwl-shadow1-reference45-v1
sunni-mwl-shadow2-reference45-v1
sunni-egyptian-shadow1-reference45-v1
sunni-egyptian-shadow2-reference45-v1
```

The implementation deliberately fixes details the ruling does not fully specify:

1. The reference point has latitude +45° in the north or −45° in the south, the user's longitude, the same supplied IANA timezone and the same source civil dates. It is a geometric reference point, not a chosen city.
2. Use the family's ordinary Fajr/Isha angles, SPA geocentric calculation and flat −50-arcminute horizon at both points. Reference horizon events have no prayer margins.
3. A Fajr night runs from the **previous source date's sunset to the current source date's sunrise**. An Isha night runs from the **current sunset to the next source date's sunrise**. Durations are elapsed UTC milliseconds, never differences of wrapped clock strings.
4. A real twilight crossing always wins. Only a proven seasonal absence can trigger estimation, and only at absolute latitude 48°–66° inclusive. Numerical failures, absent horizons and invalid reference intervals do not become estimated times.
5. If the reference twilight is not strictly inside a valid actual reference night, no ratio is available. The selected estimate must also lie inside the actual target night and preserve the prayer sequence.
6. Keep the existing profile's other four events unchanged. Display nearest minutes, optionally model seconds; extra digits do not improve religious or observational certainty.

For a reference sunset `Sᵣ`, sunrise `Rᵣ`, twilight event `Tᵣ`, and the corresponding local sunset `S` and sunrise `R`:

```text
Isha fraction = (Tᵣ − Sᵣ) / (Rᵣ − Sᵣ)
Isha estimate = S + Isha fraction × (R − S)

Fajr fraction = (Rᵣ − Tᵣ) / (Rᵣ − Sᵣ)
Fajr estimate = R − Fajr fraction × (R − S)
```

Fajr and Isha use their own angles and own adjacent nights; they do not share an annual average. No angle/60 cap or five-minute transition is mixed into this policy.

## Dates, transitions and limits

The supported core date range remains 2001–2098. Missing boundary events that require an adjacent date outside that range remain blocked. The app exposes a narrower date range to leave room for its seven-day schedule.

An absence-only replacement can jump on the date a physical sign disappears or returns. This implementation does not conceal that discontinuity by blending physical and estimated events. The verification report measures those jumps; it cannot establish that this option is the user's community's adopted practice.

Latitude alone is never proof that a sign is absent. Ordinary events outside the estimate's scope remain calculated normally. At polar day/night, actual local horizon endpoints can be absent; this option does not manufacture them or implement the council's separate all-day policy above 66°.

Outputs retain the raw physical astronomy. Estimated entries carry their status, reason, source attribution and reference-night selection trace. The schedule retains that status and uses the existing cross-day Isha/Fajr ordering check. No prayer API, timetable or stored city correction is used at runtime.

## Use

```sh
npm run calculate:local -- 2027-06-21 50.1109 8.6821 Europe/Berlin sunni-mwl-shadow1-reference45-v1
```

```js
import {calculateReferenceDay, calculateReferenceSchedule} from './core/local/sunni-reference.mjs';
import {listAvailableMethods} from './core/local/methods.mjs';

const day = calculateReferenceDay({
  date: '2027-06-21', latitude: 50.1109, longitude: 8.6821,
  timeZone: 'Europe/Berlin', profile: 'sunni-mwl-shadow1-reference45-v1',
});
```

`listAvailableMethods()` returns the current app catalogue including this option. The older `listSunniMethods()` remains the frozen catalogue for its published verification run. No older numerical modules or pinned historical reports are replaced.

In the browser, choose **MWL** or **Egyptian**, then **Short nights → 45° reference night · missing twilight only**. The choice is explicit; changing language or seconds display preserves it.

## Verification

The focused tests exercise the independent night arithmetic, real-event preservation, hemisphere and latitude scope, unavailable horizons, date boundaries and dated schedules. The reproducible [annual and boundary report](verification/reference45-2026-09-27.json) measures coverage and transitions against the unchanged physical profiles. It is an implementation check, **not an official-calendar or observed-twilight accuracy percentage**.

The 2027 grid evaluates **7,300 profile-days / 43,800 event fields**: five public demonstration points, two angle families and both Asr factors, for every day of the year. It also evaluates 192 boundary rows and 20 ten-day schedules. Physical Fajr/Isha and the other four events retain their existing values. Independent reference-night arithmetic uses separately calculated physical event instants rather than copying the estimator's selection trace.

| Public point, 2027 | MWL: physical-only complete days | MWL: with selected estimates | Egyptian: physical-only complete days | Egyptian: with selected estimates |
|---|---:|---:|---:|---:|
| Frankfurt | 323 / 365 | 365 / 365 | 305 / 365 | 365 / 365 |
| Berlin | 296 / 365 | 365 / 365 | 283 / 365 | 365 / 365 |
| Edinburgh | 269 / 365 | 365 / 365 | 259 / 365 | 365 / 365 |
| Oslo | 244 / 365 | 365 / 365 | 235 / 365 | 365 / 365 |
| Ushuaia | 283 / 365 | 365 / 365 | 273 / 365 | 365 / 365 |

Both tested Asr factors have the same coverage in this table. The added values are **estimates**, not recovered local twilight observations. Across both factors the grid contains 3,268 estimated event fields; those fields do not acquire an official-calendar accuracy score.

**The series is not smooth at every seasonal boundary.** In Oslo, the MWL Fajr switch on 22→23 April 2027 changes the normalized UTC time by approximately **2 h 33 min 34 s**; Egyptian Fajr on 25→26 August changes it by approximately **2 h 41 min 44 s** in the opposite direction. These are measured maxima in this grid, not worldwide upper bounds. The change is from retaining a physical sign on one date and using the chosen reference estimate on the adjacent date. This option remains an explicit research choice, not an automatic recommendation for summer notifications. The separate [2009-inspired local-relative profiles](LOCAL-RELATIVE.md) now provide their own checked transition policy; they do not smooth or change this frozen reference-night recipe.

A focused regression also uses a declared synthetic northern-coordinate / `Africa/Casablanca` timezone pairing on 7 July 2013 to put missing twilight across a historical clock rollback. The actual UTC night is one hour longer than the difference of local clock readings. The test rejects the resulting wrong-clock candidate, which would move this Fajr estimate by over 15 minutes. That synthetic case is a time-arithmetic check, not a claim about geography or an official Moroccan schedule.

```sh
node core/timezones/with-tzdata.mjs scripts/verify-reference45.mjs
npm test
npm run check
```

The full annual replay takes several minutes. The normal test suite checks the retained report's code, runner and timezone pins as well as focused regressions.
