# Separately attributed Shia angle profiles — own geometry

Four named parameter publications with separate provenance. Tehran, Leva, ARC, Jafari and Sistani are not treated as interchangeable names, and none of these angle experiments represents all Shia jurisprudence.

**Research only — no official endorsement, universal religious coverage or production-ready accuracy is claimed.**

## Run the selected example

Run from the repository root:

```sh
node scripts/run.mjs shia-angles --example
```

The checked-in [example input](examples/input.json) and [computed output](examples/output.json) are numerical examples, not original publisher reference data.

```json
{
  "date": "2026-06-21",
  "latitude": 52.5,
  "longitude": 13.4,
  "timeZone": "Europe/Berlin",
  "profileId": "tehran-published-angles-own",
  "engine": "usno"
}
```

The uniform entry is [`calculate(options)`](index.mjs). **Default:** own geometry; profileId and engine remain explicit.

The method index calls the declared selected entry. Use the example command for a complete valid input; method-specific fields are not silently inferred from religious labels.

### Runnable implementations

The underlying signatures remain method-specific. These links point to the code shipped in this snapshot.

| Variant | Module / export |
|---|---|
| `own` | [`calculateDay`](implementation/model.mjs) |

### Inputs and boundaries

- **four attributed profiles with two own ephemerides:** `calculateDay(input)`. Input: date,latitude,longitude,timeZone,profileId,engine: usno|noaa; exactly six fields. Limits: 2000–2099; latitude−90…90, longitude−180…180; explicit IANA; skipped civil dates rejected; pole events unavailable.

A supported input range is a mathematical contract, not a statement that every location/year in it has been institutionally validated. Check event status, reason and date as well as the clock.

## How the calculation works

For fixed declination δ, cos(H)=(sin(h)−sin(φ)sin(δ))/(cos(φ)cos(δ)); transit±H/15 hours gives a height marker. Transit uses the equation of time and longitude. Continuous variants instead solve h_sun(t)−h_target(t)=0 with direction/domain checks. Asr shadow targets and ephemeris epochs differ by recipe.

- tehran-published-angles-own: Fajr 17.7°, Maghrib depression 4.5°, Isha 14°. This is the Adhan 4.4.6 software attribution; an original current IGUT specification was not independently verified.
- leva-published-angles-own: Fajr 16°, Maghrib 4°, Isha 14°, attributed by AlAdhan’s method publication; the original Leva specification remains unverified.
- arc-iran-angles-own: Fajr 18°, Maghrib 4.5°; arc-outside-iran-angles-own: Fajr 18°, Maghrib 3.75°. These come from the primary public ARC client. Isha is unspecified for both ARC profiles.
- Own continuous USNO/NOAA crossing geometry, exact−50′ horizon, nearest UTC minute, no Dhuhr +1 offset and no copied ARC Julian-date bug. Rising roots use previous-transit→transit and setting roots transit→next-transit, so events may legitimately occur on the following civil date.
- Asr is unspecified for all four profiles. The midnight marker is halfway from actual sunset to the following civil day’s Fajr; missing endpoints produce an unavailable marker.

## Special rules and unresolved semantics

- Legal shared prayer windows and ordered performance are not reduced to a fabricated unique Asr or Isha column. Primary Sistani descriptions are semantic references, not fixed-angle certification.
- A real after-midnight Isha root must not be replaced with a same-row daytime result merely to match a library.
- ARC calendars provide local clock strings, not source-asserted UTC instants. Their circular midnight comparisons do not independently validate event-date assignment.
- Known development contains four source/model availability disagreements and source DST anomalies; these are not erased from historical evidence.

## Historical validation

These are archived research comparisons, **not results of the public snapshot test suite**. Exact means the displayed minute matches under the stated date interpretation. “Non-exact” is the fraction of comparable values that differ at all; “>1 min” is the fraction outside ±1 minute. Neither is a measured error rate of religious observance. Missing or ambiguous values are excluded from these percentages and remain visible in the last column.

| Study / recipe | Exposure | Exact / comparable | Non-exact | Within ±1 min | >1 min | Max | Excluded / planned |
|---|---|---:|---:|---:|---:|---:|---:|
| arc-fresh-usno | one new annual original after both-engine freeze | 1,445/2,190 (65.98%) | 34.02% | 2,169/2,190 (99.04%) | 0.96% | 2 min | 0/2,190 |
| arc-fresh-noaa | same one original, second predeclared engine; not extra evidence | 1,440/2,190 (65.75%) | 34.25% | 2,171/2,190 (99.13%) | 0.87% | 2 min | 0/2,190 |
| arc-known-usno | known development across seven annuals | 7,695/14,986 (51.35%) | 48.65% | 14,121/14,986 (94.23%) | 5.77% | 62 min | 356/15,342 |

### arc-fresh-usno

**Recipe:** arc-outside-iran-angles-own, USNO. **Sample:** Kiritimati 2031 complete year.

**Compared markers:** Six ARC columns: Fajr, sunrise, Dhuhr, sunset, Maghrib, midnight; no Asr or Isha. **Date treatment:** Local displayed clocks; midnight circular-clock comparison only, not independently sourced UTC dates.

- All two-minute discrepancies occur in Dhuhr.
- No institution-approved offset or calendar bug was copied into the own model.

### arc-fresh-noaa

**Recipe:** arc-outside-iran-angles-own, NOAA. **Sample:** Kiritimati 2031 complete year.

**Compared markers:** Same six ARC columns. **Date treatment:** Same local-clock/midnight convention.

- No post-acquisition winner selection.

### arc-known-usno

**Recipe:** ARC own USNO. **Sample:** 2557 days; includes source DST/date and availability issues.

**Compared markers:** Six ARC columns. **Date treatment:** Displayed-minute comparison; source does not supply event-specific UTC instants.

- 352 both-missing and four availability mismatches are not hits.
- A separate diagnostic excluding known source DST cells has maximum 16 minutes; the 62-minute primary maximum remains reported.

Counts, definitions and SHA-256 evidence pins are recorded in [`validation.json`](validation.json). Historical `research/...` strings there are provenance identifiers, not links to files included in this public package. Raw reference calendars are deliberately not bundled; these hashes alone do not let a new reader independently rerun publisher accuracy. Contributions that add lawfully redistributable fixtures or reproducible, authorized acquisition procedures are welcome.

## Sources

- [Primary ARC calculator settings and calendar](https://arabic.nojumi.org/prayertimes)
- [Secondary published Tehran software parameters](https://github.com/batoulapps/adhan-js/blob/v4.4.6/src/CalculationMethod.ts)
- [Secondary published Leva attribution](https://api.aladhan.com/v1/methods)
- [Primary Sistani prayer-time rules](https://www.sistani.org/english/book/48/2213/)
- [Primary Sistani legal context](https://www.sistani.org/english/book/48/2209/)
- [Institutional discussion of prayer-time applications](https://imam-us.org/prayer-time-apps)

Source websites and institution names are cited for attribution, not affiliation. Public access does not automatically allow redistribution. The repository license covers only material identified by its license notices.

## Useful contributions

- Can original IGUT/Leva calculation specifications and licensed reference calendars be obtained?
- Can ARC document its server epoch, Dhuhr handling, missing-Fajr behavior and event-day conventions?
- How should distinct legal prayer windows and observational criteria be represented without inventing a single universal angle?

For a proposed numerical change, document the primary rule or bounded hypothesis, preserve the previous results, freeze the recipe and full forecasts before reading new references, and report every planned date, missing value and regression. Keep coordinate/height provenance independent of timing residuals. Do not promote a city-specific fit to a universal method.
