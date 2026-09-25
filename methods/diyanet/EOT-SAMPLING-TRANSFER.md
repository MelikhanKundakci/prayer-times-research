# Does a later equation-of-time sample repair Diyanet noon?

**No shared replacement emerged.** We retrospectively changed only the equation-of-time sampling epoch in the existing own USNO Dhuhr formula and compared six already exposed, source-frozen 2027 annual calendars. The city proxies, +5-minute Dhuhr adjustment, timezone resolution and nearest-minute rounding stayed fixed. This is a diagnosis of one numerical assumption, not a blind validation or a claim about Diyanet's undisclosed production algorithm.

The four variants were the current solar-carrier **UTC00** sample, a sample at the **iteratively solved apparent transit**, a sample at carrier **UTC12**, and a sample at the point's **mean solar noon** before equation-of-time correction. None fits a parameter or uses a source clock at runtime. Original annual XLSX `HH:mm` noons were assigned to their printed Gregorian dates under the named IANA zones. Full input hashes, event counts, paired gains/losses and residual spans are preserved in the [aggregate](research/eot-sampling-transfer-2026-09-25.json).

| 2027 city | Current UTC00 | Solved-transit EOT | UTC12 EOT | Mean-noon EOT |
|---|---:|---:|---:|---:|
| La Paz | 321/365 | 302/365 | 314/365 | 302/365 |
| Suva | 280/365 | 280/365 | 277/365 | 279/365 |
| Kathmandu | 335/365 | 331/365 | 315/365 | 330/365 |
| Jakarta | 279/365 | 277/365 | 283/365 | 277/365 |
| Cape Town | 335/365 | 315/365 | 313/365 | 315/365 |
| Auckland | 346/365 | 344/365 | 318/365 | 344/365 |
| **Total exact** | **1,896/2,190** | **1,849/2,190** | **1,820/2,190** | **1,847/2,190** |
| Paired gains / losses vs UTC00 | — | 48 / 95 | 86 / 162 | 48 / 97 |

At the frozen proxies, the range of source-minute-start minus adjusted raw transit across La Paz's 365 noons is **60.395 seconds** with UTC00 and **89.454 seconds** with solved-transit sampling. Suva's range narrows only from **60.419** to **60.303 seconds**. A source minute supplies a 60-second admissible rounding cell; these ranges are **constraint widths, not observed timestamp errors**. Changing longitude or the sampling rule simultaneously is a different experiment, and this fixed-proxy span alone does not certify every possible coordinate under the nonlinear solved-transit variant.

A separate Python implementation read all six original Excel workbooks with `openpyxl`, resolved each source date with `zoneinfo`, independently computed the four USNO equation-of-time variants, and matched the aggregate's 2,190 baseline and alternative clock decisions and rounded spans. It also checked the reconstructed UTC00 raw transit against every frozen forecast before scoring. The [six-event proxy-latitude diagnostic](LA-PAZ-SUVA-EVENT-INTERVALS.md) and [latitude-independent noon feasibility result](LA-PAZ-SUVA-NOON-FEASIBILITY.md) address different coordinate questions; neither supplies Diyanet's seconds-level ephemeris or city point.

These three later-sampling hypotheses produce losses across the six cities, so none replaces UTC00 in the calculator. We did not add a city-specific offset or grant notification eligibility. Exact reproduction still needs a better identified astronomical/publication rule and verified institutional city assignment.
