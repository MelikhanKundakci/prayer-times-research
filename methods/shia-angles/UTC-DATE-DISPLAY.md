# ARC UTC-date display hypothesis and notification dates

**One uniform display rule explains all 36 known hour-scale ARC discrepancies without regressions across eleven annual calendars. It does not establish safe notification timestamps.** The published calculators and their primary actual-IANA scores remain unchanged.

This is distinct from the [rejected local-midnight rule](DST-DIAGNOSTIC.md), which worsened Sydney and Auckland. The new diagnostic uses:

`display label = unchanged model UTC instant + IANA offset at row-date 00:00 UTC`

The UTC instant and every raw solar value stay identical. This is a possible date-only carrier convention, **not a documented ARC rule** or a physical timezone correction. The candidate was declared and frozen before this evaluation, after the calendars and prior discrepancies were known. All results are retrospective. No new institutional request, fitted regional exception, sampling-hour search or numerical model change was made.

## All eleven annuals

The baseline is the existing opt-in publisher-compatibility calculation with event-time IANA formatting. These are displayed-minute comparisons, including the existing circular midpoint score.

| Annual source | Comparable fields | Baseline exact | UTC-date label exact | Newly exact | Exact regressions |
|---|---:|---:|---:|---:|---:|
| New York 2032 | 2,196 | 1,792 | 1,803 | 11 | 0 |
| Cape Town 2033 | 2,190 | 1,842 | 1,842 | 0 | 0 |
| Kathmandu 2034 | 2,190 | 1,824 | 1,824 | 0 | 0 |
| **Original three-calendar replay** | **6,576** | **5,458** | **5,469** | **11** | **0** |
| Tehran 2027 | 2,190 | 1,875 | 1,875 | 0 | 0 |
| Najaf 2027 | 2,190 | 1,870 | 1,870 | 0 | 0 |
| Lahore 2026 | 2,190 | 1,855 | 1,855 | 0 | 0 |
| London 2028 | 2,078 | 1,762 | 1,772 | 10 | 0 |
| Sydney 2028 | 2,196 | 1,905 | 1,905 | 0 | 0 |
| Stockholm 2029 | 1,954 | 1,607 | 1,617 | 10 | 0 |
| Auckland 2030 | 2,190 | 1,815 | 1,815 | 0 | 0 |
| Kiritimati 2031 | 2,190 | 1,836 | 1,836 | 0 | 0 |
| **Older development transfer** | **17,178** | **14,525** | **14,545** | **20** | **0** |
| **Combined existing collection** | **23,754** | **19,983** | **20,014** | **31** | **0** |

There are **24,108 planned fields**, with 354 both-missing pairs excluded from the accuracy denominator. Neither renderer has an availability mismatch. The combined maximum displayed-clock difference falls from 61 to one minute, and within-one-minute agreement rises from 23,718 to 23,754. Exactly 36 clocks improve, none worsen, and two display-date labels change. The unchanged UTC geometry means these improvements concern labels only.

The same formula leaves the southern transition rows unchanged; it contains no hemisphere branch. It is consistent with this collection, but a finite retrospective match cannot establish the publisher's implementation or unseen behavior.

## What the source actually supplies

The archived [ARC interface](https://arabic.nojumi.org/prayertimes) sends coordinates and a date range for its annual request. That request does not pass the interface's geographic IANA identifier or displayed DST transition timestamps. Each returned row has `prayerDate` and seven clock markers; it lacks per-event UTC timestamps, numeric offsets and event dates. A separate response-wide `localDateTimeNow` object is not a per-event offset contract. The frontend displays the supplied clocks directly. The aggregate evidence records the archived page hash; this describes that inspected version, not a claim about every future API response.

IANA provides civil-time rules for instants; it cannot determine which event date a publisher intended. Its future rules are predictions and can change. A numeric offset and named zone can also conflict; RFC 9557 describes explicit handling of that inconsistency. Neither reference specifies ARC's religious midpoint or row-date semantics. [IANA timezone theory](https://data.iana.org/time-zones/theory.html), [RFC 9557 §3.4](https://www.rfc-editor.org/rfc/rfc9557.html#section-3.4).

## Why the date still matters

The existing model places **796 midpoint events on the local day following their source row date**. The source does not independently confirm those individual event dates. In these annuals every nonmissing clock can be converted uniquely with IANA **after a date is assumed**; none happens to lie in a DST gap or repeated hour. Unique conversion does not validate the date assumption.

A separate conditional check attaches each source clock to the model-assigned local event date and compares absolute UTC instants. That assumption produces **20 day-scale disagreements**, up to 1,439 minutes: 18 beyond the original hour-scale residuals and two overlapping them. These are **not proven source errors**. Around civil midnight, clocks one minute apart under a circular score can be nearly a day apart under an incorrect same-date assignment. The source's missing event-date contract must be resolved before interpreting such differences as absolute accuracy.

The display candidate cannot fix these conditional UTC differences: it preserves the baseline instants exactly. Neither a high table-match percentage nor this diagnostic authorizes notifications.

## Additional 2024 interface spot checks

After the eleven-calendar evaluation, I generated 2024 annual tables through the live ARC interface for New York and Kiritimati. This is a retrospective same-publisher spot check, not an independent confirmation of ARC's timezone contract. The interface footer reports the selected map coordinates; its annual table contains Gregorian row dates and local clock columns, but no event UTC timestamps or event-specific dates.

On New York's 10 March and 3 November 2024 transition rows, the ordinary event-time-IANA labels differ from ARC by 59–60 minutes across all twelve checked cells. The already-declared UTC-date display hypothesis yields eleven exact clocks and one within one minute; the unchanged baseline has none exact on these two rows. The source itself does not say whether this is a timezone-label convention or a publication defect, and these are the same publisher and the same already-known transition pattern.

The Kiritimati table includes Thursday 29 February 2024 and Tuesday 31 December 2024. On the leap-day row, four of six markers are exact and two differ by one minute; the candidate is identical to baseline. On 31 December, all six match exactly and the candidate is again identical. Those model instants naturally fall on the previous UTC date for some events because Kiritimati is UTC+14; the table supplies local clocks and a Gregorian row date, not absolute timestamps. These checks show no demonstrated leap-year or date-line publication defect.

The detailed selected-cell transcript and replay are private. [Public aggregate and provenance](research/arc-2024-spot-check-2026-09-25.json) retain only counts and evidence hashes. The 2024 samples do not change the disposition: keep the display rule unconfirmed and label-only; do not change runtime calculations or notification eligibility.

## Decision and next step

Keep the successful rule as an **unconfirmed source-display hypothesis**. Do not use it as a local notification rule or promote it into the default model. The existing compatibility result retains `notificationEligible: false` and actual event-time IANA formatting.

Confirmation requires the publisher's event-date and timezone contract, ideally with sample absolute timestamps spanning northern and southern transitions and midnight. For a future notification adapter, retain source row date, event local date, IANA zone, numeric event offset, UTC instant, timezone-data version and source provenance as separate fields. Check their consistency and handle missing, repeated or nonexistent local times explicitly. This is a proposed integration contract, not a claim that the current ARC response supplies those fields.

[Aggregate evidence and hashes](research/utc-date-display-2026-09-25.json) preserve all groups and losses without redistributing calendars. Independent Python/source verification checked **24,108 scored fields**, **28,126 original seven-marker fields**, **4,018 city-days**, 26 summary groups and all 25 frozen file hashes. Source-free checks cover gaps, folds, a skipped date, fractional offsets and the dateline. This verifies calculations and data handling for the stated collection, not source-confirmed timestamps or independent astronomy. Runtime: IANA 2026d.
