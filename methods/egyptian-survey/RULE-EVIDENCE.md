# Egyptian Survey: rule evidence audit

Reviewed on 25 September 2026. This is an Egyptian regional profile; a position of Dar al-Ifta is distinguished from ESA's numerical software. No new calendar data was used for fitting or scoring.

## Inspected primary evidence

- [Dar al-Ifta fatwa 4021](https://www.dar-alifta.org/ar/fatwa/details/13816/فتوى-دار-الإفتاء-المصرية-في-توقيت-الفجر), dated **20 March 2017**, supports Egypt's Fajr depression of **19.5°** and discusses **17.5°** for Isha. The question's proposed alternative 14.7° is not the fatwa's adopted answer. Its narrative reports historical positions of other bodies; those do not override those bodies' own later publications.
- [ESA's prayer-time service](https://www.esa.gov.eg/praytimes.aspx) identifies its geodesy/calculation administration as responsible for computing the times. It explains the solar-event basis but does not provide implementation equations or the city points in the inspected explanatory text.

## What the implementation assumes

The [own USNO branch](implementation/calculate.mjs) already uses 19.5°/17.5°. The local-solar-hour sampling epochs, −50′ horizon, factor-one Asr, absent Dhuhr offset and nearest-minute rounding are a reconstruction, not parameters certified by the 2017 fatwa. The primary angle source therefore supports retaining the current angles; it does not support adjusting them to fit one proxy city's residuals.

## Next mathematical gap

Separate common longitude/transit residuals from symmetric horizon/latitude residuals across the existing city-month archive. Keep this a diagnosis until a frozen candidate improves held-out seasons without losing other prayers. The regional domain and Africa/Cairo timezone boundary remain appropriate to the evidence; the source does not establish polar replacements or universal GPS operation. No code or [historical scores](validation.json) changed in this audit.
