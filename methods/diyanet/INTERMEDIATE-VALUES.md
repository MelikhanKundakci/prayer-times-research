# Published intermediate values: what they identify

**This bounded audit found numerical examples, but no new global calculation rule sufficiently identified by those sources.** No candidate was manufactured from residual minutes; no calculator or accuracy denominator changed. The [evidence record](research/intermediate-values-2026-09-25.json) preserves source hashes and arithmetic checks. This is a limited source search, not a claim that further documentation does not exist.

## Official example coordinates

Diyanet's [Vakit Kıyaslamaları, examples 1–3](https://vakithesaplama.diyanet.gov.tr/vakit_kiyaslamalari.php), supplies six explanatory points: Tekirdağ, Adana, Istanbul, Hatay, Ankara and Karaman. Their longitude differences imply noon separations of **31.260, 28.716 and 1.464 minutes**, consistent with the page's approximate **31, 28–29 and 1–2 minutes**.

A common daily equation-of-time term cancels in such differences. These examples therefore do not distinguish daily ephemerides or reveal a rounding threshold. They lack a production version, datum and height specification. Solstice comparisons give no explicit year or absolute unrounded clocks; the general 23°27′ tilt explanation is not a complete ephemeris. These example points were already investigated in the project, and do not establish today's production coordinates.

## The static guide supplies minute-level horizons

The [official Awqat guide](https://awqatsalah.diyanet.gov.tr/files/56d83ac4-f7f5-4f6e-9b9e-b1ffeebf1b6a.pdf), printed pages 9–10 (PDF pages 10–11), contains separate examples:

- `CityDetail`: Devrekani, ID 17885, Kastamonu, Turkey; Qibla information, but no latitude/longitude/elevation.
- `Daily`: 29 November 2022, a row-midnight `+03:00` timestamp and offset field, but **no concrete request city ID or returned city identity**.

The Daily sample cannot safely be assigned to Devrekani. Astronomical sunrise is 07:49 versus sunrise 07:42; astronomical sunset is 17:16 versus Maghrib 17:23. These establish seven-minute *displayed differences*. They are `HH:mm` fields, not raw seconds, a horizon definition or an ephemeris trace.

Even conditionally assuming symmetric rise/set geometry and Dhuhr = transit +5 minutes, the sample admits nearest, floor and ceiling rounding: each has a nonempty 30-second transit interval. This demonstrates insufficient identification, not a fitted model or proof of symmetric source geometry. A separate reviewer confirmed the missing Daily identity and limited precision.

## A dated observational example

[Özdemir and Aşıkkaya, Diyanet İlmi Dergi 52/2 (2016), pp. 31–42](https://dergipark.org.tr/en/download/article-file/410252), Figure 4 on printed page 37, identifies **Yağlıpınar, 19 October 2011**, and theoretical Isha **19:32**. Its fitted lines describe measured horizon brightness, not solar-coordinate computation. Table 1a on page 38 contains mean zenith angles of **106.6° for Isha and 107.8° for Fajr** in its observational groups.

These are genuine numerical observations, not per-date ephemeris inputs or replacement angles. GPS equipment is mentioned without station coordinates; no unrounded transit, Julian-date argument or rounding rule is supplied. Table and adjacent prose give different Fajr mean differences, so none is selected as a correction. Page 41 excludes a study of high-latitude replacement rules. The figure/table pages were visually checked against extracted text.

## Historical discussion and current rules

İrfan Yücel's 2012 talk in the [Diyanet proceedings scan](https://makale.isam.org.tr/bitstreams/af97ecf1-041c-4bd0-8cd8-50fa4d9a5fec/download) discusses historical Temkin decisions. Printed page 219's account of 16° and four-minute adjustments is not a current complete configuration and cannot displace separately dated operational sources. This page was visually checked.

The [Temkin explanation](https://vakithesaplama.diyanet.gov.tr/temkin.php) supplies integer adjustments; the [Turkish](https://www.awqatsalah.com/sub/34/tespit-kriterleri) and [English](https://www.awqatsalah.com/sub/18/calculation-criteria) high-latitude criteria supply angles and policy prose. The inspected texts do not identify daily solar coordinates, time scale/epoch, second-level rounding or a complete production calculation trace. Their documented rules remain distinct from reconstruction assumptions.

## Public HTML observation channel

An ordinary [Istanbul Müftülüğü HTML page](https://istanbul.diyanet.gov.tr/Sayfalar/Arama.aspx?q=Gen%C3%A7lik+Koordinat%C3%B6rl%C3%BC%C4%9F%C3%BC) exposed the same astronomical sunrise/sunset fields. Search and open views represented different September 2026 snapshots. This is a possible public observation channel, not a freshness guarantee, stable bulk interface or new validation. Minute-only values still do not reveal the production point or unrounded solution.

The audit made no prayer API call, institutional contact or annual calendar acquisition. Hobart and Apia reference contents were not inspected during this audit. It created **zero numerical candidates**.

A useful new numerical hypothesis needs an identified date and calculation point with unrounded intermediates, or an explicit ephemeris/rounding specification. These examples support narrower conclusions than a universal correction.
