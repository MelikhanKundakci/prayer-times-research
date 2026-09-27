# Diyanet criteria with a separate local summer and winter policy

`diyanet-local-seasonal-spa-v1` extends the unchanged `diyanet-published-spa-point-v1` point calculation. It preserves every available strict-profile event and adds eligible northern Fajr/Isha values under the local rules below. It computes offline, without a city table, calendar feed, fitted time correction or prayer API.

**This is a declared project interpretation, not Diyanet's recovered complete seasonal algorithm.** The published ordinary criteria and margins remain the basis. Annual night endpoints, the Fajr candidate and transition curve are explicit local choices already documented in the [original seasonal model](SEASONAL.md). The new version uses the same SPA solar provider as the current strict Diyanet point calculation and adds a separately justified [winter admission](DIYANET-WINTER-PROOF.md).

## Selection order

1. Compute the existing strict SPA point result. Keep every available event exactly, including its instant, rounding, status and evidence. Sunrise, Dhuhr, Asr and Maghrib never receive a new value from this extension.
2. Additional seasonal/winter selection is limited to northern latitude at least 44.5° and years 2002–2097. Outside that extension range, retain the strict profile's values and gaps. The API retains the base 2001–2098 input range for adjacent-day schedule padding.
3. Inspect missing twilight in the padded annual context. Only a proven continuously-above-threshold absence may support this extension. A tangent, unresolved root or date-ownership failure is not interpreted as summer absence.
4. If the original full annual context and seasonal preflight pass, apply the independently tested SPA version of the local night-fraction rule below to previously blocked Fajr/Isha.
5. If the sole annual failure is the five-hour horizon gate, consider the separate winter proof. Keep all required annual ratios, candidates and extrema; require the relevant day and neighboring-night horizon gates and both ordinary-event bounds. This never enables the summer estimator under a failed annual gate.
6. Check newly admitted values against neighboring selected events. Failed selections retain empty time fields. The shared schedule adds its cross-day ordering checks and preserves estimated statuses.

## Local summer equations

The base northern criterion uses raw −18° Fajr and −16° Isha. Let `M` be selected Maghrib and `R` the following selected sunrise, including their existing +7/−7-minute margins. All durations use elapsed UTC instants, not differences between local clock displays.

```text
H = R − M
q = (raw anchor Fajr − preceding selected Maghrib) / (3 × anchor H)
Isha candidate = M + qH
next Fajr candidate = R − (11/8)qH
```

The anchor is the last real Fajr before one contiguous summer absence window, or June 21 when real Fajr exists throughout the year. The ratio is frozen for the source year. It is **not** the annual average used by the separate MWL method. Every required raw and selected day/night interval in the annual+padded context must be strictly longer than five hours for summer selection.

Within the existing 20-minute raw/candidate bands, use cubic smoothstep `w = 3x² − 2x³` and `selected = raw + w(candidate − raw)`. Outside those bands retain the raw event or use the candidate as specified in [SEASONAL.md](SEASONAL.md). Blends and candidates are marked `estimated`. Newly admitted unchanged physical roots remain `calculated`. The `11/8` choice is the local effective-night interpretation; it does not purport to solve the source's unspecified extra-two-degree conversion.

Both seasonal sign boundaries must reach the candidate before a root disappears or reappears. Required New Year boundary events remain ordinary. Every selected annual night must have ordered Maghrib, Isha, next Fajr and sunrise. Polar horizons and days/nights at or below the required horizon bound are not supplied by this summer model.

## Winter admission

The frozen ordinary guard can reject an entire year because its shortest summer night is too short. The new winter branch addresses **only that dependency**. It requires an otherwise complete annual context and the original direct and annual transition inequalities, together with the current and neighboring physical horizons. It never converts a blocked context into an available seasonal context. See the [proof and conditions](DIYANET-WINTER-PROOF.md) for exactly what is admitted.

This can restore physical winter times while leaving the same location's unsupported summer times empty. It is a proof relative to our declared local eligibility policy, not a claim about Diyanet's undisclosed production decisions.

## App and API

The browser's automatic Diyanet settings select **Diyanet criteria + local summer rule** and explain that the added rule is ours. **Advanced settings → turn off automatic settings → Short nights → No estimates** restores the unchanged strict SPA profile. Other calculation families keep their own rules. The standalone API accepts an explicit profile ID:

```js
import {calculateDiyanetLocalDay, calculateDiyanetLocalSchedule} from './diyanet-local.mjs';

const day = calculateDiyanetLocalDay({
  date: '2027-06-21', latitude: 50.1109, longitude: 8.6821,
  timeZone: 'Europe/Berlin', profile: 'diyanet-local-seasonal-spa-v1',
});
```

```sh
npm run calculate:local -- 2027-06-21 50.1109 8.6821 Europe/Berlin diyanet-local-seasonal-spa-v1
```

The result keeps raw astronomy separately from selected events. Its policy metadata records the base profile, SPA provider, annual ratio/anchor, failure reasons and selected day trace. Full-year preparation can take several seconds at a new point/year; caches are bounded and returned traces are detached.

## Reproducible examples

These are this model's rounded local-clock outputs, not official Diyanet timetable values. An asterisk marks an estimate; a dash means the selected policy supplies no event.

| Point and date | Fajr | Dhuhr | Asr | Maghrib | Isha |
| --- | --- | --- | --- | --- | --- |
| Frankfurt, 50.1109°N 8.6821°E, Europe/Berlin, 2027-06-21 | 03:22* | 13:32 | 17:51 | 21:46 | 23:03* |
| Oslo, 59.9139°N 10.7522°E, Europe/Oslo, 2027-01-15 | 06:28 | 12:31 | 13:39 | 15:56 | 18:09 |
| Same Oslo point, 2027-06-21 | — | 13:24 | 18:04 | — | — |

The strict SPA profile leaves Frankfurt's two summer twilight values empty. The local extension supplies the declared summer estimates. Oslo demonstrates the separate winter branch: real winter twilight can be admitted without enabling the unsupported summer or horizon rules. No fixed minute correction was fitted to either location.

## Verification contract

The [predeclared plan](verification/diyanet-local-plan-2026-09-27.md) fixes the full-year locations, date boundaries, independent formula reconstruction and transition acceptance checks. The verifier shares the already checked low-level SPA solar solver but does not reuse the seasonal or winter selector as its expected-value calculation. These checks establish software behavior under the declared rules, not official-calendar agreement or observed-twilight accuracy.

```sh
node core/timezones/with-tzdata.mjs scripts/verify-diyanet-local.mjs
```

## Measured result — 2026-09-27

The [independent report](verification/diyanet-local-2026-09-27.json) passed all 12 predeclared city-years and three control years. Its [evidence tests](../../tests/diyanet-local-evidence.test.mjs) pin the report and the complete numerical dependency closure, including the timezone resources. Runtime: Node 26.7.0, ICU 78.3, pinned IANA tzdb 2026d. The full replay is CPU-intensive and takes several minutes; it logs progress after each case. `--focused-smoke` runs the latitude-boundary and independent winter proof checks first without issuing a full annual PASS report.

**The table measures availability under the declared rules, not prayer-time accuracy or agreement with Diyanet.** Each annual row includes all 1,096 days of 2026–2028 at the fixed coordinates in the plan. Complete means all six ordered events, including the sunrise marker, are available; all five prayer starts are therefore available too.

| Point, 2026–2028 | Strict SPA complete days | Local extension complete days | Estimated Fajr events | Estimated Isha events |
| --- | ---: | ---: | ---: | ---: |
| Frankfurt | 618 / 1,096 | 1,096 / 1,096 | 378 | 441 |
| Berlin | 578 / 1,096 | 1,096 / 1,096 | 408 | 482 |
| Bordeaux | 710 / 1,096 | 1,096 / 1,096 | 81 | 207 |
| Edinburgh | 522 / 1,096 | 1,096 / 1,096 | 453 | 537 |
| **Total** | **2,428 / 4,384** | **4,384 / 4,384** | **1,320** | **1,667** |

The extension supplies 1,956 additional Fajr and 1,804 additional Isha events in these annual cases. Of those 3,760 additions, 2,987 are estimates and 773 are unchanged physical roots admitted by the local policy. Every previously available strict event is preserved exactly.

| Control, 2027 | Strict complete days | Local complete days | Interpretation |
| --- | ---: | ---: | --- |
| Oslo | 0 / 365 | 152 / 365 | 152 real Fajr and 163 real Isha events admitted; unsupported dates remain explicit gaps |
| Tromsø | 0 / 365 | 0 / 365 | Partial strict results retained; no invented horizon events or new twilight estimates |
| Istanbul | 365 / 365 | 365 / 365 | Ordinary lower-latitude behavior retained |

The report checks 8,768 independent twilight candidate/selection traces and 17,536 independently reconstructed non-twilight values in the annual cases. The maximum candidate, smoothstep-selection and published-margin arithmetic differences are all **0 ms** in this replay, using the shared low-level SPA solver. This is implementation agreement, not measured astronomical accuracy. The 4,396 annual and 1,098 control night checks retain incomplete nights in their denominators and check chronology whenever all required events exist. There were no chronology assertion failures.

Across 8,744 adjacent annual twilight pairs, the largest absolute change relative to raw solar transit is **7.5607 minutes**, for Frankfurt Isha from April 8 to April 9, 2026. It satisfies the predeclared 10-minute bound, but is not a claim of sub-minute transitions. All 16 explicitly reported New Year seams pass; their largest absolute change is 0.4928 minutes. The report also records 106 seasonal mode/status boundaries and the exact representable neighbors of 44.5°N.

These results cover the listed coordinates and years. They do not establish global completeness, exact official-calendar reproduction, terrain-aware sunrise/sunset, or observed religious-time accuracy. In particular, Oslo's unresolved dates and Tromsø's incomplete year remain visible limitations of this profile.
