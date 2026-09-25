# FCNA — own published-angle profiles

Separate FCNA USA15°/15° and Canada 13°/13° angle profiles. An opt-in Roseville experiment reconstructs one publisher's two twilight start columns at one fixed point. Other event geometry is declared auxiliary mathematics, not an FCNA prescription or proof that every North American mosque uses these rules.

**Research only — no official endorsement, universal religious coverage or production-ready accuracy is claimed.**

## Run the selected example

Run from the repository root:

```sh
node scripts/run.mjs fcna --example
```

The checked-in [example input](examples/input.json) and [computed output](examples/output.json) are numerical examples, not original publisher reference data.

```json
{
  "startDate": "2026-06-21",
  "latitude": 40.7,
  "longitude": -74,
  "timeZone": "America/New_York",
  "profileId": "fcna-usa-15",
  "asr": "standard",
  "numerical": {
    "ephemeris": "usno",
    "rounding": "nearest"
  }
}
```

The uniform entry is [`calculate(options)`](index.mjs). **Default:** own reviewed; numerical={ephemeris:"usno",rounding:"nearest"}; profileId remains explicit.

Public options retain the original input contract; optional numerical:{ephemeris:"usno",rounding:"nearest"} is passed as the separately validated numerical configuration. To run the **separate Roseville experiment**:

```sh
node scripts/run.mjs fcna --input methods/fcna/examples/roseville-input.json
```

Its [input](examples/roseville-input.json) is exactly `{ "variant": "roseville-utc12-ceil", "date": "2026-06-21" }`. Its [generated output](examples/roseville-output.json) contains **Fajr and Isha starts only**. The fixed location comes from a public address geocode, not a confirmed publisher calculation point. Arbitrary coordinates or numerical overrides are rejected for this variant. The generic FCNA model remains the default.

### Runnable implementations

The underlying signatures remain method-specific. These links point to the code shipped in this snapshot.

| Variant | Module / export |
|---|---|
| `own-reviewed` | [`calculateOwnFcnaReviewed`](implementation/asr-review/calculate.mjs) |
| `roseville-utc12-ceil` | [`calculateRosevilleStartTimes`](implementation/roseville.mjs), opt-in fixed-point publisher experiment |

### Inputs and boundaries

- **reviewed continuous own USNO/NOAA; selected published example uses usno/nearest:** `calculateOwnFcnaReviewed(input, configuration)`. Input: startDate,endDate?,latitude,longitude,timeZone,profileId: fcna-usa-15|fcna-canada-13,asr?: standard|hanafi; configuration: ephemeris usno|noaa,rounding nearest|ceil. Limits: 2000–2099; explicit IANA; global coordinate domain; missing twilight and shadow roots are unavailable, with no religious high-latitude replacement.
- **Roseville publisher compatibility only:** `calculateRosevilleStartTimes(date)` accepts a single Gregorian date in 2000–2099 and fixes the Census address proxy at 38.748266781311°N, −121.291128181358°E, `America/Los_Angeles`. It evaluates USNO coordinates at 12:00 UTC on the row date, uses 15°/15° and rounds both event instants upward to whole UTC minutes. It does not calculate Sunrise, Dhuhr, Asr or Maghrib. Its numerical convention is an empirical hypothesis, not an FCNA prescription.

A supported input range is a mathematical contract, not a statement that every location/year in it has been institutionally validated. Check event status, reason and date as well as the clock.

## How the calculation works

For fixed declination δ, cos(H)=(sin(h)−sin(φ)sin(δ))/(cos(φ)cos(δ)); transit±H/15 hours gives a height marker. Transit uses the equation of time and longitude. Continuous variants instead solve h_sun(t)−h_target(t)=0 with direction/domain checks. Asr shadow targets and ephemeris epochs differ by recipe.

- The 2021 primary recommendation specifies Fajr/Isha 15° in the USA and 13° in Canada. A later FCNA-hosted 15° article is discussed separately; it does not explicitly revoke the Canadian 13° recommendation.
- Own continuous USNO or NOAA coordinates, exact−50′ sunrise/sunset horizon, unshifted transit for the auxiliary Dhuhr marker, nearest or explicitly selected ceil UTC-minute rounding.
- Auxiliary Asr factor 1/2 uses the time-varying declination target. The reviewed solver uses a finite algebraic continuation only to find roots, then retains roots with positive noon margin, target altitude and actual solar altitude. This repairs a lost physical polar-boundary root; it adds no polar fatwa.

## Special rules and unresolved semantics

- Only Fajr/Isha have the cited FCNA method evidence. Sunrise, Dhuhr, Asr, Maghrib and rounding assumptions require separate interpretation.
- FCNA's country-specific angle recommendation can inform profile selection, but it does not specify a reproducible timetable engine. The Roseville 15°/15° residuals and limits on transferring its UTC-12/ceil compatibility variant are assessed in [the transferability review](TRANSFERABILITY.md).
- No certified production coordinate is known for the Roseville publisher. Not every US or Canadian calendar is a method-confirmed FCNA reference.
- No method-confirmed Canadian 13°/13° institution calendar has yet validated the Canada profile.
- The annual Roseville download contained only 184 of 365 unique days:181 days/362twilight values were absent. A further 61 days/122 values have a printed-year conflict. The stronger 246-cell cohort below is only the method-and-year-confirmed subset, not the whole planned year.
- The Roseville fixed-UTC12/ceil study is exported as an optional, narrower calculator. It is not the continuous default and cannot support a universal Isha correction. The publisher's calculation point and rounding rule remain unconfirmed.
- On July–October 2025 development values, the fixed candidate raises combined exactness from 106/246 to 195/246, **but Fajr falls from 102/123 to 92/123**. In the year-conflicted November–December 2025-assumed cohort, combined exactness falls 73/122 to 69/122, including Isha 53/61 to 27/61. These regressions constrain where it should be used.

## Historical validation

These are archived research comparisons, **not results of the public snapshot test suite**. Exact means the displayed minute matches under the stated date interpretation. “Non-exact” is the fraction of comparable values that differ at all; “>1 min” is the fraction outside ±1 minute. Neither is a measured error rate of religious observance. Missing or ambiguous values are excluded from these percentages and remain visible in the last column.

| Study / recipe | Exposure | Exact / comparable | Non-exact | Within ±1 min | >1 min | Max | Excluded / planned |
|---|---|---:|---:|---:|---:|---:|---:|
| roseville-method-confirmed | fresh publisher calendar after freeze | 106/246 (43.09%) | 56.91% | 178/246 (72.36%) | 27.64% | 2 min | 0/246 |
| separate-roseville-fixed | fresh same-publisher months after separate diagnostic freeze | 90/122 (73.77%) | 26.23% | 122/122 (100.00%) | 0.00% | 1 min | 0/122 |

### roseville-method-confirmed

**Recipe:** continuous USNO, nearest, USA15/15. **Sample:** Roseville July–October 2025,123 days.

**Compared markers:** Fajr and Isha only. **Date treatment:** Displayed-minute comparison; source does not supply event-specific UTC instants.

- Fajr 102/123 exact and 123≤1; Isha 4/123 exact and 55≤1.
- November/December carry contradictory printed 2024 versus weekday 2025 evidence and are excluded from this stronger cohort.

### separate-roseville-fixed

**Recipe:** Optional exported Roseville USNO UTC12/ceil 15/15 experiment, separate from the generic FCNA model. **Sample:** Roseville March and June 2024,61 days.

**Compared markers:** Fajr Start and Isha Start, separately labeled from Iqama. **Date treatment:** Displayed-minute comparison; source does not supply event-specific UTC instants.

- No new geography and no global FCNA claim.
- The same two publisher months improve from 70/122 exact with the previous continuous/nearest calculation to 90/122 exact with the fixed candidate. Both remain within one minute. Fajr improves 28/61→38/61 and Isha 42/61→52/61. Do not attribute this score to the default continuous model.

Counts, definitions and SHA-256 evidence pins are recorded in [`validation.json`](validation.json). Historical `research/...` strings there are provenance identifiers, not links to files included in this public package. Raw reference calendars are deliberately not bundled; these hashes alone do not let a new reader independently rerun publisher accuracy. Contributions that add lawfully redistributable fixtures or reproducible, authorized acquisition procedures are welcome.

## Sources

- [Primary 2021 FCNA USA/Canada angle recommendations](https://fiqhcouncil.org/the-suggested-calculation-method-for-fajr-and-isha/)
- [Separate later FCNA-hosted discussion](https://fiqhcouncil.org/fifteen-or-eighteen-degrees-calculating-prayer-fasting-times-in-islam/)
- [Primary Roseville calendar with method labels and year inconsistency in later pages](https://www.ispchome.com/downloads/Updated%20Annual%20Prayer%20Times%202025.pdf)
- [Primary method-labeled March 2024 comparison for the separate fixed-epoch study](https://ispchome.com/downloads/ISPC%20March%20Prayer%20times_2024.pdf)
- [Primary June 2024 comparison for that study](https://www.ispchome.com/downloads/ISPC%20June%20Prayer%20times_2024.pdf)
- [US Census address geocode used as the Roseville point proxy](https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=616+Church+Street%2C+Roseville%2C+CA+95678&benchmark=Public_AR_Current&format=json); the `Current` benchmark can change and this is not the publisher's confirmed calculation point.

Source websites and institution names are cited for attribution, not affiliation. Public access does not automatically allow redistribution. The repository license covers only material identified by its license notices.

## Useful contributions

- Can FCNA clarify the relationship between the 2021 country-specific statement and later 15° discussion?
- Which Canadian calendar explicitly implements 13°/13° with known coordinates and rounding?
- Which ephemeris/rounding conventions explain Roseville Isha without undocumented minute offsets?

For a proposed numerical change, document the primary rule or bounded hypothesis, preserve the previous results, freeze the recipe and full forecasts before reading new references, and report every planned date, missing value and regression. Keep coordinate/height provenance independent of timing residuals. Do not promote a city-specific fit to a universal method.
