# Civil-date recipe in the standalone core

The existing Pacific date-line improvement is available through the unified day/year/next-prayer API. Version 1.1 introduced it as an explicit option; **version 1.2 now selects it by default**. The historical solar-carrier recipe remains an explicit alternative. These releases integrate previously studied calculation rules and verify them against the full existing corpus; they do not introduce a newly discovered Diyanet rule or a new source holdout.

```js
import {createDiyanetCalculator} from './core/diyanet/index.mjs';

const calculator = createDiyanetCalculator(); // civil-date since version 1.2
const day = calculator.calculateDay({
  date: '2027-01-01',
  latitude: -21.1345386521,
  longitude: -175.223892147,
  timeZone: 'Pacific/Tongatapu',
});
console.log(day.ephemerisDate);        // 2027-01-01
console.log(day.solarTimeCarrierDate); // 2026-12-31
console.log(day.events.fajr.time);
```

The command-line equivalent is:

```sh
npm run calculate:diyanet -- 2027-01-01 -21.1345386521 -175.223892147 Pacific/Tongatapu --civil-date
```

## Default adoption and migration in version 1.2

The public factory and `calculate:diyanet` command now use this already tested rule without an extra option. Historical replay remains available with `createDiyanetCalculator({dateBasis: 'solar-carrier'})` or the new CLI flag `--solar-carrier`. The existing `--civil-date` flag remains valid; conflicting or repeated flags are rejected. The low-level `calculateAnnualRaw` research default and method-specific research entry points remain unchanged.

This choice adopts the scoped comparison below and the antimeridian consistency result. It is not an endorsement of the unknown institutional recipe, a new astronomical formula, or approval for notifications. For callers upgrading from 1.1, outputs can change where the civil row and solar carrier differ; explicitly pin the historical recipe when old outputs are required.

The actual public API was rerun for all 59 existing cases: the new default reproduces all 129,210 frozen civil-date raw and rounded fields, and explicit solar-carrier reproduces all 129,210 historical fields. A separate scorer rechecks both source-date interpretations from those API outputs. The [adoption record](default-verification.json) retains that verification without treating reused observations as a new holdout or adding the two interpretation denominators together.

## What changes mathematically

Let `D` be the requested local calendar date interpreted at UTC00, and `C` the UTC00 carrier that places the solar transit on that local date. `C` is selected using the supplied IANA zone and can differ from `D` by one day.

```text
solar-carrier: coordinates = USNO(C)
civil-date:    coordinates = USNO(D)

transitUTC = C + (12 − longitude/15 − equationOfTimeHours) hours
```

Declination and equation of time come from the same selected daily sample; all hour-angle calculations use that declination. The absolute carrier is preserved, so this is not a final 24-hour shift of a displayed clock. In the northern civil-date recipe, the solstice envelope also uses the civil June 21 row. All twilight angles, minute margins, shadow factor, seasonal ratio/interpolation and rounding rules remain the existing regional recipes.

The rule is generic and contains no city names, table lookups, fitted residuals or network requests. It supports either direction of `C−D`. See the original [low/south candidate](../../methods/diyanet/CIVIL-EPHEMERIS-DATE.md) and [northern extension](../../methods/diyanet/NORTH-CIVIL-ROW.md) for the earlier development and source chronology.

## Complete existing-corpus comparison

The replay covers **59 city-years, 21,535 days and 129,210 planned fields**. Of those fields, 455 original printed zeros remain unresolved; 128,755 are comparable. No new prayer calendars were acquired for this integration.

Only two city-years change. All 57 others retain their computed raw and rounded fields.

| Existing case | Original exact minutes | Civil-date exact minutes | Corrected to exact | Newly one minute away |
|---|---:|---:|---:|---:|
| Apia 2027 | 1,519 / 2,190 (69.36%) | 2,112 / 2,190 (96.44%) | 639 | 46 |
| Nuku'alofa 2027 | 1,299 / 2,190 (59.32%) | 2,174 / 2,190 (99.27%) | 881 | 6 |
| Total change | | **+1,468 exact** | **1,520** | **52** |

Both affected calendars retain all 2,190 fields within one minute. No city/event aggregate loses exactness or within-one-minute coverage. The 52 individual regressions are retained in the assessment rather than hidden by the net gain.

The source-date interpretations remain separate; they describe the same observations and must not be added together:

| Interpretation, all 59 cases | Original exact | Civil-date exact | Within one minute, both | Maximum, both |
|---|---:|---:|---:|---:|
| Printed source date, actual IANA time | 113,122 | 114,590 | 128,493 | 1,443 minutes |
| Conditional evening-cycle placement of Isha | 113,302 | 114,770 | 128,703 | 3 minutes |

The day-scale discrepancies in the first row remain unresolved northern source-date semantics. The second row assumes a particular evening-to-next-dawn ownership for Isha; it is not a verified publisher timestamp. This option does not change those northern comparisons, resolve the original zeros, establish publisher calculation points, or certify notification dates.

Apia was development evidence for the original rule. Nuku'alofa was a separately frozen prospective transfer in that earlier study. Both are already known observations in this release. The [machine-readable integration record](civil-date-verification.json) contains aggregates, provenance hashes and independent review results without redistributing publisher clocks.

## Software and coordinate checks

The standalone calculation uses its own small numerical layers, without importing the older regional implementations. Full-corpus comparisons verify the integrated civil-date recipe against those implementations and preserve the frozen baseline for explicit solar-carrier replay. Public [regression tests](../../tests/diyanet-core-civil-date.test.mjs) additionally cover:

- Complete regional years, source-free Pacific model snapshots and unavailable southern twilight.
- Both `C=D−1` and `C=D+1`, leap years, per-event dates and next-prayer cursor behavior.
- Exact ±180° aliases and nearby ±179.999999° positions across northern, equatorial and southern inputs.
- Separate solar sampling/carrier dates and northern solstice metadata.
- Execution with network, legacy modules and reference tables inaccessible.

Independent stress review covers 96 civil-date annual calculations: four latitudes (−45°, 0°, 60°, 70°), three supplied zones, two years and four antimeridian longitudes. All complete. The 24 exact-alias annual pairs have identical raw instants, rounded instants, statuses and local dates. Nearby pairs differ by at most 0.000480225 seconds, with identical rounded minutes. These are mathematical consistency checks, not additional Diyanet observations. Artificial UTC/antimeridian combinations are included to exercise anchoring, not as realistic timezone assignments.

Both recipes still reject a year containing an unanchorable skipped civil date such as Apia 2011-12-30. The northern estimated rules and known ordering flags remain visible; missing southern twilight is never invented.

## Compatibility note for version 1.1

Version 1.1's default kept all 129,210 frozen baseline fields unchanged; version 1.2 retains that recipe through explicit `solar-carrier` selection. Its northern envelope follows the historical carrier-June-21 convention. Version 1.0 had used civil June 21 in that stage for both routes; the distinction was invisible in its 59-case corpus because every northern case had `C=D`. A full-year regression at the antimeridian verifies the historical carrier convention. The current civil-date default uses the consistently civil June 21 convention.

Neither sampling convention is asserted to be Diyanet's unpublished production procedure or an intrinsically more accurate physical ephemeris. The evidence supports the named compatibility improvement and coordinate consistency; arbitrary GPS positions and worldwide institutional equivalence remain unverified.
