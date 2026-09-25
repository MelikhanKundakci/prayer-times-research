# Umm al-Qura — own astronomical reconstruction

Empirical reproduction of the Saudi institutional calculator’s displayed times at declared points. Global coordinate support does not certify use of a Saudi rule for every community.

**Research only — no official endorsement, universal religious coverage or production-ready accuracy is claimed.**

The [rule evidence audit](RULE-EVIDENCE.md) separates inspected institutional guidance from reconstruction assumptions and identifies the next mathematical gap.

## Run the selected example

Run from the repository root:

```sh
node scripts/run.mjs umm-al-qura --example
```

The checked-in [example input](examples/input.json) and [computed output](examples/output.json) are numerical examples, not original publisher reference data.

```json
{
  "date": "2026-06-21",
  "latitude": 21.4,
  "longitude": 39.8,
  "timeZone": "Asia/Riyadh"
}
```

The uniform entry is [`calculate(options)`](index.mjs). **Default:** strict selected own recipe.

The method index calls the declared selected entry. Use the example command for a complete valid input; method-specific fields are not silently inferred from religious labels.

### Runnable implementations

The underlying signatures remain method-specific. These links point to the code shipped in this snapshot.

| Variant | Module / export |
|---|---|
| `strict` | [`calculateDay`](implementation/api.mjs) |

### Inputs and boundaries

- **own strict wrapper over frozen selected recipe:** `calculateDay(options), calculateYear(options)`. Input: date or year, latitude, longitude, timeZone; selected fixed recipe should be retained. Limits: 2000–2099; finite geographic coordinates; explicit IANA zone; inspect unavailable/ordering/nonphysical status.

A supported input range is a mathematical contract, not a statement that every location/year in it has been institutionally validated. Check event status, reason and date as well as the clock.

## How the calculation works

For fixed declination δ, cos(H)=(sin(h)−sin(φ)sin(δ))/(cos(φ)cos(δ)); transit±H/15 hours gives a height marker. Transit uses the equation of time and longitude. Continuous variants instead solve h_sun(t)−h_target(t)=0 with direction/domain checks. Asr shadow targets and ephemeris epochs differ by recipe.

- Own USNO coordinates. Fajr uses −18.5° with declination/equation of time at UTC noon. Other events use local solar-hour anchor approximations; horizon is literal −0.833° and Asr factor 1.
- No Dhuhr margin; ceil the five prayer markers and floor sunrise to absolute UTC minutes.
- Isha is sunset +90 minutes, or +120 minutes when the source civil row maps to month 9 in ICU islamic-umalqura. The astronomy, anchor and rounding details are empirical hypotheses, not a complete official specification.

## Special rules and unresolved semantics

- Future Ramadan announcements may differ from the ICU tabular mapping; no moon-sighting guarantee is implied.
- No high-latitude religious replacement is selected. A nonpositive Asr target is suppressed; ordering exceptions require explicit handling.
- The institutional API accepts a fixed numeric zone. A fixed-offset source test is not proof of correct local DST behavior.

## Historical validation

These are archived research comparisons, **not results of the public snapshot test suite**. Exact means the displayed minute matches under the stated date interpretation. “Non-exact” is the fraction of comparable values that differ at all; “>1 min” is the fraction outside ±1 minute. Neither is a measured error rate of religious observance. Missing or ambiguous values are excluded from these percentages and remain visible in the last column.

| Study / recipe | Exposure | Exact / comparable | Non-exact | Within ±1 min | >1 min | Max | Excluded / planned |
|---|---|---:|---:|---:|---:|---:|---:|
| six-annual-fresh | fresh after Medina-only development freeze | 11,226/13,152 (85.36%) | 14.64% | 13,091/13,152 (99.54%) | 0.46% | 2 min | 0/13,152 |

### six-annual-fresh

**Recipe:** selected strict Saudi reconstruction. **Sample:** Mecca 2028; Riyadh, Tabuk, Jakarta, Sydney 2027; Cape Town 2028.

**Compared markers:** Fajr, sunrise, Dhuhr, Asr, Maghrib/sunset, Isha. **Date treatment:** Displayed-minute comparison; source does not supply event-specific UTC instants.

- Sydney uses the reference API’s fixed UTC+10, not an Australia/Sydney DST validation.
- Cape Town alone has 61 two-minute values; changing the source API zone exposed additional offset-sensitive one/two-minute behavior that was not copied.
- Source event-specific UTC dates are unavailable.

Counts, definitions and SHA-256 evidence pins are recorded in [`validation.json`](validation.json). Historical `research/...` strings there are provenance identifiers, not links to files included in this public package. Raw reference calendars are deliberately not bundled; these hashes alone do not let a new reader independently rerun publisher accuracy. Contributions that add lawfully redistributable fixtures or reproducible, authorized acquisition procedures are welcome.

## Sources

- [Official calendar website](https://www.ummulqura.org.sa/ar)
- [Official prayer-time frontend](https://www.ummulqura.org.sa/ar/prayer-times)
- [Original Medina calendar publication](https://qm.edu.sa/calendar1447)
- [Original Medina 1447 calendar PDF; separate-format comparison](https://qm.edu.sa/files/PrayerTimes1447AH.pdf)

Source websites and institution names are cited for attribution, not affiliation. Public access does not automatically allow redistribution. The repository license covers only material identified by its license notices.

- Do not copy embedded frontend credentials or claim official API authorization. The calculation uses no network or source calendar at runtime.

## Useful contributions

- Can the institution confirm the Fajr angle/epoch, exact sunrise and prayer rounding, and Ramadan row boundary?
- Are custom-point overseas results intended to use fixed offsets, and why can changing the zone affect more than the clock offset?
- Which elevation, pressure, horizon and polar policies are operational?

For a proposed numerical change, document the primary rule or bounded hypothesis, preserve the previous results, freeze the recipe and full forecasts before reading new references, and report every planned date, missing value and regression. Keep coordinate/height provenance independent of timing residuals. Do not promote a city-specific fit to a universal method.
