# Malaysia / JAKIM — own zonal point hypotheses

Several explicitly different zonal reconstructions against e-Solat, with JUPEM coordinate evidence. A nationwide institution label does not establish one immutable point-selection algorithm for every state and year.

**Research only — no official endorsement, universal religious coverage or production-ready accuracy is claimed.**

## Run the selected example

Run from the repository root:

```sh
node scripts/run.mjs jakim --example
```

The checked-in [example input](examples/input.json) and [computed output](examples/output.json) are numerical examples, not original publisher reference data.

```json
{
  "variant": "single-point-own",
  "date": "2026-06-21",
  "zone": "SGR01",
  "timeZone": "Asia/Kuala_Lumpur",
  "candidate": "usno-fixed"
}
```

The uniform entry is [`calculate(options)`](index.mjs). **Default:** single-point-own; explicitly selectable alternatives multipoint, sgr 01-two-point, kdh 03-map-r 19.

Public options.variant selects single-point-own (default), multipoint, sgr 01-two-point or kdh 03-map-r 19. The wrapper fixes the selected recipe/mode and retains the zone/timeZone contract.

### Runnable implementations

The underlying signatures remain method-specific. These links point to the code shipped in this snapshot.

| Variant | Module / export |
|---|---|
| `single-point-own` | [`calculateDay`](implementation/single-point/model.mjs) |
| `multipoint` | [`calculateDay`](implementation/multipoint/model.mjs) |
| `sgr01-two-point` | [`calculateDay`](implementation/two-point/review-independent-model.mjs) |
| `kdh03-map-r19` | [`calculateDay`](implementation/multipoint/map-candidate/model.mjs) |

### Inputs and boundaries

- **single-point-own (ordinary/sunrise reference points can differ):** `calculateDay(input), calculateYear(input)`. Input: date/year,zone,timeZone,candidate: usno-fixed. Limits: Eight zones WLY01, WLY02, SGR01, SGR02, SGR03, PLS01, MLK01, JHR01; numerical domain 2000–2099; institutional coverage is limited to tested 2024–2026 sources and future zone conventions are unconfirmed.
- **multipoint: all published table points:** `calculateDay(input), calculateYear(input)`. Input: date/year,zone,timeZone,mode: all-points-extrema. Limits: PNG01, KDH01, KDH03;2000–2099 numerical domain; Asia/Kuala_Lumpur.
- **SGR01 two-point village-proxy hypothesis:** `calculateDay(input), calculateYear(input)`. Input: date/year,zone: SGR01,timeZone: Asia/Kuala_Lumpur. Limits: 2000–2026 only; fixed point set, no caller GPS.
- **KDH03 table points 15–18 plus shared map point 19:** `calculateDay(input), calculateYear(input)`. Input: date/year,zone: KDH03,timeZone: Asia/Kuala_Lumpur,mode: map-plus-r19. Limits: 2000–2099 numerical domain; fixed map/table hypothesis.

A supported input range is a mathematical contract, not a statement that every location/year in it has been institutionally validated. Check event status, reason and date as well as the clock.

## How the calculation works

For fixed declination δ, cos(H)=(sin(h)−sin(φ)sin(δ))/(cos(φ)cos(δ)); transit±H/15 hours gives a height marker. Transit uses the equation of time and longitude. Continuous variants instead solve h_sun(t)−h_target(t)=0 with direction/domain checks. Asr shadow targets and ephemeris epochs differ by recipe.

- Shared own USNO fixed local solar-hour anchors 5/6/12/13/18/18; Fajr/Isha 18°, exact−50′ horizon, Asr factor 1.
- After selecting the raw point event, floor to whole seconds, add 64 seconds for Dhuhr, then ceil prayer starts and floor sunrise. No height correction or fitted city minutes.
- Multipoint mode uses the latest raw start across all listed points for each prayer and the earliest sunrise. The published primary texts support this kind of zone extrema, but do not certify every point set used in 2026.
- KDH03 map+R19 adds the same extra point for every event, not just sunrise. SGR01 two-point mode takes the latest start over Gedangsa and an explicitly unconfirmed Tg.Rhu village proxy, with Broga retained for sunrise.

## Special rules and unresolved semantics

- WLY02 uses Asia/Kuching; the other listed zones use Asia/Kuala_Lumpur. Callers choose a zone/variant, not an arbitrary GPS point advertised as an official zonal calculation.
- JUPEM2025 coordinates and 2018–2019 interviews are evidence with dates; they do not prove the present production configuration. The 2015 multi-point article must not be reduced to an unverified universal five-point rule.
- Selangor announced preparation for district-based 2027 calendars; historical point contracts must not be extended automatically.
- R19 belongs to a neighboring-zone table while appearing on the shared map boundary. The map inclusion remains a single unconfirmed hypothesis. Tg.Rhu village coordinates are not a certified prayer-calculation station.

## Historical validation

These are archived research comparisons, **not results of the public snapshot test suite**. Exact means the displayed minute matches under the stated date interpretation. “Non-exact” is the fraction of comparable values that differ at all; “>1 min” is the fraction outside ±1 minute. Neither is a measured error rate of religious observance. Missing or ambiguous values are excluded from these percentages and remain visible in the last column.

| Study / recipe | Exposure | Exact / comparable | Non-exact | Within ±1 min | >1 min | Max | Excluded / planned |
|---|---|---:|---:|---:|---:|---:|---:|
| single-new-zones | four new 2026zone downloads after forecast freeze; partial geometry overlap | 7,899/8,760 (90.17%) | 9.83% | 8,748/8,760 (99.86%) | 0.14% | 2 min | 0/8,760 |
| single-new-years | new 2025 year after freeze; same zones | 5,777/6,570 (87.93%) | 12.07% | 6,559/6,570 (99.83%) | 0.17% | 2 min | 0/6,570 |
| multipoint-new-zones | three new 2026zone calendars after freeze | 5,283/6,570 (80.41%) | 19.59% | 6,495/6,570 (98.86%) | 1.14% | 2 min | 0/6,570 |
| map-r19-new-year | new 2025calendar after separate candidate freeze | 1,577/2,190 (72.01%) | 27.99% | 2,190/2,190 (100.00%) | 0.00% | 1 min | 0/2,190 |
| sgr01-new-subset | unexposed subset of a new 2024calendar after freeze | 1,922/2,020 (95.15%) | 4.85% | 2,020/2,020 (100.00%) | 0.00% | 1 min | 0/2,020 |

### single-new-zones

**Recipe:** usno-fixed single-point. **Sample:** SGR01, PLS01, MLK01, JHR01 complete 2026.

**Compared markers:** Fajr, sunrise, Dhuhr, Asr, Maghrib/sunset, Isha. **Date treatment:** Displayed-minute comparison; source does not supply event-specific UTC instants.

- 1825 ordinary SGR01 cells duplicate previously known WLY01 point outputs.
- The nonoverlapping 6935-cell subset has 6366 exact and all within 1; do not treat all 8760 as novel geometry.

### single-new-years

**Recipe:** usno-fixed single-point. **Sample:** SGR01, SGR02, SGR03 complete 2025.

**Compared markers:** Fajr, sunrise, Dhuhr, Asr, Maghrib/sunset, Isha. **Date treatment:** Displayed-minute comparison; source does not supply event-specific UTC instants.

### multipoint-new-zones

**Recipe:** all-points-extrema. **Sample:** PNG01, KDH01, KDH03 complete 2026.

**Compared markers:** Fajr, sunrise, Dhuhr, Asr, Maghrib/sunset, Isha. **Date treatment:** Displayed-minute comparison; source does not supply event-specific UTC instants.

- All 75 two-minute differences are KDH03 sunrise; the map alternative was a later, separately frozen experiment.

### map-r19-new-year

**Recipe:** KDH03 map-plus-r 19. **Sample:** KDH03 complete 2025.

**Compared markers:** Fajr, sunrise, Dhuhr, Asr, Maghrib/sunset, Isha. **Date treatment:** Displayed-minute comparison; source does not supply event-specific UTC instants.

- Not confirmation that R19 is an official current KDH03 calculation point.

### sgr01-new-subset

**Recipe:** SGR01 two-point village proxy. **Sample:** SGR01, excluding 176 previously exposed values.

**Compared markers:** Fajr, sunrise, Dhuhr, Asr, Maghrib/sunset, Isha. **Date treatment:** Displayed-minute comparison; source does not supply event-specific UTC instants.

- The full 2024calendar has 2196 cells; only 2020 were unexposed.
- Do not combine overlapping variant tests into one overall accuracy rate.

For KDH03, the 75 two-minute differences in the 2026 table-points comparison are all sunrise values, with the model two minutes later than e-Solat. A separately frozen map-plus-R19 hypothesis reduces the 2026 development comparison to a maximum one-minute difference (1,599/2,190 exact; all within ±1 minute). On the complete 2025 e-Solat year acquired after that freeze, it also stays within ±1 minute (1,577/2,190 exact). The 2025 calendar is a temporal holdout for the same zone, not an independent zone or a confirmation of the production point list. In the 2026 three-zone table-points comparison, PNG01 and KDH01 are entirely within ±1 minute; this does not validate untested zones or the transferred astronomical and rounding assumptions. R19 appears near the Zone 3/4 boundary on the JUPEM map but is tabulated under Zone 4; its use in KDH03 remains an optional, unconfirmed research variant. The opt-in implementation is linked in the table above; the full frozen investigation remains in the private research workspace.

Counts, definitions and SHA-256 evidence pins are recorded in [`validation.json`](validation.json). Historical `research/...` strings there are provenance identifiers, not links to files included in this public package. Raw reference calendars are deliberately not bundled; these hashes alone do not let a new reader independently rerun publisher accuracy. Contributions that add lawfully redistributable fixtures or reproducible, authorized acquisition procedures are welcome.

## Sources

- [Primary JAKIM calendar service](https://www.e-solat.gov.my/)
- [Primary 2025 coordinate tables and maps](https://www.jupem.gov.my/storage/upload/almanak/almanak2025-1732247258.pdf)
- [Primary multi-point research article, dated 2015](https://www.islam.gov.my/images/ePenerbitan/jurnal_falak_bil1_2015.pdf)
- [Original 2020 research interviews on actual state methods](https://ejournal.um.edu.my/index.php/RIS/article/download/27353/12400/61519)
- [Selangor institutional method explanations](https://www.muftiselangor.gov.my/soalan-lazim/)
- [Primary notice of preparations for 2027 zone/district changes](https://www.muftiselangor.gov.my/2026/02/12/bengkel-penyelarasan-takwim-waktu-solat-negeri-selangor-tahun-2027/)

Source websites and institution names are cited for attribution, not affiliation. Public access does not automatically allow redistribution. The repository license covers only material identified by its license notices.

## Useful contributions

- Can each state provide versioned operational zone polygons and final JUPEM prayer-reference points?
- Is shared map point 19 operational for KDH03, and which events use it?
- What is the measured Tg.Rhu calculation point, distinct from the village proxy?
- Which year-specific instructions confirm the 64-second Dhuhr adjustment, rounding order and extrema policy?

For a proposed numerical change, document the primary rule or bounded hypothesis, preserve the previous results, freeze the recipe and full forecasts before reading new references, and report every planned date, missing value and regression. Keep coordinate/height provenance independent of timing residuals. Do not promote a city-specific fit to a universal method.
