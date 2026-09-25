# Egyptian Survey Authority — own USNO branch

A regional reconstruction compared with Egyptian Survey Authority (ESA) calendars, with separately documented Egyptian Dar al-Ifta angle evidence.

**Research only — no official endorsement, universal religious coverage or production-ready accuracy is claimed.**

## Run the selected example

Run from the repository root:

```sh
node scripts/run.mjs egyptian-survey --example
```

The checked-in [example input](examples/input.json) and [computed output](examples/output.json) are numerical examples, not original publisher reference data.

```json
{
  "date": "2026-06-21",
  "latitude": 30.05,
  "longitude": 31.25,
  "timeZone": "Africa/Cairo"
}
```

The uniform entry is [`calculate(options)`](index.mjs). **Default:** usno-no-offset; regional validation at the public wrapper.

Public options are date, latitude, longitude and timeZone:"Africa/Cairo". The wrapper fixes usno-no-offset and enforces 22–32°N,24–37°E,2000–2099.

### Runnable implementations

The underlying signatures remain method-specific. These links point to the code shipped in this snapshot.

| Variant | Module / export |
|---|---|
| `usno-no-offset` | [`calculateDay`](implementation/calculate.mjs) |

### Inputs and boundaries

- **usno-no-offset; selected arithmetic is own USNO:** `calculateDay(date, location, id)`. Input: ISO date; {latitude,longitude,timeZone}; id: usno-no-offset. Limits: Common strict API restricts 2000–2099,22–32°N,24–37°E and Africa/Cairo; the historical raw module has weaker validation.

A supported input range is a mathematical contract, not a statement that every location/year in it has been institutionally validated. Check event status, reason and date as well as the clock.

## How the calculation works

For fixed declination δ, cos(H)=(sin(h)−sin(φ)sin(δ))/(cos(φ)cos(δ)); transit±H/15 hours gives a height marker. Transit uses the equation of time and longitude. Continuous variants instead solve h_sun(t)−h_target(t)=0 with direction/domain checks. Asr shadow targets and ephemeris epochs differ by recipe.

- USNO declination/equation of time sampled at local solar-hour anchors 5/6/12/13/18/18.
- Fajr 19.5°, Isha 17.5°, exact−50′ horizon, Asr factor 1, no Dhuhr offset; nearest UTC minute.
- The angle evidence is primary; the horizon, ephemeris sampling, no-offset choice and rounding are reconstruction assumptions.

## Special rules and unresolved semantics

- ESA operational coordinates and elevation are unknown; comparisons used disclosed city proxies.
- The historical module eagerly imports Adhan for a separate comparison branch even when the own USNO branch is selected. The clean public implementation must transparently document any extraction of that unused dependency.
- No polar fallback, nationwide production certification or full-year validation is established.

## Historical validation

These are archived research comparisons, **not results of the public snapshot test suite**. Exact means the displayed minute matches under the stated date interpretation. “Non-exact” is the fraction of comparable values that differ at all; “>1 min” is the fraction outside ±1 minute. Neither is a measured error rate of religious observance. Missing or ambiguous values are excluded from these percentages and remain visible in the last column.

| Study / recipe | Exposure | Exact / comparable | Non-exact | Within ±1 min | >1 min | Max | Excluded / planned |
|---|---|---:|---:|---:|---:|---:|---:|
| development | known development | 1,349/1,620 (83.27%) | 16.73% | 1,620/1,620 (100.00%) | 0.00% | 1 min | 0/1,620 |
| fresh-seasonal | new same-institution months after freeze | 299/366 (81.69%) | 18.31% | 366/366 (100.00%) | 0.00% | 1 min | 0/366 |

### development

**Recipe:** usno-no-offset. **Sample:** 270 distinct city-days; eight city-months and additional daily pages.

**Compared markers:** Fajr, sunrise, Dhuhr, Asr, Maghrib/sunset, Isha. **Date treatment:** Displayed-minute comparison; source does not supply event-specific UTC instants.

### fresh-seasonal

**Recipe:** usno-no-offset. **Sample:** Aswan April 2026 and Alexandria December 2026,61 city-days.

**Compared markers:** Fajr, sunrise, Dhuhr, Asr, Maghrib/sunset, Isha. **Date treatment:** Displayed-minute comparison; source does not supply event-specific UTC instants.

- No independent institution or official production-coordinate certification.
- The source UI/month handling was observed; this is not a general multiyear API contract.

Counts, definitions and SHA-256 evidence pins are recorded in [`validation.json`](validation.json). Historical `research/...` strings there are provenance identifiers, not links to files included in this public package. Raw reference calendars are deliberately not bundled; these hashes alone do not let a new reader independently rerun publisher accuracy. Contributions that add lawfully redistributable fixtures or reproducible, authorized acquisition procedures are welcome.

## Sources

- [ESA original daily calendar](https://www.esa.gov.eg/praytimes.aspx)
- [ESA original monthly calendar](https://www.esa.gov.eg/monthlymwaket.aspx)
- [Primary Egyptian angle explanation](https://www.dar-alifta.org/ar/fatwa/details/13816/فتوى-دار-الإفتاء-المصرية-في-توقيت-الفجر)
- [Source redistribution restrictions](https://www.esa.gov.eg/copyrights.aspx)
- [Source usage terms](https://www.esa.gov.eg/TERMSOFUSE.aspx)

Source websites and institution names are cited for attribution, not affiliation. Public access does not automatically allow redistribution. The repository license covers only material identified by its license notices.

- Publicly readable does not mean freely redistributable. Do not bundle ESA original calendar tables under the code license.

## Useful contributions

- What exact city points, heights, ephemeris, safety minutes and rounding does ESA use?
- Can reference data be obtained under an explicit reusable license?
- Can a complete year and independent future season validate the frozen own recipe?

For a proposed numerical change, document the primary rule or bounded hypothesis, preserve the previous results, freeze the recipe and full forecasts before reading new references, and report every planned date, missing value and regression. Keep coordinate/height provenance independent of timing residuals. Do not promote a city-specific fit to a universal method.
