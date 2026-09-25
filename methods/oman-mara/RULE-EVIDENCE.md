# Oman MARA: evidence audit

Reviewed on 25 September 2026. Oman MARA denotes the ministry publisher; it is not a definition of all Ibadi practice. No new prayer-time API request or calendar fitting occurred.

## Inspected primary evidence

The ministry's [English calendar frontend](https://www.mara.gov.om/calendar.html) and [Arabic calendar frontend](https://www.mara.gov.om/arabic/calendar.html) distinguish daily, monthly and regional displays. These interfaces support attribution of the calendar to the ministry. They do not disclose an ephemeris, angle pair, safety-margin equation, rounding rule, or high-latitude policy in the inspected text. No dated numerical specification was located in this bounded ministry-domain search. That is a search outcome, not proof that no such publication exists.

## Current assumptions

The [V2 model](implementation/v2/candidate.mjs) uses NOAA coordinates at UTC noon, 18°/18°, a −50′ sea-level horizon, Asr factor one, ceiling to UTC minutes, and five extra minutes for Dhuhr, Asr and Maghrib. All remain **empirical reconstruction choices**. Statements by other institutions about Oman do not certify MARA's operational implementation.

## Next mathematical gap

Resolve the archived source's year contract before interpreting sub-minute residuals as formula defects. A perpetual or partly year-dependent calendar cannot automatically be scored as a fresh requested-year astronomical calculation. The missing leap day remains missing. Then test whether a single explicit ephemeris/rounding convention transfers across the existing cities and seasons, preserving the earlier V1 negative result. The [validation record](validation.json) is unchanged; no source-backed numerical correction was established here.
