# MUIS Maghrib residual review: general transfer checks

This review asks whether the ten two-minute Maghrib differences in the frozen 2027 comparison can be explained by a general clock, rounding or ephemeris choice. It is a **retrospective candidate review**: the full 2027 forecast was originally frozen before the official timetable rows were opened, but the alternatives below were selected after that source had been seen. No source-specific fit is claimed.

The official [MUIS Islamic calendar page](https://www.muis.gov.sg/resources/islamic-calendar/) lists annual prayer timetable PDFs separately from Islamic calendars. Its linked [2027 prayer timetable](https://isomer-user-content.by.gov.sg/48/01b5692f-0f2c-44cb-b2bb-dbae0d4c4583/Prayer%20Timetable%202027.pdf) displays Maghrib at 19:21 on 7 February, 19:23 on each date from 8–17 February, and 19:22 on 18 February. It changes back from 19:20 on 9 March to 19:18 on 10 March. The corresponding separately published [2027 Islamic calendar](https://isomer-user-content.by.gov.sg/48/58bf9c81-404a-4475-b0b3-5075480abfae/Islamic%20Calendar%202027M.pdf) dates Ramadan from 8 February through 9 March. The source page and PDFs give dates and prayer clocks; they do not state the Maghrib formula, safety margin or reason for these calendar-boundary jumps. These printed times therefore establish a publisher-clock pattern, not the physical instant of sunset or MUIS's underlying calculation procedure.

## Predeclared general checks

All alternatives use the same date rows and `Asia/Singapore` local clock. The original comparison checked all six events on every day, preserved each `YYYY-MM-DD` key, and had no missing event slots. The historical rows are a development/transfer cohort, not fresh holdouts.

| Candidate | 2024–2026 exact / 6,576 | within ±1 min | >1 min | 2027 exact / 2,190 | within ±1 min | >1 min |
|---|---:|---:|---:|---:|---:|---:|
| USNO continuous, existing ceil-to-minute baseline | 4,608 | 6,556 | 20 | 1,531 | 2,180 | 10 |
| Add +1 displayed minute to Maghrib on every date | 4,148 | 6,538 | 38 | 1,335 | 2,185 | 5 |
| Round every unrounded event to nearest minute, ties upward | 2,079 | 6,364 | 212 | 687 | 2,119 | 71 |
| NOAA continuous alternate, existing recipe and ceiling | 4,572 | 6,556 | 20 | 1,532 | 2,180 | 10 |

The all-date +1 Maghrib shift improves 87 2027 cells by absolute error and worsens 278; it raises the number of exact full-year event minutes from 1,531 to 1,335 even though five of the ten two-minute errors move inside ±1 minute. It transfers poorly to 2024–2026: exact totals fall by 460 and >1-minute differences rise by 18. Nearest-minute rounding causes substantially more >1-minute differences in both samples. NOAA changes the 2027 total by only one exact minute, with 18 cells improved and 17 worsened; it does not remove the ten Maghrib residuals. Neither the general shift, minute quantization nor alternate ephemeris validates a general correction.

The already documented Ramadan-only +1-minute diagnostic has a different scope. On the 2027 source it improves 30 Ramadan Maghrib cells, worsens none, and removes all ten >1-minute differences, but it was inspired by the already exposed 2024–2026 data. In that earlier development cohort it improves 87 Ramadan Maghrib cells, worsens one, and leaves five September 2025 Asr differences above one minute. That apparent calendar-specific transfer supports further inquiry, not a runtime Ramadan branch: the reason is undocumented and future MUIS Ramadan dates cannot be assumed from this evidence.

No numerical model or default changed. The reproducible private comparison records source hashes, date coverage, per-year and per-event signed errors, and changed/improved/worsened counts. Public summaries omit the publisher's full daily rows. The previously reported prospective 2027 baseline and the limits of the annual comparison are in [PROSPECTIVE-2027.md](PROSPECTIVE-2027.md).
