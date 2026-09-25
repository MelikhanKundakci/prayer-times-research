# Archived DST rows: Sydney 2027 and Wellington 2028

## Finding

The archived Moonsighting Committee calendar output disagrees with the applicable civil timezone on the Saturday immediately before two DST transitions in each year. All seven event columns move together by one hour, while rows on the preceding Friday and transition Sunday agree with local calculation. This is a displayed-source offset discrepancy, not an astronomical formula or parser discrepancy.

The public calculation keeps absolute event instants and formats them in the requested IANA timezone. It must continue to use the legal transition dates. A source-compatibility adjustment would make local clocks wrong on these Saturdays, so none is justified.

## Evidence from the archived rows

The checked-in private reference calendars are:

- Sydney 2027, `Australia/Sydney`, source SHA-256 `d8aadc5c52c415a2fdf70c765318f52c81126999de409e6432a16b2492208d2f`.
- Wellington 2028, `Pacific/Auckland`, source SHA-256 `539bbe244e2d4f04a6578c6c248d286aae3d1f6e8e13e8cd4e8297780c1fef11`.

The hashes and source URLs are also pinned in the research reports. The archived source files themselves are not redistributed by the public package.

| Calendar | Saturday source row | Source Fajr | IANA-zone Fajr | Difference | Legal transition |
|---|---|---:|---:|---:|---|
| Sydney 2027 | 3 Apr | 04:45 | 05:45 | −60 min | Sunday 4 Apr, at 03:00 AEDT clocks return to 02:00 AEST |
| Sydney 2027 | 2 Oct | 05:08 | 04:08 | +60 min | Sunday 3 Oct, at 02:00 AEST clocks advance to 03:00 AEDT |
| Wellington 2028 | 1 Apr | 05:06 | 06:06 | −60 min | Sunday 2 Apr, when NZDT ends |
| Wellington 2028 | 23 Sep | 05:38 | 04:38 | +60 min | Sunday 24 Sep, when NZST ends and NZDT begins |

The same ±60-minute difference appears in all seven published events on each Saturday. Source data: [Sydney table](https://www.moonsighting.com/praytable.php?year=2027&tz=Australia%2FSydney&lat=-33.8688&lon=151.2093&method=0&both=true&time=0) and [Wellington table](https://www.moonsighting.com/praytable.php?year=2028&tz=Pacific%2FAuckland&lat=-41.2865&lon=174.7762&method=2&both=true&time=0). These pages are the publisher's outputs, not civil-time authorities.

The transition dates are independently stated by the [NSW Government](https://www.nsw.gov.au/about-nsw/daylight-saving) and the [New Zealand Daylight Time Order 2007](https://www.legislation.govt.nz/regulation/public/2007/0185/latest/whole.html). The New Zealand order sets the April end at 2 am NZ standard time on the first Sunday, and the September start at 2 am NZ standard time on the last Sunday.

## Scope and diagnosis

The pattern is already present in the publisher's displayed rows and survives in the saved HTML, so the local HTML parser is not introducing it. The anomaly reverses sign between autumn and spring, is exactly one hour, and affects every event on the date. That signature isolates civil-offset handling in the source calendar generation/display path. The source implementation is not public in this evidence set, so the exact internal cause (transition rule, timezone database, or date-attribution convention) cannot be established from the rows alone.

This conclusion covers the known Sydney 2027 and Wellington 2028 calendars. It does not establish the source generator's general behavior for other years or cities. The model's explicit legal-transition tests use each IANA zone and a fixed-standard-time control, asserting identical UTC instants and the correct local clock offset before, on, and after the relevant Sunday. No fresh source calendar was available as a prospective holdout for an independent general rule.

## Rejected candidate

Candidate: shift every event by one hour on the Saturday before the transition to reproduce the archived table. It would remove the 28 displayed one-hour mismatches (four dates × seven events), but it would also misstate legal local prayer-clock times by one hour. It is city-, year-, transition-, and source-specific; the available cases do not support generalizing it. Do not add it to the method or the default output.

## Reproduction

From `public/prayer-times-research`:

```sh
node --test tests/moonsighting-legal-dst.test.mjs
```

The test compares each IANA-zone result against a fixed standard-offset control at all four transition-adjacent dates, across all seven event instants. It verifies that UTC instants remain unchanged and the formatted local time follows the legal transition.
