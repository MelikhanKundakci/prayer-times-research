# Compare an explicit calendar plan

`validation/index.mjs` exports **`compareCalendars(options)`**. It compares supplied minute clocks with supplied UTC predictions. It calculates no prayer times, reads no files, makes no network calls, and does not certify a source or a method.

The examples and tests use invented clocks only. Institutional calendars are intentionally absent from the repository.

```js
import { compareCalendars } from '../validation/index.mjs';
import { syntheticExample } from '../validation/synthetic-example.mjs';

const result = compareCalendars(syntheticExample);
console.log(result.overall);
// 2 planned slots, 1 compared, 0 exact, 1 within one minute, 1 not compared.
```

From the repository root, run the isolated validation tests with the pinned timezone data:

```sh
node core/timezones/with-tzdata.mjs --test tests/validation.test.mjs
```

## Required input contract

Every comparison explicitly supplies `plan`, `references`, `predictions`, `mode` and `zeroClockPolicy`. Plain own-data records and dense arrays are required; unknown fields, duplicate cases/dates/mappings, malformed clocks and unplanned data are rejected. Caller objects are not modified.

```js
{
  plan: [{
    id: 'invented',
    timeZone: 'UTC',
    dates: ['2026-01-01'],
    fields: [{ reference: 'dawn', predicted: 'fajr' }]
  }],
  references: [{
    id: 'invented', status: 'parsed',
    days: [{ date: '2026-01-01', events: { dawn: '06:00' } }]
  }],
  predictions: [{
    id: 'invented',
    days: [{ date: '2026-01-01', events: {
      fajr: { utc: '2026-01-01T06:01:00Z' }
    } }]
  }],
  mode: 'printed-date',
  zeroClockPolicy: 'unresolved'
}
```

The plan supplies the denominator. Each planned date/field combination yields exactly one output row, including absent source or prediction cases, absent dates/fields, and explicit nulls. Missing values never count as exact agreement, including when both sides are missing. Dates must be valid Gregorian dates in2000–2099. A call supports at most10,000 case-days and100,000 slots.

Reference fields accept only `HH:mm` or `null`. A source parser must separately preserve its original text and provenance, then explicitly map a source placeholder to null when justified. This utility does not guess whether a dash, empty string or `00:00` denotes a missing astronomical event. Entire failed sources are represented by `{id, status:'unavailable', reason:'backend-error-no-calendar', days:[]}`; they retain all planned slots. There is no retry or acquisition orchestration in this utility.

Prediction fields accept `{utc, reason?}`. `utc` is either null or an absolute ISO instant ending in `Z`, at a whole minute (`:00Z` or `:00.000Z`). The function rejects offset-only strings and nonzero seconds. Before comparing a method's output, the caller must deliberately choose its public event and rounded UTC field. The utility never chooses a rounding rule or converts a raw second-resolution event into a displayed minute.

Input rows must be limited to planned dates and fields. For a full-year forecast against one source month, select that month before calling. Reference/prediction field names may differ; the mapping is explicit. Reusing one prediction field for multiple reference fields is rejected.

## Clock interpretation is a declared assumption

- **`printed-date`** assigns each source clock to its printed Gregorian date in the explicitly supplied IANA timezone. This is the primary literal interpretation.
- **`conditional-isha-after-maghrib`** additionally requires `conditional:{ishaField:'isha',maghribField:'maghrib'}`. Only the named Isha source field changes: if its printed clock is strictly earlier than the available Maghrib clock, it is assigned to the next Gregorian date. Equal Isha and Maghrib clock strings retain the printed date; no positive separation is invented. The field names need not be the literal names in this example. This is a conditional chronology inference, not a discovered publisher algorithm or religious rule. A missing, unresolved or ambiguous Maghrib anchor leaves only this Isha comparison unavailable. The anchor may be an additional reference field even when not scored.

Run these modes separately and preserve both results. The conditional result must not overwrite the printed-date result or be selected after inspecting whichever score is better. An inferred next date beyond2099 remains unavailable rather than extending the source-date domain silently.

`zeroClockPolicy:'unresolved'` treats exactly `00:00` as ambiguous source notation. Other `00:xx` clocks remain ordinary clocks. `zeroClockPolicy:'literal'` explicitly treats `00:00` as local midnight. Neither policy proves what a publisher intended.

Local source clocks are resolved against actual loaded IANA data. The resolver enumerates UTC minutes over the full surrounding range for modern offsets within±24hours, retaining every matching instant. Repeated DST clocks have multiple candidates and remain unresolved; nonexistent clocks, including a skipped civil date, remain unavailable. The predicted instant does not break a source-clock tie. A bounded cache is reused across fields. No day-boundary offset is silently applied to the whole date.

The result reports the actual Node, ICU and timezone-data versions. Use the provided fresh-process launcher for reproducible timezone data. Running under a different host `TZ` does not change explicit-IANA comparisons, but different IANA database versions can legitimately change civil-time results.

## Results and limits

Each row includes source clock, interpretation status, assigned date, conditional-inference flag, all candidate source instants, resolved source UTC if unique, predicted UTC and its actual local date/clock, unavailable reasons, and signed `deltaMinutes`.

**The delta is predicted UTC minus interpreted source UTC.** It is never reduced modulo24hours. A one-day error is1,440minutes even if the displayed clock strings match. Summary groups retain total/compared/not-compared counts, exact and±1minute counts, maximum absolute difference, a signed histogram, local-date mismatches and unavailable categories, overall and per case/field.

These are differences between displayed minute values. They are not subminute accuracy estimates, a proof of the source's rounding convention, or a religious-window validation. Point identity, source authenticity, source dates, beginning-versus-congregation semantics, timezone intent, and rights to use the source must be established outside this comparator. Explicit UTC interpretation can expose a suspected publisher clock error; the utility does not repair it or infer the backend cause.
