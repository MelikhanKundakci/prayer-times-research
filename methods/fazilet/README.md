# Fazilet — own V2 Temkin and rounding hypothesis

A publisher-specific reconstruction of Fazilet calendars in a bounded Turkish region. This is separate from Türkiye Takvimi/namazvakti.com and is not a generic Hanafi method.

**Research only — no official endorsement, universal religious coverage or production-ready accuracy is claimed.**

## Run the selected example

Run from the repository root:

```sh
node scripts/run.mjs fazilet --example
```

The checked-in [example input](examples/input.json) and [computed output](examples/output.json) are numerical examples, not original publisher reference data.

```json
{
  "date": "2026-06-21",
  "latitude": 41,
  "longitude": 29,
  "timeZone": "Europe/Istanbul"
}
```

The uniform entry is [`calculate(options)`](index.mjs). **Default:** V2 event-specific rounding.

The public wrapper converts its options into the unchanged (date, point) signature.

### Runnable implementations

The underlying signatures remain method-specific. These links point to the code shipped in this snapshot.

| Variant | Module / export |
|---|---|
| `v2` | [`calculateFaziletV2`](implementation/v2/candidate.mjs) |

### Inputs and boundaries

- **V2 event-specific rounding:** `calculateFaziletV2(date, point)`. Input: ISO date and {latitude,longitude,timeZone}. Limits: 2000–2099; latitude 32–45, longitude 25–45; Europe/Istanbul; no operational terrain model.

A supported input range is a mathematical contract, not a statement that every location/year in it has been institutionally validated. Check event status, reason and date as well as the clock.

## How the calculation works

For fixed declination δ, cos(H)=(sin(h)−sin(φ)sin(δ))/(cos(φ)cos(δ)); transit±H/15 hours gives a height marker. Transit uses the equation of time and longitude. Continuous variants instead solve h_sun(t)−h_target(t)=0 with direction/domain checks. Asr shadow targets and ephemeris epochs differ by recipe.

- Own USNO local solar-hour anchors 5/6/12/13/18; Imsak/Fajr-angle 19°, Isha 17°, horizon−1°, Asr factor 1.
- Empirical margins in minutes: Imsak−10, sunrise−7, Dhuhr +10, Asr+10, Maghrib +7, Isha+10. These fixed margins are an unconfirmed reconstruction; institutional text also discusses city height/extent.
- V2 floors Imsak and sunrise, ceils Maghrib and Isha, and rounds Dhuhr/Asr to nearest UTC minute. Sabah is rounded Imsak +20 minutes and remains a distinct later marker.

## Special rules and unresolved semantics

- Sabah is derived, so a seven-column score is not seven independent astronomical observations.
- No posthoc city-specific model choice is applied: V2 improves the largest observed error while exactness is regionally mixed.
- UNGEGN points are not known Fazilet production points. No elevation/terrain correction was fitted; the model remains outside the historical shared API.

## Historical validation

These are archived research comparisons, **not results of the public snapshot test suite**. Exact means the displayed minute matches under the stated date interpretation. “Non-exact” is the fraction of comparable values that differ at all; “>1 min” is the fraction outside ±1 minute. Neither is a measured error rate of religious observance. Missing or ambiguous values are excluded from these percentages and remain visible in the last column.

| Study / recipe | Exposure | Exact / comparable | Non-exact | Within ±1 min | >1 min | Max | Excluded / planned |
|---|---|---:|---:|---:|---:|---:|---:|
| new-geography-primary | three new cities after freeze; same seasonal windows | 385/576 (66.84%) | 33.16% | 576/576 (100.00%) | 0.00% | 1 min | 0/576 |
| new-geography-with-derived-sabah | same original data, additional derived column | 446/672 (66.37%) | 33.63% | 672/672 (100.00%) | 0.00% | 1 min | 0/672 |

### new-geography-primary

**Recipe:** V2. **Sample:** Adana, Diyarbakir, Trabzon; Ramadan 1447 and 23–25 September 2026;96 city-days.

**Compared markers:** Six primary columns: Imsak, sunrise, Dhuhr, Asr, Maghrib, Isha. **Date treatment:** Displayed-minute comparison; source does not supply event-specific UTC instants.

- V1 on the same sources also has 385 exact, but three values differ by 2 minutes.
- No complete-year or new-season validation.

### new-geography-with-derived-sabah

**Recipe:** V2. **Sample:** Same 96 days.

**Compared markers:** Six primary columns plus derived Sabah. **Date treatment:** Displayed-minute comparison; source does not supply event-specific UTC instants.

- V1 has 459/672 exact versus V2’s 446: the larger seven-column exactness score did not improve.
- Adana favors V1 and Diyarbakir V2; there is no automatic city selection.

Counts, definitions and SHA-256 evidence pins are recorded in [`validation.json`](validation.json). Historical `research/...` strings there are provenance identifiers, not links to files included in this public package. Raw reference calendars are deliberately not bundled; these hashes alone do not let a new reader independently rerun publisher accuracy. Contributions that add lawfully redistributable fixtures or reproducible, authorized acquisition procedures are welcome.

## Sources

- [Primary calculation explanation](https://fazilettakvimi.com/hakkimizda/vakitler-nasil-hesaplaniyor/)
- [Primary publisher FAQ](https://fazilettakvimi.com/sikca-sorulan-sorular/muhteva-ile-ilgili-sorular/)
- [Historical publisher Temkin explanation; not a universal current numeric recipe](https://fazilettakvimi.com/sual-ve-cevaplar/10/)
- [Original publisher calendars](https://fazilettakvimi.com/namaz-vakitleri/)

Source websites and institution names are cited for attribution, not affiliation. Public access does not automatically allow redistribution. The repository license covers only material identified by its license notices.

## Useful contributions

- What current operational coordinates, maximum height and city extent are used?
- Are the event-specific rounding directions and Sabah +20 rule confirmed production behavior?
- Can full annual references test the reconstruction beyond the already sampled seasons?

For a proposed numerical change, document the primary rule or bounded hypothesis, preserve the previous results, freeze the recipe and full forecasts before reading new references, and report every planned date, missing value and regression. Keep coordinate/height provenance independent of timing residuals. Do not promote a city-specific fit to a universal method.
