# Dated local schedule API

`schedule.mjs` composes one to 31 explicit civil dates from the local point profiles into an offline schedule. It uses the selected profile registry; it does not infer a method from a location, read a device clock, fetch calendars, schedule operating-system alarms, or claim notification approval.

```js
import {calculateLocalSchedule,nextLocalPrayer} from './core/local/schedule.mjs';
import {LOCAL_PROFILE} from './core/local/profiles.mjs';

const schedule=calculateLocalSchedule({
  startDate:'2027-03-25',dayCount:7,
  latitude:41.0082,longitude:28.9784,timeZone:'Europe/Istanbul',profile:LOCAL_PROFILE,
});
const upcoming=nextLocalPrayer(schedule,Date.now());
```

`startDate`, integer `dayCount` (1–31), latitude, longitude, an explicit IANA timezone and a registered profile ID are all required. The date interval must remain within 2001–2098. Invalid inputs fail; an IANA zone that skips a requested civil date produces an unavailable day and a partial schedule so the missing dates remain visible.

The result contains a deterministic `id` and `signature`, a `context` record, sorted `entries`, `missing` prayer starts, per-source-date status rows, and an overall `complete`/`partial` status. Each compact entry ID depends on the calculation version, profile, normalized point, timezone, source-day owner and event; the same event in overlapping windows keeps the same ID. The context signature serializes the schedule format version, calculation version, full immutable profile definition, normalized point, timezone, requested date range, and selected dated event outputs including their local/calendar dates and date offsets. This output fingerprint catches selected changes to the runtime's timezone behavior without guessing at a complete IANA database version. The signature is a cache invalidation key, not a cryptographic integrity hash. Recompute the schedule and compare the signature after a point, profile, timezone, range or calculation-version change. A timezone database/runtime update should also trigger recomputation in the app.

Only events whose profile role is `prayer-start-model` become entries. Sunrise is a marker, not a prayer start. Egypt and FCNA currently define angle-based Fajr/Isha while leaving Dhuhr/Asr/Maghrib as markers, so their schedules are explicitly partial. The `missing` list identifies those marker-only slots and all unavailable or policy-blocked prayer starts with their reasons and source-day ownership. A skipped civil date reports five unavailable prayer-start slots for that source date.

Each entry retains both the selected integer `epochMilliseconds`/UTC string and the model's `rawEpochMilliseconds`; display time never replaces the instant. `sourceDate` is the local date requested from the point-day calculation. `localDate` is the actual local civil date of the selected instant, which can differ for after-midnight Isha. Entries sort by UTC instant, then source date and event order; do not regroup them by displayed clock alone.

`nextLocalPrayer(schedule,nowEpochMilliseconds)` uses the caller's integer UTC epoch and returns a detached copy of the first chronologically sorted, valid prayer-start entry at or after that instant, or `null` when none remains in the requested range. It rejects malformed entries and unsorted schedules rather than returning a marker or trusting a mutated list. It does not read the clock. On a partial schedule it returns the next available scheduled start; inspect `missing` and `status` before presenting the result as a complete prayer plan. This API does not create alarms, run in the background, or certify notification eligibility.
