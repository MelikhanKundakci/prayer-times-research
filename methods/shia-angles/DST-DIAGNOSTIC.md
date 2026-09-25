# ARC transition-date display diagnostic

**A single timezone-display hypothesis explains the twelve New York hour-scale discrepancies, but fails transfer to Sydney and Auckland. It is rejected as a general correction.** The published `arc-publisher-compatibility` calculator and the physical `own` default remain unchanged, including their existing primary accuracy figures.

## What was tested

The compatibility calculator formats each rounded UTC instant with the actual IANA offset at that instant. This diagnostic instead kept every raw calculation and UTC instant unchanged and displayed it using the offset at midnight starting the requested calendar row date:

`table label = unchanged UTC instant + IANA offset(row date, 00:00)`

The rule applied uniformly to all six markers and all eleven annual calendars. It used no city/date exceptions, fitted minute additions, coordinate changes or new ephemeris. Absent or ambiguous midnight was unavailable; six synthetic checks cover those cases, US transitions, a fractional offset and the dateline. The diagnostic is bounded to the tested zones and dates, not a general historical timezone resolver.

This is an **unconfirmed calendar-label convention**, not a physical improvement. IANA offsets belong to instants; under the current US rule the clock changes at 02:00, so the midnight offset can differ from the offset at a prayer event later that day. The archived ARC interface distinguishes timezone, offset and DST transition data, but does not reveal the server's annual-row convention. [IANA timezone theory](https://data.iana.org/time-zones/theory.html), [NIST DST rules](https://www.nist.gov/pml/time-and-frequency-division/popular-links/daylight-saving-time-dst), [ARC public interface](https://arabic.nojumi.org/prayertimes).

All original calendars were already known. The one candidate was declared and frozen before this evaluation, **after the New York residuals had been inspected**. This follow-up is retrospective; the three original calendars' earlier acquisition freeze does not make this new hypothesis prospective. No new institutional source requests were made.

## Complete results

“Baseline” below means the unchanged opt-in compatibility calculator, not the physical own-USNO default. Counts are exact displayed-minute matches. Missing pairs are not hits.

| Previously acquired annual | Comparable fields | Baseline exact | Row-midnight exact | Baseline → diagnostic maximum |
|---|---:|---:|---:|---:|
| New York 2032 | 2,196 | 1,792 | 1,803 | 60 → 1 min |
| Cape Town 2033 | 2,190 | 1,842 | 1,842 | 1 → 1 min |
| Kathmandu 2034 | 2,190 | 1,824 | 1,824 | 1 → 1 min |
| **Original three-calendar study** | **6,576** | **5,458** | **5,469** | **60 → 1 min** |

Only New York's twelve fields on 14 March and 7 November 2032 change: eleven become exact and one becomes a one-minute difference. There are no regressions within these three calendars; all 6,576 diagnostic labels are within one minute. One model-assigned date label also changes. This does not change the published calculator's actual-IANA result of 5,458 exact and 6,564 within one minute.

The identical candidate was then applied to all eight older annuals, without changing it:

| Older development annual | Comparable fields | Baseline exact | Row-midnight exact | Baseline → diagnostic maximum |
|---|---:|---:|---:|---:|
| Tehran 2027 | 2,190 | 1,875 | 1,875 | 1 → 1 min |
| Najaf 2027 | 2,190 | 1,870 | 1,870 | 1 → 1 min |
| Lahore 2026 | 2,190 | 1,855 | 1,855 | 1 → 1 min |
| London 2028 | 2,078 | 1,762 | 1,772 | 61 → 1 min |
| Sydney 2028 | 2,196 | 1,905 | 1,893 | 1 → 60 min |
| Stockholm 2029 | 1,954 | 1,607 | 1,617 | 61 → 1 min |
| Auckland 2030 | 2,190 | 1,815 | 1,803 | 1 → 60 min |
| Kiritimati 2031 | 2,190 | 1,836 | 1,836 | 1 → 1 min |
| **Older development sample** | **17,178** | **14,525** | **14,521** | **61 → 60 min** |

There are 17,532 planned fields in the older sample, including 354 both-unavailable twilight/dependent-midnight pairs; neither model has an availability mismatch. The candidate changes 48 clocks and five date labels. Twenty unequal fields become exact, but **24 exact fields regress to sixty-minute errors** in Sydney and Auckland. Twenty-four absolute errors improve and twenty-four worsen. Both renderers have 17,154 / 17,178 within one minute, for different reasons.

## Decision and limits

The New York pattern is consistent with an earlier offset being retained for a calendar row. It does not establish ARC's implementation or prove a publisher bug. The same mechanism fails in the southern sample cities. No hemisphere or city-specific rule was inferred or tested to hide those losses.

The existing primary comparisons retain all hour-scale discrepancies. A source-confirmed rule for annual-calendar timezone handling and event dates is needed before any publisher-label option could be justified. Actual event-time IANA formatting remains the basis for civil-time interpretation; this diagnostic must not supply notification times.

The [aggregate evidence](research/dst-diagnostic-2026-09-25.json) includes all groups, losses and artifact hashes, with no raw calendar clocks. JavaScript replayed all baseline values and preserved every UTC/raw instant. An independent Python/source recount checked all **24,108 planned fields over 4,018 city-days**, including all 354 original missing markers, and independently verified the timezone labels. These are 11 already exposed annuals, not additional observations or independent astronomical validation. Midnight retains the original circular clock score because the source supplies no event dates; clock agreement does not establish an absolute UTC event. The runtime used IANA 2026d; future legal changes can invalidate timezone forecasts.

See [the unchanged compatibility experiment](ARC-COMPATIBILITY.md) for the solar recipe, original prospective comparison, own-USNO comparator and previously rejected alternatives.
