# MWL-labelled local relative summer estimates

This optional, versioned calculation fills missing or unstable MWL twilight with a local annual night fraction and bounded entry/return transitions. It runs entirely offline at the supplied coordinates. It is a **declared local interpretation**, not a recovered institutional backend, an official Diyanet method or a measurement of observed dawn accuracy.

The two profiles are `sunni-mwl-shadow1-local-relative-v1` and `sunni-mwl-shadow2-local-relative-v1`. They use the unchanged MWL physical profile: Fajr 18°, Isha 17°, SPA astronomy, a flat −50′ horizon, the selected Asr shadow factor and transit +1 minute for Dhuhr. The other four events keep their original values. Ordinary, undisturbed Fajr/Isha also remain unchanged. The frozen catalogue default still uses physical crossings only; the browser’s [automatic settings](../../examples/local-app/AUTOMATIC-SETTINGS.md) now select this separate interpretation.

## Evidence and explicit choices

The International Astronomical Center's [Arabic account of the 2009 committee method](https://astronomycenter.net/latitude.html?l=ar) supports the annual shared fraction, disturbance criterion and entry/return transitions. Its account concerns European locations between 48.6° and 66.6°. The source does not fully specify a modern point-calculation API. These choices make our interpretation reproducible:

| Component | Implementation and evidence boundary |
|---|---|
| Normal signs | Keep the actual event unless either available adjacent day's phase differs by **more than 10 minutes**, following the source's disturbance criterion. |
| Missing signs | Require proven continuous summer absence of the threshold crossing. A failed solver, tangent or ambiguous date is not permission to estimate. |
| Local night | Fajr uses previous sunset to current sunrise; Isha uses current sunset to next sunrise. Both are positive elapsed UTC intervals shorter than 24 hours with actual horizons. This date pairing is an explicit convention. |
| Annual fraction | Arithmetic mean of `(Isha − sunset) / (next sunrise − sunset)` on days with present, undisturbed Isha. The **same fraction** serves both prayers. Missing or disturbed Isha days are excluded; unresolved context blocks the fraction. |
| Year ownership | Use the Gregorian year in which the complete episode starts where **either** Fajr or Isha needs replacement. Each prayer keeps its own anchors. This local choice prevents a southern summer episode from changing its fraction on 1 January. |
| Clock frame | Compare raw UTC epoch minus UTC midnight of the source civil date, without wrapping into 0–24 hours. This declared frame preserves event dates and excludes daylight-saving display changes from the disturbance test. |
| Transitions | Use both undisturbed actual anchors. The envelope below enforces at most five minutes per source day for every adjacent pair touching the replacement segment, including its return to actual signs. |
| Joining the target | Our conservative envelope reaches the candidate without the source's within-five-minute snap. Short overlapping ramps use the same envelope. These are **project choices**, not claims of exact source-program parity. |
| Latitude | Estimation is restricted to absolute latitude 48.6°–66.6°. Applying the European account symmetrically to the southern hemisphere is explicitly a local extension. |

The source does not establish the catalogue's complete ordinary 18°/17° recipe, current adoption everywhere, or any Diyanet rule. Other method families do not automatically inherit this option.

## Equations and guards

Let `q` be the annual mean above, `S`/`R` the appropriate actual night endpoints, and `C` the candidate:

```text
Isha candidate = S + q × (R − S)
Fajr candidate = R − q × (R − S)
```

For a replacement day `k` days after the left actual anchor and `n` days before the right anchor, let `A`, `B` and `C` be their unwrapped UTC phases. With `step = 5 minutes`:

```text
Isha phase = max(C, A − k × step, B − n × step)
Fajr phase = min(C, A + k × step, B + n × step)
```

Both anchors must be ordinary under the two-sided disturbance test. The complete segment is rejected if its anchors cannot be joined, any selected event falls outside its actual night, or any consecutive selected step exceeds five minutes. The day and schedule also check event ordering, including `sunset < Isha < next Fajr < next sunrise`. A complete result is an internally consistent selection under these rules, not institutional approval.

Within the core's 2001–2098 date range, estimation requires complete adjacent-year context and is enabled for 2002–2097. Outside that estimation range or latitude band, the ordinary physical profile is retained; absent physical events remain unavailable. Polar day/night is not supplied with artificial horizons. Coordinates, timezone, atmosphere and the chosen religious rule still limit real-world interpretation; seconds display adds resolution, not certainty.

## Use and trace

```sh
npm run calculate:local -- 2027-06-21 50.1109 8.6821 Europe/Berlin sunni-mwl-shadow1-local-relative-v1
```

```js
import {calculateRelativeDay, calculateRelativeSchedule} from './core/local/sunni-relative.mjs';
const day = calculateRelativeDay({
  date: '2027-06-21', latitude: 50.1109, longitude: 8.6821,
  timeZone: 'Europe/Berlin', profile: 'sunni-mwl-shadow1-local-relative-v1',
});
console.log(day.events.fajr.status); // estimated
console.log(day.events.fajr.selection.segment.annualRatio);
```

In the browser, automatic **MWL** settings select this interpretation. For manual choices, open **Advanced settings**, turn off automatic settings, then use **Short nights → MWL 2009 · local summer transitions**. All three UI languages explain the scope. Estimates carry the mode, actual night, both anchors, annual sample counts, mean year and fraction. `astronomy` retains the unmodified physical events. Failed policy checks clear selected time fields rather than returning a fallback clock. Returned diagnostics are detached from bounded point/year caches.

## Verification

The retained [annual verification report](verification/local-relative-2026-09-27.json) covers every day of 2026–2028 at Frankfurt, Berlin, Edinburgh, Oslo, Ushuaia and Tromsø, with both Asr factors. The independent verifier reconstructs annual means and transition selections from raw solar events, checks the entire sequence including year seams, and compares unchanged events against the physical API. Focused regressions additionally cover short gaps, leap day, DST, ±180° aliases, invalid inputs, cache isolation and unavailable horizons.

The replay passed **13,152 profile-days**, including **4,958 independently reconstructed estimates** and **5,014 adjacent pairs** involving an estimate. The maximum raw phase step for those pairs was exactly **300,000 ms (5 minutes)**, with zero arithmetic difference in the independent envelope check. Thirty-six ten-day schedules passed chronology checks. Monthly physical-profile comparisons checked 1,728 unchanged non-twilight events. There were no selected within-day or cross-night order inversions in the grid.

Frankfurt, Berlin, Edinburgh, Oslo and Ushuaia each have all six selected events on **1,096 / 1,096 days** across the three years for each Asr factor. Tromsø remains incomplete: outside the estimate band, the physical profile and its absent horizons are retained. Normal physical twilight can move by more than five minutes; the five-minute bound applies to transitions involving an estimate, not to every ordinary day. No nonpolar tested daily twilight phase change exceeds ten minutes.

These are measured bounds in this grid, not worldwide guarantees or error percentages. Cold annual context in the tested runtime took roughly seven seconds; the full verification took about seven minutes. Calls at a previously calculated point reuse bounded caches. The mobile implementation will need to move annual preparation off the UI thread.

The [open-source comparison](OSS-COMPARISON.md) measures existing implementations separately. Different solar providers and policy interpretations make clock differences unsuitable as an accuracy ranking. We measure completeness, chronology and seasonal jumps; none is an official-calendar accuracy percentage.

```sh
node core/timezones/with-tzdata.mjs scripts/verify-local-relative.mjs
npm test
npm run check
```

The full replay takes several minutes. The ordinary test suite pins the published report to its numerical dependencies and verifier so changes require fresh evidence.
