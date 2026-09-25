# Oman MARA — empirical V2

A bounded empirical reconstruction of calendars published by Oman’s Ministry of Endowments and Religious Affairs. Oman/MARA is not used as a synonym for all Ibadi Muslims.

**Research only — no official endorsement, universal religious coverage or production-ready accuracy is claimed.**

## Run the selected example

Run from the repository root:

```sh
node scripts/run.mjs oman-mara --example
```

The checked-in [example input](examples/input.json) and [computed output](examples/output.json) are numerical examples, not original publisher reference data.

```json
{
  "date": "2026-06-21",
  "latitude": 23.6,
  "longitude": 58.5,
  "timeZone": "Asia/Muscat"
}
```

The uniform entry is [`calculate(options)`](index.mjs). **Default:** empirical V2.

The method index calls the declared selected entry. Use the example command for a complete valid input; method-specific fields are not silently inferred from religious labels.

### Runnable implementations

The underlying signatures remain method-specific. These links point to the code shipped in this snapshot.

| Variant | Module / export |
|---|---|
| `v2` | [`calculateOmanV2`](implementation/v2/candidate.mjs) |

### Inputs and boundaries

- **V2 fixed NOAA UTC12:** `calculateOmanV2(input)`. Input: date,latitude,longitude,timeZone. Limits: 2021–2031;16–27°N,51–60°E; Asia/Muscat; strict own-data fields.

A supported input range is a mathematical contract, not a statement that every location/year in it has been institutionally validated. Check event status, reason and date as well as the clock.

## How the calculation works

For fixed declination δ, cos(H)=(sin(h)−sin(φ)sin(δ))/(cos(φ)cos(δ)); transit±H/15 hours gives a height marker. Transit uses the equation of time and longitude. Continuous variants instead solve h_sun(t)−h_target(t)=0 with direction/domain checks. Asr shadow targets and ephemeris epochs differ by recipe.

- Own NOAA/Meeus solar coordinates at UTC noon; Fajr/Isha 18°, exact−50′ horizon at assumed zero elevation, Asr factor 1.
- Ceil absolute UTC minutes, with +5 minutes for Dhuhr, Asr and Maghrib only. These are global empirical hypotheses, not published MARA parameters.
- V2 was selected from the already declared original parameter grid using 151 known days; the V1 global +1-minute hypothesis and its negative result were retained rather than silently rewritten.

## Special rules and unresolved semantics

- Production points, angles, height, Temkin and rounding remain unconfirmed. Coordinates are unoptimized representative proxies.
- Calendar year is selected by request/form parameters without independent weekday or Hijri proof in the response. A paired July 2026/2027 test found 16 changed clocks but does not prove all backend year semantics.
- An earlier February 2028 response omitted the leap day; that missing date was not replaced or counted as a hit. Current tzdb 2026d supports the tested +04 offset, not future-law certainty.

## Historical validation

These are archived research comparisons, **not results of the public snapshot test suite**. Exact means the displayed minute matches under the stated date interpretation. “Non-exact” is the fraction of comparable values that differ at all; “>1 min” is the fraction outside ±1 minute. Neither is a measured error rate of religious observance. Missing or ambiguous values are excluded from these percentages and remain visible in the last column.

| Study / recipe | Exposure | Exact / comparable | Non-exact | Within ±1 min | >1 min | Max | Excluded / planned |
|---|---|---:|---:|---:|---:|---:|---:|
| v2-known | known development, including earlier V1 holdouts | 504/906 (55.63%) | 44.37% | 906/906 (100.00%) | 0.00% | 1 min | 0/906 |
| v2-new-months | three new monthly responses after V2 freeze | 374/552 (67.75%) | 32.25% | 552/552 (100.00%) | 0.00% | 1 min | 0/552 |

### v2-known

**Recipe:** V2. **Sample:** 151 city-days.

**Compared markers:** Fajr, sunrise, Dhuhr, Asr, Maghrib/sunset, Isha. **Date treatment:** Displayed-minute comparison; source does not supply event-specific UTC instants.

### v2-new-months

**Recipe:** V2. **Sample:** Muscat December 2028, Salalah July 2026, Nizwa April 2027;92 city-days.

**Compared markers:** Fajr, sunrise, Dhuhr, Asr, Maghrib/sunset, Isha. **Date treatment:** Displayed-minute comparison; source does not supply event-specific UTC instants.

- New acquisitions with independently chosen points, but response-year semantics are not fully verified.

Counts, definitions and SHA-256 evidence pins are recorded in [`validation.json`](validation.json). Historical `research/...` strings there are provenance identifiers, not links to files included in this public package. Raw reference calendars are deliberately not bundled; these hashes alone do not let a new reader independently rerun publisher accuracy. Contributions that add lawfully redistributable fixtures or reproducible, authorized acquisition procedures are welcome.

## Sources

- [Ministry calendar frontend](https://www.mara.gov.om/calendar.html)
- [Observed public calendar form response](https://www.mara.gov.om/calendar_page2.asp)
- [Ministry publication context](https://www.mara.gov.om/arabic/pages.aspx?ID=7&MID=27)

Source websites and institution names are cited for attribution, not affiliation. Public access does not automatically allow redistribution. The repository license covers only material identified by its license notices.

## Useful contributions

- Does the backend calculate the requested Gregorian year or use a perpetual/partly year-dependent calendar?
- What precise coordinates, elevations, angles, margins and rounding define the ministry output?
- Can verified leap-year and complete-year references be published with clear reuse rights?

For a proposed numerical change, document the primary rule or bounded hypothesis, preserve the previous results, freeze the recipe and full forecasts before reading new references, and report every planned date, missing value and regression. Keep coordinate/height provenance independent of timing residuals. Do not promote a city-specific fit to a universal method.
