# Composed local five-prayer profiles

The 16 `local-...` profiles are explicit software compositions: four named Fajr/Isha angle pairs × two Asr shadow factors × physical-only or angle/night twilight handling. They combine the selected criteria with the shared SPA point model and project-defined common rules. They are not complete institutional methods or religious certifications; choose one deliberately.

| Twilight pair | Angle source scope | Profile IDs (factor 1 and 2; physical and angle-night for each) |
|---|---|---|
| 18° / 17° | Diyanet's 17 July 2013 statement gives these ordinary Fajr/Isha angles. This pair does not import Diyanet's Temkin or northern policy. | `local-18-17-shadow{1,2}-{physical,angle-night}-v1` |
| 19.5° / 17.5° | Egyptian Dar al-Ifta angle criteria; not a complete Egyptian Survey method. | `local-19p5-17p5-shadow{1,2}-{physical,angle-night}-v1` |
| 15° / 15° | FCNA's 2017 USA recommendation; not a complete FCNA method. | `local-15-15-shadow{1,2}-{physical,angle-night}-v1` |
| 13° / 13° | FCNA's 2017 Canada recommendation; not a complete FCNA method. | `local-13-13-shadow{1,2}-{physical,angle-night}-v1` |

The pair source applies only to Fajr and Isha. Each composition also makes these local choices:

| Event | Rule | Scope |
|---|---|---|
| Fajr | Rising crossing at the selected angle | Source-attributed angle; local point implementation. |
| Sunrise | Flat apparent horizon at −50′ | Solar marker, not a prayer start. |
| Dhuhr | Solar upper transit +1 elapsed minute | Explicit project margin. |
| Asr | Descending shadow event at selected factor 1 or 2, relative to the fixed noon shadow | Explicit selection independent of twilight source. |
| Maghrib | Setting crossing at the flat −50′ apparent horizon, no added margin | Project horizon convention. |
| Isha | Setting crossing at the selected angle | Source-attributed angle; local point implementation. |

The point astronomy uses the Reda–Andreas Solar Position Algorithm (SPA) implementation in [`../astronomy/spa-point.mjs`](../astronomy/spa-point.mjs), with the solver and date conventions in [`index.mjs`](index.mjs). SPA supplies the solar position; it does not select prayer rules or certify that a particular angle describes observed dawn. The model uses a flat unobstructed horizon, with no terrain or observer-height model. The caller supplies an IANA timezone separately; GPS coordinates alone do not determine one.

## Physical and optional twilight policies

The `physical` profiles retain a real crossing when one exists and leave missing Fajr/Isha unavailable. They never fill in a polar estimate.

The `angle-night` profiles opt into a named angle-fraction convention. For an actual adjacent horizon night of elapsed duration `H`, and selected angle `a`:

```text
Fajr candidate = next sunrise − (Fajr angle / 60) × H
Isha candidate = previous sunset + (Isha angle / 60) × H
```

When a real crossing falls inside that bound, preserve it with `calculated` status. If Fajr is earlier than its candidate, cap it to the candidate; if Isha is later than its candidate, cap it to the candidate. Any selected cap or fallback candidate has `estimated` status. A missing crossing may use the candidate only when the solver proves the Sun stays continuously above the selected twilight threshold, or only touches it without a directed crossing. Other missing or numerically ambiguous cases remain unavailable. The candidate, selected instant, raw status and reason are retained in the result.

This angle-fraction convention is a documented software option, not an assertion that Egyptian, FCNA, Diyanet, or all Sunni practice uses it. The angle/night option requires real adjacent sunrise and sunset events and a chronological elapsed night strictly shorter than 24 hours. It does not manufacture horizon events in polar day or night. See [`night-fraction.mjs`](night-fraction.mjs) and the cited [PrayTimes software convention](https://praytimes.org/docs/calculation). Other authorities use different high-latitude rules, such as Diyanet's published criteria; those criteria do not make this composition equivalent to Diyanet.

## Output meaning

Raw event instants retain fractional milliseconds; user-facing minute fields are rounded for display. Numerical resolution is not evidence of observed accuracy to that resolution. `coverage.prayerStartsComplete` is true only when all five selected prayer-start fields are available. That means the named composition returned five values; it does not establish religious suitability, institutional agreement, or readiness for unattended alerts.
