# Northern ordinary-event guard

This page defines a deliberately conservative local eligibility guard for selecting **ordinary real-angle events** at northern latitudes. It is a named software policy over point astronomy, not a reconstruction of Diyanet's unpublished annual seasonal algorithm, and not an official timetable or religious ruling. It may select a bounded subset of raw Fajr and Isha events; it does not produce the estimated summer Fajr/Isha times described in the source criteria.

The detailed published criteria give true Fajr at −18° and true Isha at −16°, then describe seasonal replacement and gradual transition rules. The [English](https://www.awqatsalah.com/sub/18/calculation-criteria) and [Turkish](https://www.awqatsalah.com/sub/34/tespit-kriterleri) criteria do not fully define the transition blend or all interval conventions. This guard therefore uses strict inequalities that keep a selected raw event away from every annual transition boundary under the explicit local conventions below. It does not assert that its annual envelope is identical to Diyanet's production interpretation. See the public [rule evidence](../../methods/diyanet/RULE-EVIDENCE.md) for the source/interpretation boundary.

## Annual context required

An ordinary event is selected only when the whole annual context is valid. The API requires every local civil date in the requested year plus padded dates immediately before and after it, so adjacent nights and annual extrema are evaluated without a year-edge shortcut. This is supported for years **2002–2097**, leaving the padded dates inside the solar model's 2001–2098 range.

In 2001 and 2098 the annual twilight guard stays blocked, but independently valid daily horizon events remain usable. Only a horizon needing an unavailable adjacent cycle is blocked for that dependency, such as sunrise on 1 January 2001 or Maghrib on 31 December 2098.

Every annual and padded row must have valid solar transit and usable raw/selected sunrise and Maghrib. Every raw and selected daytime interval and every actual adjacent horizon night must be **strictly longer than five hours**. A missing horizon, invalid date, non-unique transit, failed solar event, or interval at or below five hours disables the ordinary guard for the year. No estimated sunrise/sunset is inserted to rescue the annual context. The strict bound reflects the detailed criteria's use of real horizons only when day/night exceeds five hours; the source does not specify the exact construction of its shorter-than-five-hour horizon estimates.

For each sunset-owned night, define these local-model quantities in UTC instants:

- `M`: that date's **selected Maghrib** instant, including the profile's +7-minute margin.
- `F`: the next civil day's raw −18° Fajr instant, when that crossing exists.
- `R`: the next civil day's **selected sunrise** instant, including the profile's −7-minute margin.
- `N = F − M` when raw Fajr exists; `H = R − M` is the actual adjacent selected-horizon night.
- `third = N / 3` while raw Fajr exists.

This profile's explicit night convention is selected Maghrib to next raw Fajr for `N`, and selected Maghrib to next selected sunrise for `H`. That is a local modeling convention needed to evaluate durations; the source criteria do not fully define those endpoints. If raw Fajr is absent during one contiguous seasonal gap, freeze `q = N / (3H)` from the last valid real-Fajr night before that gap and use `third = qH` for annual Isha-boundary candidates inside the gap. Multiple gaps, no preceding valid night, or an invalid ratio disables the annual guard. This frozen ratio is used only to bound eligibility; it does not supply a selected summer Fajr or Isha time.

## Annual transition envelope

Let `T` be the upper-meridian transit instant owning an event. For every night in the padded annual context, form the Isha candidate `I = M + third` and the conservative Fajr upper-bound candidate `Fupper = R − third`. `Fupper` is later than the source's determined Fajr because that criterion subtracts an additional two-sixteenths of the night from sunrise. No coefficient or time conversion is inferred for the source's separate “2 degree difference” fallback.

Construct the annual limits from **elapsed UTC minutes relative to the owning transit**, not from displayed local clock fields:

```text
IshaGuard = min over padded-context nights of (I − T − 20 minutes)
FajrGuard = max over padded-context nights of (Fupper − Tnext + 20 minutes)
```

Here `Tnext` is the next civil date's transit owning the Fajr event. Both extrema include every padded night, including the night beginning on the prior December 31 and the Fajr ending on the following January 1. The transit-relative frame preserves elapsed astronomical time through midnight and daylight-saving changes; the source does not define an annual comparison in local `HH:mm` clock fields.

For a queried night, select **raw real Isha at −16°** only if all of the following hold:

```text
rawIsha − T < IshaGuard
rawIsha < I − 20 minutes
rawIsha < next rawFajr
```

Select **raw real Fajr at −18°** only if both conditions hold:

```text
rawFajr − Tnext > FajrGuard
rawFajr > Fupper + 20 minutes
```

All comparisons are strict. Equality, missing raw events, a failed chronology check, or invalid annual context leaves the selected event null and policy-blocked. The local rule IDs for successful selections are:

- `diyanet-published-point-v1.fajr.northern-ordinary-18.annual-guard`
- `diyanet-published-point-v1.isha.northern-ordinary-16.annual-guard`

The inequalities deliberately require a raw event to lie outside both its own daily transition boundary and the annual envelope. They are a sufficient conservative eligibility test under this named model, not a claim to identify every date Diyanet selects as ordinary. The annual envelope can reject valid ordinary dates; that is preferable to inventing a transition curve. If an event fails the guard because its seasonal selection is unresolved, keep the `northern-seasonal-policy-not-implemented` reason. Report annual-context failures separately so callers can distinguish “annual guard could not be established” from “this date is inside or near the seasonal policy.”

## Measured ordinary-domain coverage

The independent point-year fixture compares every Fajr/Isha eligibility decision across nine synthetic input-years (3,286 owned dates). The following counts are **coverage under this local guard**, not calendar matches or accuracy percentages:

| Point (latitude, longitude), year 2027 | Ordinary Fajr days | Ordinary Isha days |
|---|---:|---:|
| Bordeaux (44.84, −0.58) | 236 | 250 |
| Frankfurt (50.11, 8.68) | 206 | 218 |
| Berlin (52.52, 13.405) | 192 | 204 |
| Edinburgh (55.95, −3.19) | 174 | 186 |
| Oslo (59.91, 10.75) | 0 | 0 |

Oslo's annual guard fails because some summer horizon nights are too short; the algorithm keeps those dependencies instead of discarding them to release winter twilight. Individually valid winter horizon events remain available. The independent check also covers Frankfurt 2028, both antimeridian representations and a northern synthetic point in a DST timezone. See the [reproducible verification](verification/northern-README.md) for all inputs and model limits.

## Output boundary

Successful guarded values are calculated raw-angle events with no additional Fajr/Isha Temkin margin. They are not estimates: the guard either admits the physical −18°/−16° event or leaves it blocked. No seasonal fallback time is generated for dates whose raw twilight is absent. Horizon, Asr, Temkin, event-date, chronology and seconds-display rules remain those of the main [rule contract](RULES.md).

This profile does not claim that its night convention, annual-envelope comparison or transition boundary exactly matches the Diyanet production implementation. A complete institutional seasonal algorithm would require source definitions for night endpoints, the transition function and anchors, the absent-Fajr “2 degree difference,” the short-horizon construction, and date/rounding behavior.
