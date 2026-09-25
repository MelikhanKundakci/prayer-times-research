# Can a fixed city longitude make every new La Paz and Suva noon exact?

**No, under the unchanged southern UTC00 reconstruction.** Although all 365 Dhuhr clocks in each independently frozen 2027 [La Paz/Suva calendar](LA-PAZ-SUVA-2027.md) differ by at most one displayed minute, no fixed longitude within either declared ±0.25° city-proxy box can match every published noon minute exactly. This is a retrospective necessary-condition test on newly acquired source calendars; it does not identify Diyanet's point or prove which numerical assumption differs.

## Fixed model and source interpretation

The model samples the USNO equation of time at UTC00 of the solar carrier, takes transit at the chosen longitude, adds five minutes, and rounds to the nearest UTC minute. All 365 carrier dates equal the printed row date at both independent UNGEGN proxy longitudes and at both ends of each ±0.25° longitude box. Every original Diyanet Dhuhr `HH:mm` was assigned to its printed Gregorian date under `America/La_Paz` or `Pacific/Fiji`, respectively; each has one legal UTC occurrence. There are no noon `00:00` cells. The original XLSX hashes and complete-forecast hashes are preserved in the [aggregate](research/la-paz-suva-noon-feasibility-2026-09-25.json).

For a fixed row and carrier, adjusted raw noon time changes by **−240 seconds per degree of east longitude**. A published minute `M` can result from nearest-minute rounding only when the adjusted raw instant lies in `[M−30 seconds, M+30 seconds)`. This gives one half-open longitude interval per observation. Intersecting all 365 intervals in a city tests whether a single longitude could make that year's Dhuhr column exact. No latitude fitting, source-time offset, altered ephemeris or row-specific correction enters this test.

| Calendar | Strongest lower bound (open) | Strongest upper bound (closed) | Separation of constraints |
|---|---:|---:|---:|
| La Paz 2027 | −68.152495845° from 26 March | −68.154139715° from 11 September | 0.395 seconds |
| Suva 2027 | +178.430948661° from 15 April | +178.429204214° from 30 September | 0.419 seconds |

The lower bound exceeds the upper bound in both cases, so the fixed-longitude intersection is empty. The distances in the last column are separations between incompatible rounding constraints, **not** observed prayer-time errors, uncertainty intervals or instructions to add seconds. The two witness dates alone suffice to show the contradiction under this model.

An independent Python calculation read the original Excel files with a second spreadsheet reader, resolved the printed noons using the named timezones, and reproduced both witness dates and positive gaps (0.394529 and 0.418667 seconds). The public aggregate retains full-precision bounds; original rows and the working script remain in private research.

This rules out one proposed shortcut: shifting a static city longitude cannot make these two complete Dhuhr years exactly identical to Diyanet while keeping this solar sampling and rounding recipe. It does not test another ephemeris, rounding rule, actual Diyanet point, height, or a date-dependent institutional convention. Since Dhuhr is only one of six fields, the empty noon intersection is a necessary-condition rejection of a point-only **exact** six-field repair, not evidence that the present within-one-minute output is unusable. No calculator or notification default changed.
