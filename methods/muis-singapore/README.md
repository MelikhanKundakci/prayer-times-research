# Singapore / MUIS — own continuous USNO candidate

A fixed-region astronomical candidate compared with MUIS calendars published through Singapore’s official data portal. The inherited angle/margin preset is software evidence, not a complete MUIS specification.

**Research only — no official endorsement, universal religious coverage or production-ready accuracy is claimed.**

## Run the selected example

Run from the repository root:

```sh
node scripts/run.mjs muis-singapore --example
```

The checked-in [example input](examples/input.json) and [computed output](examples/output.json) are numerical examples, not original publisher reference data.

```json
{
  "date": "2026-06-21",
  "region": "SG",
  "timeZone": "Asia/Singapore"
}
```

The uniform entry is [`calculate(options)`](index.mjs). **Default:** own continuous USNO, fixed SG region.

The method index calls the declared selected entry. Use the example command for a complete valid input; method-specific fields are not silently inferred from religious labels.

### Runnable implementations

The underlying signatures remain method-specific. These links point to the code shipped in this snapshot.

| Variant | Module / export |
|---|---|
| `usno-continuous` | [`calculateSingaporeCandidate`](implementation/candidate.mjs) |

### Inputs and boundaries

- **own continuous USNO:** `calculateSingaporeCandidate(input)`. Input: date,region: SG,timeZone: Asia/Singapore. Limits: 2000–2099; fixed UNGEGN point 1.28716598445°N/103.862396307°E; arbitrary caller coordinates rejected.

A supported input range is a mathematical contract, not a statement that every location/year in it has been institutionally validated. Check event status, reason and date as well as the clock.

## How the calculation works

For fixed declination δ, cos(H)=(sin(h)−sin(φ)sin(δ))/(cos(φ)cos(δ)); transit±H/15 hours gives a height marker. Transit uses the equation of time and longitude. Continuous variants instead solve h_sun(t)−h_target(t)=0 with direction/domain checks. Asr shadow targets and ephemeris epochs differ by recipe.

- Own continuous USNO solar coordinates and directed height crossings; Fajr 20°, Isha 18°, exact−50′ horizon.
- Asr factor 1 uses the declination at solar transit for the noon-shadow target. Dhuhr +60 seconds; ceil all six UTC-minute markers, including sunrise.
- Angles and margin originate from the Adhan Singapore preset as a secondary software publication. They must not be relabeled as independently confirmed MUIS production rules.

## Special rules and unresolved semantics

- Only the fixed Singapore region is offered. Numerical date support is wider than the three tested source years.
- All available 2024–2026 calendars were already known before selecting this own candidate; no fresh holdout is claimed.
- The later [prospective 2027 annual comparison](PROSPECTIVE-2027.md) froze the full local forecast before a normally accessible official PDF was read. A predeclared Ramadan Maghrib diagnostic removes its ten two-minute differences, but is not a documented MUIS rule or part of this default calculator. A follow-up of general Maghrib, rounding and ephemeris alternatives found no validated general correction; see [the residual review](MAGHRIB-RESIDUAL-REVIEW.md).

## Historical validation

These are archived research comparisons, **not results of the public snapshot test suite**. Exact means the displayed minute matches under the stated date interpretation. “Non-exact” is the fraction of comparable values that differ at all; “>1 min” is the fraction outside ±1 minute. Neither is a measured error rate of religious observance. Missing or ambiguous values are excluded from these percentages and remain visible in the last column.

| Study / recipe | Exposure | Exact / comparable | Non-exact | Within ±1 min | >1 min | Max | Excluded / planned |
|---|---|---:|---:|---:|---:|---:|---:|
| known-three-years | development only; all originals already exposed | 4,608/6,576 (70.07%) | 29.93% | 6,556/6,576 (99.70%) | 0.30% | 2 min | 0/6,576 |
| prospective-2027, unchanged default | full forecast frozen before official PDF rows | 1,531/2,190 (69.91%) | 30.09% | 2,180/2,190 (99.54%) | 0.46% | 2 min | 0/2,190 |
| prospective-2027, predeclared diagnostic | same forecast and source; +1 Maghrib on separately published Ramadan dates | 1,551/2,190 (70.82%) | 29.18% | 2,190/2,190 (100%) | 0% | 1 min | 0/2,190 |

### known-three-years

**Recipe:** own continuous USNO. **Sample:** MUIS2024–2026,1096 days.

**Compared markers:** Fajr, sunrise, Dhuhr, Asr, Maghrib/sunset, Isha. **Date treatment:** Displayed-minute comparison; source does not supply event-specific UTC instants.

- The old Adhan comparator had 4541 exact and 6559 within 1: own geometry gains 67 exact but introduces three additional two-minute mismatches.
- At the time this older 2024–2026 study was first reported, no new calendar had been acquired. A separate [2027 study](PROSPECTIVE-2027.md) later acquired an official PDF after freezing all predictions; it must not be pooled with these known development counts.

Counts, definitions and SHA-256 evidence pins are recorded in [`validation.json`](validation.json). Historical `research/...` strings there are provenance identifiers, not links to files included in this public package. Raw reference calendars are deliberately not bundled; these hashes alone do not let a new reader independently rerun publisher accuracy. Contributions that add lawfully redistributable fixtures or reproducible, authorized acquisition procedures are welcome.

## Sources

- [Official dataset collection](https://data.gov.sg/datasets?resultId=2312&sort=updatedAt)
- [Official dataset metadata](https://api-production.data.gov.sg/v2/public/api/collections/2312/metadata)
- [Institutional calendar publication](https://www.muis.gov.sg/resources/islamic-calendar/)
- [Source data license and attribution requirements](https://data.gov.sg/open-data-licence)
- [Secondary preset publication, not a MUIS specification](https://github.com/batoulapps/adhan-js/blob/v4.4.6/src/CalculationMethod.ts)

Source websites and institution names are cited for attribution, not affiliation. Public access does not automatically allow redistribution. The repository license covers only material identified by its license notices.

## Useful contributions

- What are MUIS’s current calculation point, horizon, rounding and safety margins?
- Can a complete new year be obtained before any further model selection?
- Do source parameters differ from the public software preset?

For a proposed numerical change, document the primary rule or bounded hypothesis, preserve the previous results, freeze the recipe and full forecasts before reading new references, and report every planned date, missing value and regression. Keep coordinate/height provenance independent of timing residuals. Do not promote a city-specific fit to a universal method.
