# JAKIM / Malaysian state calendars: rule evidence

Reviewed 25 September 2026 using public institutional text. No e-Solat API request or new calendar comparison was performed; numerical recipes are unchanged.

| Primary source | What it establishes | Boundary |
|---|---|---|
| [Selangor Taudhih Al-Falak #15, 3 July 2025](https://www.muftiselangor.gov.my/2025/07/03/15-taudhih-al-falak-fajar-sadiq-dalam-menentukan-permulaan-waktu-solat-subuh/) | Explains the move from the former 20° Fajr criterion to 18°, following national deliberation held 17–19 September 2019. | The article date is not a nationwide implementation date. State adoption and historic calendars need explicit versions. |
| [Selangor institutional FAQ](https://www.muftiselangor.gov.my/soalan-lazim/) | States upward minute rounding for prayer starts and downward rounding for sunrise. Distinguishes local times from grouped zones and describes a western/latest-time reference for Zone 1. | Not an executable current configuration for all states. Its Imsak explanation also gives a 2–5-minute precautionary example; that passage is not sufficient to add the same margin to every event. |

The current [single-point model](implementation/single-point/model.mjs) uses 18° Fajr, and the documented rounding directions agree with that FAQ. However, its **floor-to-seconds stage, +64-second Dhuhr adjustment, fixed solar-coordinate sampling times, and final zone point sets** remain reconstruction choices unless supported by separate versioned evidence. This audit found no primary rule that upgrades those four details to certified present production behavior.

A precise GPS point and a zonal timetable are distinct outputs. Selecting a local point cannot replace extrema across a declared zone while preserving the same timetable semantics. Point accuracy and zonal safety policy need separate evidence; a universal added eight minutes is also not a substitute for recalculating the documented angle.

Seconds should describe the underlying calculation only. They must not bypass the explicit publication rounding or imply that the site's illustrative margin is a measured second-level correction. The unresolved 2027 Selangor boundary transition and unconfirmed SGR01/KDH03 point hypotheses remain documented in the [method README](README.md).
