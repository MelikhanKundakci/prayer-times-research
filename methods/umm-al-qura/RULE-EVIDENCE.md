# Umm al-Qura: evidence boundary

Reviewed on 25 September 2026. The target is the Saudi calendar publisher's computation, not a universal Saudi-community prescription. No new prayer-time API calls or calendar comparison were made.

## Inspected primary pages

- [Publisher homepage](https://www.ummulqura.org.sa/en): identifies King Abdulaziz City for Science and Technology as the site maintainer. Its September 2026 site-update date is not a new calculation-rule date.
- [Publisher's Riyadh prayer-time page](https://www.ummulqura.org.sa/ar/prayer-times/riyadh): supports city selection or an explicit latitude/longitude/timezone and attributes the output to Umm al-Qura astronomical criteria. The inspected explanation does not expose the numerical recipe.
- [Prayer-time frontend](https://www.ummulqura.org.sa/ar/prayer-times): the public interface, not a self-contained formula specification; no backend was queried in this audit.

## Current reconstruction versus confirmed rules

The [selected recipe](implementation/api.mjs) uses Fajr 18.5°, fixed Isha intervals of 90/120 minutes, USNO local anchors with a UTC-noon Fajr epoch, outward minute rounding, and an ICU Umm al-Qura civil-month lookup. In this repository those remain the declared reconstruction. This search did not locate an inspected publisher-authored equation that establishes all those choices. Other institutions' tables describing an “Umm al-Qura” preset do not constitute a Saudi primary specification.

Neither the website's general accuracy statement nor a city/calendar fit establishes the origin of the 90/120-minute interval, its exact Ramadan boundary, the floor/ceil rule, or a high-latitude policy. No numerical change is justified by the pages above.

## Next mathematical gap

Use the already archived fixed-point comparisons to distinguish ephemeris and minute-rounding effects, with Ramadan boundary days scored separately. Preserve the fixed-offset source interpretation: the historical Sydney result is not a DST test. A future rule-supported change must compare every prayer and retain the Cape Town two-minute discrepancies. The current [validation record](validation.json) remains unchanged; GPS precision alone does not settle the institutional convention.
