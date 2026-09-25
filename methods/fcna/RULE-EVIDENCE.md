# FCNA: source scope and dated recommendations

Reviewed on 25 September 2026. No new publisher calendar or API data was collected for this audit.

## Inspected primary evidence

- [How should the times of Fajr and Isha be calculated?](https://fiqhcouncil.org/the-suggested-calculation-method-for-fajr-and-isha/) identifies an **October 27–29, 2017** General Body meeting. Its page carries **November 8, 2021** and **August 13, 2026** date metadata. It recommends 15°/15° in the USA and 13°/13° in Canada throughout the year. Observation-based caution is a recommendation, without a mandatory fixed minute offset.
- [Fifteen or Eighteen Degrees](https://fiqhcouncil.org/fifteen-or-eighteen-degrees-calculating-prayer-fasting-times-in-islam/) is an authored discussion by Mustafa Umar, with **September 18, 2024** and **August 13, 2026** page dates. It discusses approximating twilight and local observations. It does not explicitly withdraw the Canadian recommendation.

The 2026 page metadata alone is not evidence of a new 2026 angle decision. These texts describe twilight guidance; they do not publish a full timetable engine or a universal geographic fallback when a chosen angle is never reached.

## Current implementation and gap

The generic [reviewed solver](implementation/asr-review/calculate.mjs) preserves explicit USA/Canada profiles. Continuous USNO geometry, the horizon, Asr choice and nearest-minute display remain auxiliary mathematics. A fitted two-minute Isha change would not follow from the cited recommendation.

The [Roseville experiment](TRANSFERABILITY.md) is separate publisher compatibility evidence with known event/season regressions. It cannot determine FCNA-wide rounding or second-level accuracy. The next useful mathematical test is independent solar-root agreement at an identical point and convention, while keeping any publisher-point inference separate. No profile, default or [historical score](validation.json) changed in this audit.
