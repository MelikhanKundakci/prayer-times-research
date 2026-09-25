# Northern civil-row calculation: repairing an antimeridian discontinuity

**The explicit `north-civil-row` variant removes a representation-dependent jump at the antimeridian in the tested northern calculations.** It preserves every raw event object for the 28 previously studied northern city-years. This is a numerical consistency improvement, not a new measurement of agreement with Diyanet. The experimental `north-missing-window` default remains unchanged.

## The defect

Longitude −180° and +180° describe the same meridian. At latitude 60°, using `Asia/Anadyr` for both inputs, the previous northern model produces 1,699 different rounded event fields in 2027 and 1,692 in 2028. Its largest raw differences are approximately 267.267 and 256.827 seconds respectively. These are differences between two calculations at the same position, **not measured errors against an institutional calendar**.

The same jump occurs between nearby positions −179.999999° and +179.999999°. Merely normalizing the exact number +180 would hide the alias problem while leaving the nearby discontinuity.

The cause is the interaction of two dates:

- `D`: the requested local civil date.
- `C`: the UTC midnight used as the carrier for absolute solar-event timestamps.

The original model samples its daily solar coordinates at `C` UTC00. Depending on the longitude representation, its noon anchoring chooses `C=D−1` or `C=D`. The two representations therefore use different solar declination and equation-of-time values. Its solstice envelope also selects the row whose **carrier** says June 21, while the seasonal helper's no-gap anchor already uses civil June 21.

The [carrier audit](research/north-carrier-audit-2026-09-25.json) preserves the model-only probes. At identical Berlin and Narvik coordinates, local-zone versus UTC controls produce the same UTC events in 2027 and 2028: ordinary daylight-saving presentation does not explain their autumn residuals.

## Explicit calculation change

The new variant keeps the absolute carrier `C`, but evaluates the daily USNO approximation at **requested civil date `D` UTC00**. It also chooses **civil June 21** consistently for the solstice envelope. Changing only the ephemeris date would leave a one-day discrepancy in that envelope reference.

All twilight angles, horizon substitutions, fixed daily Asr calculation, margins, night quotient, seasonal interpolation and minute rounding remain the existing missing-window recipe. The seasonal helper is imported unchanged. This extends the previously published [low-latitude and southern civil-row hypothesis](CIVIL-EPHEMERIS-DATE.md); that southern calendar evidence is not claimed as validation of the northern extension.

```js
import {calculate} from './methods/diyanet/index.mjs';

const calendar = calculate({
  variant: 'north-civil-row',
  year: 2027,
  latitude: 60,
  longitude: -180,
  timeZone: 'Asia/Anadyr',
});
```

The strict input domain remains 2001–2098 and 44.5–75° north, with finite longitude in [−180,180] and an explicit IANA timezone. These are mathematical input limits, not a geographic accuracy certificate. Unsupported seasonal contracts preserve unavailable slots; invalid inputs and civil dates that cannot be anchored remain errors.

Each row exposes `ephemerisDate` separately from `solarTimeCarrierDate`. The legacy `solarCalculationDate` remains an alias for the carrier, not the ephemeris sampling date. The reconstruction metadata separately records civil and carrier solstice dates.

The uniform selector and `calculateNorthernCivilRow` use the [ordering review adapter](implementation/north-civil-row/quality-model.mjs). It preserves every computed instant and flags reversed event order, including raw reversals hidden by minute rounding. `calculateNorthernCivilRowRaw` is the explicitly named native export without that adapter. No route enables automatic notifications.

## Verification and limits

The [frozen model-only verification](research/north-civil-row-verification-2026-09-25.json) establishes:

| Check | Result |
|---|---|
| Previously studied 28 northern city-years with `C=D` | All 10,220 days and 61,320 raw event objects unchanged |
| Exact ±180° aliases, latitude 60°, `Asia/Anadyr`, 2027/2028 | Zero raw or rounded differences |
| Nearby ±179.999999° inputs on the same full years | At most 0.000480225 seconds; zero rounded differences |
| Berlin/Narvik local-zone versus UTC controls | 8,772 identical raw/rounded event comparisons |
| Previously supported model-only stress annuals | All 30 remain calculable |

Four additional artificial UTC/antimeridian stress annuals that previously failed noon anchoring now calculate. This does not certify their physical accuracy. The separate [independent review](research/north-civil-row-independent-review-2026-09-25.json) broadens the seam tests to four latitudes, three zones and two years, and verifies the public ordering adapter. None of these model-to-model comparisons is an additional institutional reference observation.

The public [regression suite](../../tests/diyanet-north-civil-row.test.mjs) checks complete annual alias/nearby pairs, all 28 historical input-year replays, metadata, domain/ownership checks, ordering flags, and computation with network and calendar-file reads denied under two host zones. The [relocation manifest](research/north-civil-row-relocation-2026-09-25.json) records import-only transfers of the three numerical modules. The historical source map and default modules remain intact.

Civil-row UTC00 sampling is still a convention for an approximate daily ephemeris; it is not intrinsically a more accurate physical solver. Unknown institutional points, source event-date conventions, seasonal endpoint errors and high-latitude policy remain unresolved. The [autumn endpoint study](AUTUMN-ENDPOINTS.md) is separate: this repair does not improve those unchanged European comparisons.
