# Independent local-profile verification

This source-free verification checks the parameterized physical kernel and four explicit local profiles against an independently assembled Python oracle. It verifies implementation of the declared equations and conventions. It does **not** establish observed solar accuracy, institutional approval, or agreement with an institution's published calendars.

The Python implementation imports the existing independent [physical oracle](oracle.py) for USNO coordinates, altitude evaluation, meridian roots and crossing searches. [profiles-oracle.py](profiles-oracle.py) independently assembles the parameterized event targets and profile minute arithmetic. It does not import or execute JavaScript. The original oracle and [139-case fixture](oracle-fixtures.json) remain unchanged; every old Python result, including scan extrema, was exactly reproduced by the new default parameterization.

## Declared parameters

| Profile | Fajr depression | Isha depression | Horizon depression | Asr shadow factor |
| --- | ---: | ---: | ---: | ---: |
| Egypt published angles | 19.5° | 17.5° | 50/60° | 1 |
| FCNA USA 2017 | 15° | 15° | 50/60° | 1 |
| FCNA Canada 2017 | 13° | 13° | 50/60° | 1 |
| Kemenag worked example | 20° | 18° | 1° | 1 |

The fixed-noon Asr equation is `cot(h_asr) = factor + cot(h_transit)`. Independent geometry-only cases also exercise factor two. No new institution profile silently selects that factor.

Egypt and FCNA preserve the physical instants. Their Fajr/Isha values carry the role `prayer-start-model`; the other four events are explicit geometric markers. Their displayed calendar times round the unchanged instants to the nearest minute. They have no Diyanet Temkin, northern substitution or automatic geographical selection.

Kemenag's bounded local worked-example adaptation uses raw continuous physical events, then selects whole-minute values: Fajr, Asr, Maghrib and Isha use ceil plus two minutes; Dhuhr uses ceil plus three minutes; sunrise uses floor minus two minutes. It exposes no seconds display for those minute-defined values. The selected point is restricted to latitude −12° through 8°, longitude 94° through 142°, and the four declared Indonesian zones. These checks do not validate the missing Imsak or Dhuha rules or claim a nationwide current-production engine.

## Frozen grid

The [fixture](profiles-fixtures.json) contains **284** declared cases:

- 219 Egypt/FCNA cases: each profile on 12 points at four seasons and a leap date, plus 13 date/ownership boundaries. Points include Cairo, New York, Edmonton, Jakarta, Sydney, Oslo, Tromsø, the equator, McMurdo, both antimeridian aliases and Tonga.
- 40 Kemenag cases: Jakarta, Pontianak, Makassar, Jayapura and all four geographic box corners, each on those five dates.
- 25 factor-two physical cases: Cairo, Edmonton, Sydney, Tromsø and McMurdo, each on those five dates.

Boundary cases include Cairo, New York and Toronto DST transitions, New Year, Apia's skipped date and synthetic mismatched point/zone inputs with zero or two owned transits. The nine absent/ambiguous ownership cases are expected errors; they are not omitted. Explicitly unavailable crossings remain unavailable, including polar events. The new profiles never inherit the Diyanet northern annual policy.

The physical layer covers **1,558 calculated events**, **92 unavailable fields** and **550 cycle boundaries** across 275 uniquely owned cycles. The profile layer covers **1,430 selected events**, including **240 Kemenag minute-defined values**. Every selection's status, role, raw astronomical basis, selected UTC instant and calendar minute is checked. A selected chronological conflict must remain blocked rather than silently moved.

There are also **228** independent minute-arithmetic fixtures: six events, two policies and 19 instants covering exact boundaries, small displacements on either side, negative epochs and half-minute boundaries. Because integral minute offsets commute with floor and ceil, these cases cannot distinguish applying an integral offset before versus after rounding. A separate test uses synthetic fractional margins solely to verify the generic selector's declared operation order; those margins are not attributed to any prayer profile.

Expected data were frozen before comparison with the new JavaScript implementation. The fixture SHA-256 is:

```text
6ee2c65e77a1497713cfa178c6fc91a068d972f8adfe5c569ffca13514c6b250
```

## Reproduce

From the repository root:

```sh
python3 core/local/verification/profiles-oracle.py
TZ=UTC node core/timezones/with-tzdata.mjs core/local/verification/profiles-verify.mjs
TZ=UTC node core/timezones/with-tzdata.mjs --test tests/local-profiles-oracle.test.mjs
```

The first command regenerates only the new synthetic profile fixture. It also recomputes exact default parity against the unchanged original Python oracle. It requires Python 3.9+ and an installed IANA ZoneInfo database. The frozen file used system ZoneInfo **2026c.1.0**; the JavaScript checks use the project's pinned Node/ICU/tzdb wrapper. Timezone agreement is established for these declared cases rather than assumed across every version and place.

[profiles-verify.mjs](profiles-verify.mjs) exports `verifyLocalProfiles()`. It returns compact counts, tolerances, maximum differences, the fixture hash and executing runtime versions; it throws on a mismatch and writes no files. The maximum accepted unrounded root difference is **0.1 seconds**. Minute-defined Kemenag selections and calendar-minute values must match exactly. This numerical tolerance measures consistency between implementations, not physical accuracy to a tenth of a second.

The recorded run on Node 26.7.0 / ICU 78.3 / tzdb 2026d passed. The maximum physical and selected-instant discrepancy was **0.000020504 seconds**, and the maximum cycle-boundary discrepancy was **0.000015975 seconds**. All 240 Kemenag minute selections and all 1,430 calendar minutes matched exactly. The profile fixtures included 70 explicitly unavailable selected fields and no selected-order conflicts; they do not establish that arbitrary accepted inputs can never produce such a conflict. Both focused regression tests passed.

The independent Python scanner supplements ten-minute brackets with stationary-point searches. It is a bounded numerical check of the declared cases, not a general theorem that every possible solar crossing is found. Both implementations use the same published approximate USNO model, standard level-horizon conventions, and no terrain or observer-height observations.
