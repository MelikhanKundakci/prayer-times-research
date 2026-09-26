# Optional northern seasonal point profile

`local-northern-seasonal-v1` is a separate, opt-in local policy for northern summer twilight. It can return ordinary, blended, or ratio-based estimated Fajr/Isha values when real sunrise and sunset still exist and the full annual horizon checks pass. It does **not** reconstruct Diyanet's unpublished seasonal algorithm. The source criteria leave several implementation details open; this page names the choices made by this profile so its output is deterministic and reviewable.

The existing `diyanet-published-point-v1` profile remains unchanged and continues to policy-block unsupported northern seasonal events. This optional profile does not change the ordinary profile's meaning or claim source equivalence. It is not a religious ruling, a certified timetable, proof of observed superiority, notification approval, or a promise of second-level accuracy.

## Source criteria and local choices

The archived detailed criteria specify true Fajr at −18°, true Isha at −16°, Isha at Maghrib plus one-third night when real Isha is later than that point, determined Fajr at sunrise minus one-third plus two-sixteenths when real Fajr is earlier, use of a frozen night ratio after real Fajr disappears, a gradual 20-minute transition, a June 21 anchor where real Fajr exists all year, and real horizons only when day/night exceeds five hours. See the public [Diyanet rule evidence](../../methods/diyanet/RULE-EVIDENCE.md) and [Awqatsalah's published criteria](https://www.awqatsalah.com/sub/18/calculation-criteria).

The source does not fully define religious/customary night endpoints, the transition blend, how its missing-Fajr “2 degree difference” converts to time, or the construction of horizons below five hours. This profile therefore makes the following choices:

| Item | `local-northern-seasonal-v1` rule |
|---|---|
| Scope | Seasonal replacement applies at and above 44.5°N; elsewhere this profile inherits the ordinary point rules. The detailed criteria state 44.5°; a newer Diyanet summary describes 45°N and above. This software scope does not claim to be the current universal Diyanet boundary. |
| Annual coverage | Validate every civil date in the year and one padded date on each side. Only years 2002–2097 are supported for this annual calculation. Any invalid/skipped date, failed or non-unique transit, missing required horizon, or failed annual dependency blocks the annual seasonal twilight selection. |
| Horizon gate | Every raw and selected daylight interval and every actual adjacent raw and selected horizon night must be strictly longer than five hours for all annual+padded dates. Use selected sunrise/Maghrib with their published margins; never invent polar sunrise/sunset endpoints. |
| Night variables | In UTC instants, `M` is selected Maghrib, `R` is next selected Sunrise, `H = R − M`, and `N = next raw −18° Fajr − M` where real Fajr exists. This selected-Maghrib/selected-sunrise night is an explicit local convention, not a source definition. |
| Annual ratio | If raw Fajr exists all year, set `q = N/(3H)` from the night anchored on June 21. If one contiguous summer gap removes the raw Fajr crossing, freeze `q` from the last real-Fajr night before that gap. Use this one `q` for the whole annual candidate curve. Multiple/disjoint gaps or no valid anchor block the profile. |
| Isha candidate | `I = M + qH`. This follows the published one-third ratio using the named local night. A missing −16° crossing may use `I` only when the solver proves a seasonal absence and annual continuity checks pass. |
| Fajr candidate | `F = R − (11/8)qH`. This applies the source's ordinary `1/3 + 2/16 = 11/24` proportion using an **effective candidate night** `N_eff = 3qH`, which need not equal the actual real-Fajr night `N`. It is an explicit local summer fallback; it is **not** a conversion of the source's separate missing-Fajr “2 degree difference” phrase. |
| Transition | Use the one-sided 20-minute raw/candidate separation ramps defined below with cubic smoothstep. The source says transition is gradual and gives 20-minute onset statements, but not this blend function. |
| Missing/reappearing twilight | Only a physically proven seasonal absence can use a candidate as an estimated event. There must be one contiguous absence window per event. The last raw event before absence and first raw event after reappearance must already select the candidate endpoint; otherwise the annual profile is blocked to prevent a jump. Numerical/bracketing failures are not seasonal absence. |
| Output status | Pure raw crossings are `calculated`. Every candidate selection or blended time is `estimated`, including when a raw crossing still exists. Missing horizons, unsupported gaps, or chronology conflicts remain null and `policy-blocked`; no time is clamped into order. |

This policy supplies a fully specified annual selection model where its real-horizon and boundary checks pass. The Fajr candidate is a deliberate local choice because the published missing-Fajr rule's extra two degrees are not specified as a time duration in the retained criteria. The profile must never describe that candidate as Diyanet's missing-Fajr formula.

## Exact transition equations

All events are compared as UTC epoch instants, without wrapping across midnight. Let `smooth(x) = 3x² − 2x³` on `0 ≤ x ≤ 1`; let `lerp(a,b,w) = a + w(b−a)`.

For Isha, let `Ir` be the raw −16° event and `I` the candidate:

```text
Ir ≤ I − 20 min:       select Ir (calculated)
Ir ≥ I:                select I  (estimated)
otherwise:             x = (Ir − I + 20 min) / 20 min
                       select lerp(Ir, I, smooth(x)) (estimated)
```

For Fajr, let `Fr` be the raw −18° event and `F` the candidate:

```text
Fr ≥ F + 20 min:       select Fr (calculated)
Fr ≤ F:                select F  (estimated)
otherwise:             x = (F + 20 min − Fr) / 20 min
                       select lerp(Fr, F, smooth(x)) (estimated)
```

The smoothstep weight makes each one-sided transition continuous and keeps every result between its raw and candidate instants. Equality at the decision boundary selects the candidate. If the raw event is absent, select a candidate only when the annual context classifies that date as a proven seasonal absence and the horizon/edge checks pass; otherwise leave it blocked. After blending, apply ordinary chronology checks and block any conflict.

## Annual boundary and night-order checks

Four selected twilight events must remain exactly at their raw instants: Isha on the preceding December 31, Fajr on the owned January 1, Isha on the owned December 31, and Fajr on the following January 1. Otherwise annual seasonal twilight is blocked. This ensures a change of annual `q` cannot change the boundary-night selections. The unavailable outer padding events (preceding December 31 Fajr and following January 1 Isha) are not needed.

Every actual adjacent padded night must satisfy `M < selected Isha < selected next Fajr < R` in UTC. Invalid chronology blocks selection rather than changing an instant. The one-sided blend guarantees `selected Isha ≤ I` and `selected Fajr ≥ F`. With `0 < q < 1/3`, the candidate separation is `H × (1 − 19q/8) > 5H/24`. Since `H > 5 hours`, the declared model leaves more than 62.5 minutes between those selected events; this is a mathematical property of this rule, not an institutional requirement or accuracy finding.

## What the profile does not cover

This profile does not estimate sunrise or Maghrib during polar day/night or any interval at or below five hours. Annual seasonal Fajr/Isha selection is blocked if the strict horizon gate fails for any year/padded date. Independently eligible current-day sunrise/Maghrib and other point events remain available. It does not mirror these northern rules into the southern hemisphere. It does not use empirical city-clock corrections or acquire calendars. Its fully specified behavior makes the local policy reproducible; it does not demonstrate that the policy is religiously acceptable or matches a publisher.

## Verified example coverage

The [independent summer verification](verification/summer-README.md) compares all annual selected Fajr/Isha outputs, including transition modes and unavailable cases. These counts describe model coverage, not agreement with an institutional calendar:

| Synthetic point / year | Dates with all six ordered selected events | Fajr raw / blended / candidate | Isha raw / blended / candidate |
|---|---:|---|---|
| Bordeaux (44.84, −0.58), 2027 | 365/365 | 338 / 27 / 0 | 296 / 41 / 28 |
| Frankfurt (50.11, 8.68), 2027 | 365/365 | 240 / 20 / 105 | 204 / 34 / 127 |
| Frankfurt (50.11, 8.68), 2028 | 366/366 | 243 / 20 / 103 | 209 / 32 / 125 |
| Berlin (52.52, 13.405), 2027 | 365/365 | 226 / 18 / 121 | 190 / 33 / 142 |
| Edinburgh (55.95, −3.19), 2027 | 365/365 | 214 / 16 / 135 | 184 / 27 / 154 |
| Oslo (59.91, 10.75), 2027 | 0/365 complete | Annual seasonal twilight blocked | Annual seasonal twilight blocked |

The fixture also checks the exact 44.5° boundary, the two antimeridian representations, a synthetic point in a North American DST zone and Frankfurt in the supported edge years 2002 and 2097. Gradual does not mean constant day-to-day change: the largest tested Fajr phase change is about 5.201 minutes between 9 and 10 April in Edinburgh, within the defined smooth transition. Changes are measured relative to daily solar transit, excluding the displayed one-hour DST jump. The independent implementation reproduces those maximum-change dates and values; it does not establish a religiously preferred transition slope.
