# Bayynat: legal definitions versus table reconstruction

Reviewed **2026-09-25**. The current code reconstructs numerical table markers. It is not a complete implementation of Fadlallah's legal prayer windows. This audit used explanatory material only and acquired no new point-calendar/API data.

## Primary evidence

The institutional [discussion of Maghrib, dated 2019-05-20](https://www.bayynat.org.lb/article/مقالات-فقهية-حول-الصوم/28345/رأي-العلم-والعلماء-في-دخول-وقت-المغرب/ar) distinguishes disappearance of the entire solar disc, eastern redness, and western twilight. It describes upper-limb disappearance at sunset and central meridian passage for midday. Its account of Fadlallah's view explicitly treats disappearance of the disc as the onset and later eastern-redness disappearance as a recommended precaution. The article also surveys other scholars; their quoted views must not all be attributed to Fadlallah.

The article's approximate 13–15-minute eastern-redness duration is not a depression angle or a universal GPS correction. Its reference to 18° for the end of white twilight does not establish the complete production settings of both independent Fajr and Isha table columns.

## Consequences for this implementation

| Element | Evidence status |
|---|---|
| Maghrib mapped to sunset | Consistent with the legal distinction above, but the exact horizon/refraction model and table generation remain unverified. |
| Fajr/Isha-table 18° | Retained empirical calculation choices; the explanatory text does not certify the full table recipe. |
| Asr-table factor 1 | Empirical table marker, not a unique legal onset established by the reviewed text. |
| Exact −5/6° horizon | A numerical standard-horizon choice; neither observer altitude nor an actual terrain horizon is thereby modeled. |
| UTC12 versus continuous sampling, ceiling versus nearest | Research alternatives, with the losses and source-timezone conflicts retained in [the continuous study](CONTINUOUS.md) and [rounding study](NEAREST-MINUTE.md). No primary production rule was found for selecting them. |

The previously archived calendar PDFs and legal text are summarized in the [README](README.md); this audit does not fetch their calendar rows again or count old observations as new evidence. No clock changes, new validation percentages, or notification eligibility are introduced.

## Next useful improvement

Continue paired offline evaluation of the continuous candidate while keeping the source-clock/timezone question separate. A better fit to the table cannot establish a legal definition for its separate Asr and Isha markers. A future app should expose those meanings instead of selecting a universal “Shia” preset.
