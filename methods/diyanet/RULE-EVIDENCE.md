# Diyanet: established rules and remaining numerical hypotheses

Reviewed **2026-09-25**. The objective is an offline calculation from explicit location, date and rule inputs. This audit revisited explanatory institutional publications only; no prayer-calendar/API acquisition or institutional contact was used. It changes no calculator or historical score.

Prayer-specific evidence clarified **2026-09-26**. Primary publications confirm distinctions already present in the code; no new calendar comparison or formula change follows.

## Current primary evidence

| Element | Evidence and scope | Runtime consequence |
|---|---|---|
| Published Temkin | [Diyanet's Temkin explanation](https://vakithesaplama.diyanet.gov.tr/temkin.php) states sunrise −7 minutes, sunset +7, Dhuhr +5 and Asr +4, with no additional Fajr/Isha Temkin. | These adjustments have direct textual support. They are not residual-fitted offsets. |
| Area versus point | The same explanation relates Temkin to one time for a locality with east/west and elevation differences; Dhuhr also includes the midday avoidance consideration. | GPS alone does not prove that every adjustment should disappear. A point-only astronomical output and Diyanet-style publication output are different named contracts. |
| Dawn semantics | [The Imsak explanation](https://vakithesaplama.diyanet.gov.tr/imsak.php) treats Imsak as the fasting start and earliest morning-prayer time, tied to true dawn. | Do not import Fazilet's distinct Sabah +20 marker into Diyanet. This page does not by itself specify an exact ephemeris. |
| Standard twilight angles | Diyanet's [17 July 2013 statement](https://www.diyanet.gov.tr/tr-TR/Kurumsal/Detay/2921/basin-aciklamasi), paragraph 7, names Fajr/Imsak 18° and Isha 17°. | These are institution-published criteria, not merely borrowed software defaults. The dated statement does not certify every present-day region, numerical detail or southern fallback. |
| Asr choice | The [12 July 2017 explanation](https://kurul.diyanet.gov.tr/tr/fetva/asr-i-evvel-ve-asr-i-sani-ne-demektir/0193c42d-4d64-7acf-2961-12b0db4e1723) explicitly selects asr-i evvel for Diyanet calendars. | Keep shadow factor 1, measured in addition to the noon shadow. Do not infer factor 2 from a country or a broad school label. This does not settle the ephemeris sampling or rounding. |
| Northern policy chronology and threshold | The [official 2020–2025 activity report](https://kurul.diyanet.gov.tr/tr/faaliyetler/2020-2025/ibadet-vakitleri-dini-gun-ve-gecelerin-tespiti/ileri-enlemlerde-namaz-vakitleri) broadly describes 45° north and above, the September 2021 congress, and implementation from 2023. The archived detailed criteria below explicitly specify **44.5°** as the latitude threshold for estimated times. | Do not replace the implemented 44.5° split with 45° based only on the report's summary. Nor should an older northern rule be mirrored silently into the southern hemisphere. |

The archived [English](https://www.awqatsalah.com/sub/18/calculation-criteria) and [Turkish criteria](https://www.awqatsalah.com/sub/34/tespit-kriterleri) underpin the existing angle, ratio and minimum-day/night research, as recorded in [GLOBAL-SOURCES-2026-09-25.md](GLOBAL-SOURCES-2026-09-25.md). They specify Fajr at 18° and Isha at 16° for the northern policy, alongside the shadow-factor-1 rule, missing-Asr substitute and event-specific adjustments. The 26 September recheck did not recover their bodies through the web reader; these details remain prior archival evidence, not a newly retrieved specification.

## What is still inferred

The own USNO approximation, its sampling epoch, final minute rounding, operational coordinates/height, detailed northern transition algorithm and event dates are not fully specified by the newly reviewed texts. A named institutional rule must be separated from the repository's attempt to implement its missing details. A GPS coordinate makes the geographical input explicit, but does not resolve those other unknowns.

The [shared noon inverse](SHARED-NOON-INVERSE.md) is a fitted hypothesis with city nuisance parameters. The [sampling transfer](EOT-SAMPLING-TRANSFER.md) and [coordinate feasibility](LA-PAZ-SUVA-EVENT-INTERVALS.md) studies preserve important negative results. None establishes an official seasonal correction or a general production city point. Those experiments must not be repackaged as confirmed religious rules.

## Next useful improvement

Evaluate an explicitly named solar model and all six events together, retaining both source-independent point inputs and any fitted nuisance parameters separately. Seconds should be preserved internally so rounding can be audited; seconds displayed from an approximate model are not evidence of second-level institutional or observational accuracy. Existing archived comparisons can test a new hypothesis without making runtime calculation depend on an API.
