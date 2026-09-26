# Offline Diyanet calendar reconstruction

This small API computes a complete annual context from solar geometry and a supplied location. It runs offline and does not read source calendars or call a service. It is an independent reconstruction: official equivalence and notification eligibility have not been established.

## Use the API

```js
import { createDiyanetCalculator } from './core/diyanet/index.mjs';

const calculator = createDiyanetCalculator();
const day = calculator.calculateDay({
  date: '2026-09-26',
  latitude: 50.1109,
  longitude: 8.6821,
  timeZone: 'Europe/Berlin',
});

console.log(day.events.fajr.time); // nearest calendar minute
console.log(day.events.fajr.seconds); // model time to nearest second

const year = calculator.calculateYear({
  year: 2027, latitude: 50.1109, longitude: 8.6821, timeZone: 'Europe/Berlin',
});
const next = calculator.nextPrayer({
  after: Date.now(), latitude: 50.1109, longitude: 8.6821, timeZone: 'Europe/Berlin',
});
if (next) console.log(next.name, next.prayerDate, next.utc);
```

`calculateDay` accepts `{date, latitude, longitude, timeZone}`. `calculateYear` accepts `{year, latitude, longitude, timeZone}` and returns every Gregorian day, including February 29 in leap years. `nextPrayer` accepts `{after, latitude, longitude, timeZone}`, where `after` is a UTC epoch in milliseconds, and returns the first strictly later prayer event or `null`. It searches neighboring prayer-day rows, so Isha may be owned by one date while occurring after local midnight. Sunrise is not a prayer returned by `nextPrayer`.

All inputs are required. Dates use `YYYY-MM-DD`; years are 2001–2098, latitude is −60° through 75°, and longitude is −180° through 180°. Supply an appropriate IANA time-zone identifier for the point. GPS coordinates do not determine a time zone; an application must obtain that separately. The annual algorithm needs every civil day to have an anchorable solar transit. It throws if the supplied zone and point make a date impossible to anchor—for example, 2026 at latitude 60°, longitude 180°, and `UTC` cannot anchor December 14. A civil date skipped by a time-zone change, such as Apia's 2011-12-30, is also unanchorable.

The optional cache is bounded to four annual calculations by default. Choose a capacity from 0 through 32 with `createDiyanetCalculator({cacheSize})`; zero disables caching. `clearCache()` drops cached years and `cacheInfo()` reports the cache size and calculation count. Returned results are independent values and can be safely modified by the caller.

Use only the documented input fields; extra fields and getters are rejected. The public import has [TypeScript declarations](index.d.mts). It uses JavaScript `Intl` for civil time. Repository commands pin timezone data to **2026d**; an app embedding the module must provide and maintain its runtime's IANA data. The core neither reads the device's default timezone nor requests GPS permission.

The command-line interface calculates one date:

```sh
npm run calculate:diyanet -- 2026-09-26 50.1109 8.6821 Europe/Berlin
npm run calculate:diyanet -- 2026-09-26 50.1109 8.6821 Europe/Berlin --json
```

## Output and precision

Each available event includes its model epoch, integer epoch milliseconds, UTC instant, nearest-minute UTC instant, local event date, rounded calendar date, nearest-minute `time`, nearest-second `seconds`, and the rule used. `time` and `seconds` are separate displays of the same model instant: the former rounds to a minute and the latter to a second. The second display is model precision, not evidence of institutional second-level accuracy. Use the UTC epoch fields for ordering, not display strings. A local event can fall on a different date from its owning calculation row; `dateOffset` and a quality flag make that visible.

| Fields | Meaning |
|---|---|
| `rawEpochMilliseconds` | Fractional, adjusted model instant before display rounding. |
| `epochMilliseconds`, `utc`, `localDate` | Nearest integer millisecond, its exact ISO representation, and its local date. Use this epoch or `Date.parse(utc)` as a `nextPrayer` cursor. |
| `roundedEpochMilliseconds`, `calendarUtc`, `calendarDate`, `time` | Independently rounded calendar minute and its date. |
| `seconds`, `secondsDate` | Independently rounded second and its date. |
| `dateOffset` | Number of civil days from the owning row to `localDate`. |

Missing events keep **all time and date fields null**. `qualityFlags` preserves raw event-order reversals and events on a different civil day without moving them to hide the condition. `nextPrayer` carries the originating day's flags; finding the next model event does not approve it for an alarm. At equal millisecond instants its deterministic tie order is Fajr, Dhuhr, Asr, Maghrib, Isha; the cursor is strictly exclusive.

Events have `status: "calculated"`, `"estimated"`, or `"unavailable"`. Estimated means a declared model policy supplied the event, including northern seasonal estimates or a horizon bound. Unavailable means the required solar crossing does not exist and this route has no supported substitute. In particular, southern missing twilight stays unavailable; the northern replacement rule is not mirrored into the south.

Nearest-minute output uses `floor(epoch / 60000 + 0.5)`, after the model's event adjustment. The unrounded model epoch remains available separately. `official` is always false and `institutionalEquivalence` is `not-established`.

## Calculation outline

The core evaluates the USNO daily solar coordinates at the UTC 00 carrier, derives transit and solar-altitude crossings from latitude, longitude, and declination, then renders each event in the supplied IANA zone. Event adjustments are Fajr 0, sunrise −7, Dhuhr +5, Asr +4, Maghrib +7, and Isha 0 minutes.

Below 44.5° north, the reconstruction uses Fajr at −18°, Isha at −17°, a horizon altitude of −50/60°, and Asr shadow factor 1. The southern route retains real daily crossings and does not invent a twilight replacement. At and above 44.5° north, it reconstructs the archived high-latitude criteria with Fajr at −18°, Isha at −16°, and a minimum five-hour day and night. This 44.5° model split is not an assertion that every Diyanet policy boundary is identical to it.

For a missing Fajr season, let `r` be the last preceding real Fajr day, `R` the adjusted sunrise, `S` the adjusted sunset, and `N = 1440 + R - S` the same-day horizon night, in UTC clock minutes. The inherited ratio is `q = (Fajr[r] + 1440 - S[r]) / (3 N[r])`. Estimates are `Isha = S + qN` and `Fajr = R - qN × 18/16`. Inner transition anchors are the first/last missing Fajr days; outer anchors use fractional crossings of the 20-minute margins. With no missing season, June 21 supplies the ratio anchor, with an angle-only fallback when complete transitions cannot be formed.

The exact ratio operands, 18/16 conversion, transition construction and additional solstice envelope at 60° north and above remain reconstruction choices, not confirmed production details. Northern missing-shadow Asr inherits a Dhuhr substitute and is marked estimated. See [the source criteria and implementation evidence](../../methods/diyanet/RULE-EVIDENCE.md) and the [SPA sensitivity study](../../methods/diyanet/SPA-REFERENCE.md).

The layers are [solar coordinates](astronomy.mjs), [geometric crossings](horizons.mjs), [seasonal rules](seasonal.mjs), [annual assembly](calendar.mjs), and [public rendering/cache/query API](index.mjs). Research can inject a solar provider into `calculateAnnualRaw` without a global override; the public factory deliberately selects the frozen USNO recipe. None of these layers imports an old method implementation.

## Evidence and limits

The unified core preserves the prior baseline at **59 annual locations/years and 129,210 planned event fields**, exactly for both raw instants and nearest-minute outputs. The regression fixtures contain 36 selected rows across the supported routes and cases. This establishes parity with the prior reconstruction; it is not a new comparison against Diyanet calendars and adds no accuracy claim. The independently checked SPA astronomy substitution is a separate, non-selected experiment; it did not improve full-calendar agreement. See the [SPA comparison and its complete result](../../methods/diyanet/SPA-REFERENCE.md), the [verification record](../../methods/diyanet/research/spa-verification-2026-09-26.json), and the [core regression tests](../../tests/diyanet-core.test.mjs).

The [core parity record](verification.json) records both provider runs, input and implementation hashes, and the distinction between the private full forecast and public model-only fixtures. Run `npm test` for the public regression suite. A permission-restricted test proves that this entry point calculates with network and research-data access denied.

No research archives, calendar fixtures, or network access are needed at runtime. The API is suitable as a transparent offline calculation foundation; it does not promise official matching or automatic-notification safety.
