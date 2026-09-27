# Executed open-source local-relative comparison

Reviewed and run on 27 September 2026. The useful discovery is an openly described family of summer estimation rules, not an existing library that can be assumed to solve every institutional exception. We executed the candidate implementations before adopting our own [documented MWL local interpretation](LOCAL-RELATIVE.md).

The retained [machine-readable report](verification/oss-relative-2026-09-27.json) measures **software behavior**, not agreement with official calendars or observed twilight. No institute was contacted and no prayer calendar/API was acquired for this comparison. The application does not depend on these libraries at runtime.

## Fixed comparison

All runs use the same six public demonstration points: Frankfurt, Berlin, Edinburgh, Oslo, Ushuaia and Tromsø; MWL-labelled 18°/17° twilight; Asr factor one; no user offsets; and each library's `LocalRelativeEstimation` selection. Toolchains, dependencies and source revisions are retained. mawaqit v0.5.0 and go-prayer cover every day of 2026–2028, including the leap day. The previously researched mawaqit v0.4.0 is additionally replayed for 2027.

| Implementation | Exact source revision | Planned city-days | All six event fields present | Adjacent available event-order violations within a source day |
|---|---|---:|---:|---:|
| go-prayer v1.1.1 | `02a763f9afd0eba1d93489bd9a47370695aba44b` | 6,576 | 5,906 | 0 |
| mawaqit v0.5.0 | `aa31f98b0128e54c936b6e8e37841102ce90d454` | 6,576 | 5,480 | 85 |
| mawaqit v0.4.0 | `50f18017317a6858058fb8734a68fd415073f5e7` | 2,190 | 1,825 | 27 |

An event field being present does not mean it has a correct date, adopted religious rule or measured accuracy. All five nonpolar points have every field populated in these runs. Tromsø accounts for the missing/error days: go-prayer leaves ordinary calculations and their unavailable events; mawaqit rejects the point's out-of-scope or missing-horizon cases. No missing/error row is removed from the denominator. No cross-night `Isha >= next Fajr` violation was found among available paired outputs, although the within-day mawaqit inversions remain failures.

The shared analyzer compares **unwrapped UTC phase**, `event epoch − UTC midnight(source date)`. It never hides a date error by reducing an instant modulo 24 hours. Thus its largest phase difference is not necessarily a clock-of-day jump. The distinction matters for mawaqit's date issue below. DST display changes are excluded from this metric. The Go run used host tzdata 2026c-rearguard; our local engine uses pinned 2026d. mawaqit accepts a `NaiveDate` and returns UTC instants without a named-zone lookup; its transitive `iana-time-zone` crate is not evidence of a pinned zone database. Different solar providers, rounding and date conventions mean this is not a controlled accuracy contest between astronomical engines.

## Concrete findings

### mawaqit: useful method, return transition and date problems

The [pinned implementation](https://github.com/sniper1720/mawaqit/tree/aa31f98b0128e54c936b6e8e37841102ce90d454) includes a shared annual Isha/night ratio and transition logic. Its [return branch](https://github.com/sniper1720/mawaqit/blob/aa31f98b0128e54c936b6e8e37841102ce90d454/src/schedule.rs#L984-L1027) can immediately choose a real event when two neighboring **raw** events are stable, without completing the return from the previously selected estimate.

Two observed Oslo 2027 examples, in UTC:

| Event | Last alternative | Next actual | Daily clock change |
|---|---|---|---:|
| Fajr | 24 August, 01:51:44 | 25 August, 00:24:00 | −87 min 44 s |
| Isha | 19 August, 20:42:19 | 20 August, 22:24:00 | +101 min 41 s |

These same witnesses occur in both tested versions. They are actual transition behavior, not an inferred consequence of reading code.

A separate date-order issue appears when the [transition rebases yesterday's clock component onto the current UTC date](https://github.com/sniper1720/mawaqit/blob/aa31f98b0128e54c936b6e8e37841102ce90d454/src/schedule.rs#L996-L1012). At Frankfurt, source 30 May 2027 has Fajr `2027-05-29T23:46Z`; source 31 May has Fajr `2027-05-31T23:51Z`, **after that row's sunrise** at `2027-05-31T03:22Z`. In Berlin time that second Fajr belongs to 1 June. The clock component moves only five minutes, but its assigned date gains an extra day. Our harness supplies the API's documented source `NaiveDate` and preserves returned instants; it does not add this day. Merely changing display timezone cannot repair the ordering.

The retained analyzer therefore records a 1,445-minute unwrapped phase change for this pair. We do **not** describe it as a 1,445-minute clock-of-day jump or silently shift the library result to make it pass.

### go-prayer: a distinct interpretation with incomplete transition control

The [pinned local-relative adapter](https://github.com/hablullah/go-prayer/blob/02a763f9afd0eba1d93489bd9a47370695aba44b/5-high-lat-local-relative.go) computes separate Fajr and Isha averages and approximates night length as 24 hours minus the same day's daylight. These differ from a shared Isha fraction using consecutive actual sunset/sunrise. Its eligible-day selection is not our two-sided ten-minute disturbance classification. If any day lacks sunrise or sunset, the adapter returns the annual ordinary schedule unchanged.

In Frankfurt, Fajr moves from `2027-06-21T01:18:44Z` to `2027-06-22T01:50:56Z`: **32 min 12 s** of daily phase change. In Oslo, Fajr changes by **−24 min 15 s** on 21→22 April 2027. The five nonpolar points have complete output, but that alone does not verify smooth transitions. The polar series also contains a larger Isha phase change; it is retained in the full report rather than being presented as a nonpolar transition result.

The library's Diyanet label is an angle preset, not evidence of the current Diyanet northern production procedure. Neither tested library establishes that worldwide reproduction.

## What we applied

The independent local implementation keeps the useful annual-ratio approach while specifying the unresolved engineering choices: one Isha-derived fraction for both prayers, actual adjacent nights, one mean year for a complete joint season, unwrapped event dates, and both entry and return anchors. Every estimated segment must pass its step, night-bound and chronology checks before supplying times. Older calculations are preserved under their existing IDs.

Read [LOCAL-RELATIVE.md](LOCAL-RELATIVE.md) for equations, local deviations from the source's joining rule, scope, API and independent checks. The implementation is optional and MWL-only. It does not generalize this rule to Diyanet, Karachi, ISNA, Egyptian, Kemenag, JAKIM or Umm al-Qura. Their institution-specific questions still require their own evidence.

## Reproduce and inspect

The [Go harness](../../scripts/oss-relative/go/) and [Rust harness](../../scripts/oss-relative/mawaqit/) pin the tested versions and retain dependency locks. They emit UTC JSONL without substituting failed values. Install their documented toolchains separately if regenerating the original outputs; no Rust or Go installation is required by the app or its normal tests.

Compressed generated outputs and the Rust runtime metadata are retained in [verification/oss-relative](verification/oss-relative/); the [Go metadata](../../scripts/oss-relative/go/metadata.json) records its runtime. SHA-256 pins cover both compressed files and their decompressed original bytes. The report also pins the analyzer and harness source. These are generated software outputs, not redistributed institutional calendars.

From the repository root, replay all retained statistics offline:

```sh
node scripts/oss-relative/report.mjs
node core/timezones/with-tzdata.mjs --test tests/oss-relative-analysis.test.mjs tests/local-relative-evidence.test.mjs
```

Both upstream projects identify their source code as MIT-licensed. We retain source links and versions; their code is not copied into the local calculation engine. Initial harness dependency installation needs internet access. Numerical agreement between two libraries would still not be independent institutional or observational validation.
