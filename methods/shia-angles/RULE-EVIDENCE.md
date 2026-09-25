# Shia angle profiles: source authority and legal meaning

Reviewed **2026-09-25**. Tehran, Leva, ARC and Sistani's legal rulings are distinct attributions. This audit revisits explanatory publications only; no new calendar/API data or institutional correspondence is used. Existing calculated clocks and validation scores are unchanged.

## Evidence by attribution

| Profile or rule | Current evidence | What it does not establish |
|---|---|---|
| ARC Fajr 18° | [I.M.A.M.'s institutional explanation](https://imam-us.org/prayer-time-apps) says it follows the Najaf office's timings through ARC and explicitly names 18° for dawn. Both its English and Arabic explanations were inspected. This strengthens the existing archived ARC client evidence. | A single universal “Shia” angle, exact solar engine, rounding, event-date contract, or a polar substitute. |
| ARC Maghrib 4.5° in Iran / 3.75° outside Iran | Previously inspected primary calculator-client settings, recorded in [the profiles](implementation/profiles.mjs) and [historical validation](validation.json). No new calendar was fetched in this audit. | Certification that these angle crossings reproduce every observed legal sign or every ARC output. |
| Tehran 17.7° / 4.5° / 14° | The profile remains explicitly attributed to a software parameter publication. Searches in this audit did not produce an inspectable original IGUT mathematical specification. | An institutionally verified Tehran algorithm. Repeated third-party labels do not upgrade this evidence. |
| Leva 16° / 4° / 14° | The archived software-method attribution remains secondary. No inspectable original Leva specification was established. | Equivalence to ARC, Sistani, or all Jafari practice. |

## Legal windows are not extra angle columns

[Sistani's ruling 717](https://www.sistani.org/english/book/48/2209/) describes Dhuhr and Asr from zawal until sunset with ordering requirements. It does not prescribe a shadow-factor onset for Asr. The source's footnote also describes legal midday as half the sunrise-to-sunset day; the current solar-transit marker should not be relabeled as a complete implementation of that legal definition.

[Rulings 722–727](https://www.sistani.org/english/book/48/2212/) describe waiting for eastern redness to pass overhead, ordinary and exceptional evening windows, ordering, and night from sunset to dawn. They supply no universal numerical Maghrib angle. The model's sunset-to-next-Fajr midpoint is a numerical marker whose endpoints still depend on the selected angle profile; it is not a complete legal-window engine. [Ruling 728](https://www.sistani.org/english/book/48/2213/) describes spreading true dawn and sunrise as the morning window's endpoints, without assigning a fixed angle.

This supports keeping unspecified Asr/Isha markers absent where no distinct onset has been specified. A missing column must not be filled merely to imitate a six-column Sunni calendar.

## An approximate precaution is not a geometric identity

The I.M.A.M. page also permits an optional delay of approximately 15 minutes as precaution and associates that discussion with 16°. It does not provide an exact world-wide equality between a fixed delay and a two-degree change.

As a local calculation check, the unchanged [USNO geometry](implementation/geometry.mjs) gives the following elapsed times between the **−18° and −16° rising crossings**, before minute rounding. These are model examples, not institution calendar observations:

| Point | Date | Difference |
|---|---|---:|
| Singapore, 1.30°N 103.80°E | 2026-03-20 | about 480 seconds |
| Frankfurt, 50.11°N 8.68°E | 2026-03-20 | about 801 seconds |
| Same Frankfurt point | 2026-05-01 | about 1,218 seconds |
| Same Frankfurt point | 2026-06-21 | −18° has no rising crossing; −16° does |

Therefore no fixed +15-minute correction, replacement of 18° with 16°, or missing-event fallback is added automatically. Such a choice must carry its own semantics and source. The examples can be reproduced with `geometryDay({date,latitude,longitude,timeZone,engine:'usno'})` and `crossing(-18,'rising')` / `crossing(-16,'rising')`, using `Asia/Singapore` or `Europe/Berlin` respectively.

## Next useful improvement

Preserve named legal authorities separately from published parameter sets. Any new numerical profile needs a primary definition or an explicitly labeled hypothesis, along with paired archived comparisons; the current ARC compatibility branch remains a publisher-output experiment with its known date/DST limitations.
