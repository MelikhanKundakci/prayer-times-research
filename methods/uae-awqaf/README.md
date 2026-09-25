# UAE Awqaf / SZGMC — regional reconstructions

An experimental UAE city-region calculation using archived vendor location metadata and primary Awqaf/SZGMC calendars. Vendor column interpretation is not confirmed production configuration.

**Research only — no official endorsement, universal religious coverage or production-ready accuracy is claimed.**

The [rule evidence audit](RULE-EVIDENCE.md) separates inspected institutional guidance from reconstruction assumptions and identifies the next mathematical gap.

## Run the selected example

Run from the repository root:

```sh
node scripts/run.mjs uae-awqaf --example
```

The checked-in [example input](examples/input.json) and [computed output](examples/output.json) are numerical examples, not original publisher reference data.

```json
{
  "date": "2026-06-21",
  "latitude": 24.45,
  "longitude": 54.38,
  "elevationMeters": 0,
  "cityWidthKm": 0,
  "pressureMillibars": 1010,
  "temperatureCelsius": 10,
  "timeZone": "Asia/Dubai"
}
```

The uniform entry is [`calculate(options)`](index.mjs). **Default:** strict V2 standard-atmosphere recipe. The opt-in `own-ray` variant adds our own near-horizon refraction integral; the separate native/PAL V3 runtime remains excluded.

Public options carry date plus the explicit point metadata. The wrapper selects V2 or the additive own-ray experiment, not the more general diagnostic model.

### Runnable implementations

The underlying signatures remain method-specific. These links point to the code shipped in this snapshot.

| Variant | Module / export |
|---|---|
| `v2` (default) | [`calculateCandidateStrict`](implementation/api.mjs) |
| `own-ray` (opt-in) | [`calculateOwnRayCandidate`](implementation/own-ray/candidate.mjs) |

### Inputs and boundaries

- **V2 selected standard-atmosphere candidate:** `calculateCandidateStrict(date, point)`. Input: ISO date; point has latitude,longitude,elevationMeters,cityWidthKm,pressureMillibars,temperatureCelsius,timeZone. Limits: 2000–2099;22–27°N,51–57°E; elevation 0–1500m, width 0–100km, P800–1100mb, T−10…60°C; Asia/Dubai.

A supported input range is a mathematical contract, not a statement that every location/year in it has been institutionally validated. Check event status, reason and date as well as the clock.

## New own-ray experiment

The [own-ray implementation and study](OWN-RAY.md) improve exact agreement from **6,840 to 7,239 of 9,684** already exposed comparison fields and remove all **398** two-minute differences. All remaining differences in that sample are one minute. It corrects 883 values and regresses 484 previously exact values. A later [pre-frozen February 2027 source comparison](FEBRUARY-2027-TRANSFER.md) adds 504 new fields from the same three regions: 353→375 exact, 487→504 within one minute, with all 17 two-minute V2 misses eliminated and no city/event-group loss. It changes sunrise and Maghrib only, requires no API, PAL, native executable or reference calendars, and preserves the default V2 calculation pending broader independent validation.

```sh
node scripts/run.mjs uae-awqaf --input methods/uae-awqaf/examples/own-ray-input.json
```

## How the default V2 calculation works

For fixed declination δ, cos(H)=(sin(h)−sin(φ)sin(δ))/(cos(φ)cos(δ)); transit±H/15 hours gives a height marker. Transit uses the equation of time and longitude. Continuous variants instead solve h_sun(t)−h_target(t)=0 with direction/domain checks. Asr shadow targets and ephemeris epochs differ by recipe.

- Own iterative USNO solar coordinates and event geometry. Fajr/Isha 18°; east-shift the morning calculation point by cityWidthKm along its latitude parallel; other events use the west/base point.
- Sunrise/sunset altitude is −(16′ solar radius +34′ standard refraction + geometric dip), with dip=acos(R/(R+height)) and R=6371000m.
- Asr factor 1 uses apparent noon shadow and iterated event refraction through the published NOAA approximation. Dhuhr +2min, no Asr minute margin, nearest UTC minute.
- The selected standard-atmosphere branch does not scale refraction by the supplied pressure/temperature fields. Those fields are preserved metadata, not tuned controls in the selected recipe.

## Special rules and unresolved semantics

- Only three vendor-mapped regions and selected months have been tested. PDF identity is tied to the observed UI selection, not assumed from unlabeled PDF content.
- This is not Accurate Times’ claimed Hohenkerk/Sinclair implementation. Elevation, city width and field schema are independently sourced/inferred, not fitted to calendar minutes.
- A later V3 native Starlink PAL GPL study is excluded from this public executable. Its better result must never be attributed to V2.

## Historical validation

These are archived research comparisons, **not results of the public snapshot test suite**. Exact means the displayed minute matches under the stated date interpretation. “Non-exact” is the fraction of comparable values that differ at all; “>1 min” is the fraction outside ±1 minute. Neither is a measured error rate of religious observance. Missing or ambiguous values are excluded from these percentages and remain visible in the last column.

| Study / recipe | Exposure | Exact / comparable | Non-exact | Within ±1 min | >1 min | Max | Excluded / planned |
|---|---|---:|---:|---:|---:|---:|---:|
| v2-fresh | six new monthly PDFs after V2 freeze | 778/1,098 (70.86%) | 29.14% | 1,054/1,098 (95.99%) | 4.01% | 2 min | 0/1,098 |
| excluded-v3-study | six new monthly PDFs after separate V3 freeze | 825/1,098 (75.14%) | 24.86% | 1,098/1,098 (100.00%) | 0.00% | 1 min | 0/1,098 |

### v2-fresh

**Recipe:** V2 selected standard atmosphere. **Sample:** Abu Dhabi, Al Ain and Zayed; April 2025 and October 2026;183 city-days.

**Compared markers:** Fajr, sunrise, Dhuhr, Asr, Maghrib/sunset, Isha. **Date treatment:** Displayed-minute comparison; source does not supply event-specific UTC instants.

- Same three regions, new seasons; not new geography.
- Abu Dhabi 337/366 exact, all≤1; Al Ain 220/366 and 333≤1; Zayed 221/366 and 355≤1.

### excluded-v3-study

**Recipe:** EXCLUDED V3 with native GPL PAL; not this executable. **Sample:** Same three regions; January 2025 and November 2026.

**Compared markers:** Fajr, sunrise, Dhuhr, Asr, Maghrib/sunset, Isha. **Date treatment:** Displayed-minute comparison; source does not supply event-specific UTC instants.

- Historical result from excluded GPL/native implementation only.
- On these same later sources V2 had 791 exact/1049 within 1/max 2.

Counts, definitions and SHA-256 evidence pins are recorded in [`validation.json`](validation.json). Historical `research/...` strings there are provenance identifiers, not links to files included in this public package. Raw reference calendars are deliberately not bundled; these hashes alone do not let a new reader independently rerun publisher accuracy. Contributions that add lawfully redistributable fixtures or reproducible, authorized acquisition procedures are welcome.

## Sources

- [Original SZGMC institutional calendar](https://www.szgmc.gov.ae/images/calendar/HijriBook1445_en.pdf)
- [Original public calendar frontend](https://www.awqaf.gov.ae/prayer-times)
- [Accurate Times author documentation and software context](https://astronomycenter.net/accut.html?l=en)
- [Primary NOAA refraction approximation used by V2](https://gml.noaa.gov/grad/solcalc/calcdetails.html)

Source websites and institution names are cited for attribution, not affiliation. Public access does not automatically allow redistribution. The repository license covers only material identified by its license notices.

- V2 and the own-ray JavaScript experiment are executable in this public package. The historical V3 native/PAL runtime is not included. Original vendor assets and calendar PDFs are not relicensed by this repository.

## Useful contributions

- Can the publisher confirm current region west/east points, height and city extent?
- What exact apparent-altitude/refraction convention and atmosphere are used for each event?
- Can new independent calendars and confirmed settings test the own-ray experiment beyond its exposed three-region sample?

For a proposed numerical change, document the primary rule or bounded hypothesis, preserve the previous results, freeze the recipe and full forecasts before reading new references, and report every planned date, missing value and regression. Keep coordinate/height provenance independent of timing residuals. Do not promote a city-specific fit to a universal method.
