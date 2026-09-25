# Banuri Town: rule evidence and the Zawal distinction

Reviewed on 25 September 2026. This identifies Banuri Town's own published positions, not a rule for every Hanafi institution. No prayer-time API or new calendar rows were used in this review.

## Inspected primary evidence

| Publication | Supported rule | Scope |
|---|---|---|
| [Fatwa 144707100380](https://www.banuri.edu.pk/readquestion/144707100380/25-12-2025), URL dated 25 December 2025 | Fajr and Isha at solar depression 18° | An explicit instruction for making timetables; no ephemeris or rounding specified |
| [Fatwa 143409200025](https://www.banuri.edu.pk/readquestion/143409200025/21-07-2013), URL dated 21 July 2013 | Asr when the additional shadow is twice the object's length, excluding its noon shadow | Supports factor two, not a generic identification of every Karachi preset |
| [Fatwa 143406200082](https://www.banuri.edu.pk/readquestion/143406200082/20-04-2013), URL dated 20 April 2013 | Dhuhr after five minutes have passed from the Zawal time listed in a calendar | The answer discusses a reader in the UK; it does not publish software, a rounded/raw distinction, or an astronomical algorithm |

The date in a site-wide header changes; it is not the ruling's publication date. The two 2013 pages were verified from their full public HTML after the web extractor failed. The new Dhuhr evidence specifies a wait after a calendar marker. It does not justify relabeling solar transit itself as Dhuhr.

The locally retained 20 April 2013 page retrieved in this audit has SHA-256 `1d0f148cece1d5c3095eb503ee4c2a80b730c857b62ce4a61c75e80e5d4393d8`; the source HTML is not redistributed. A later fetch can differ because of the surrounding website content.

## Additive implementation

The default `strict` profile retains its historical unresolved Dhuhr field. The optional `zawal-plus-five` profile implements the stated wait using our calculated Zawal **proxy**:

```text
Z = nearest whole UTC minute of the existing model's solar transit
Dhuhr = Z + 5 elapsed minutes
```

This is an explicit modeling choice: the source's printed Zawal is approximated by our rounded transit. It is not a finding that Banuri computes this marker with the same ephemeris or rounding. The adapter leaves Fajr, sunrise, transit, Asr, sunset and Isha unchanged. It uses an absolute instant for addition, then derives the local date, including rollover.

The Dhuhr output contains `resolution: "minute"`, `basisUtc`, and `rawUtc: null`. A `:00` UTC suffix serializes a minute marker; it supplies no evidence for second-level religious precision. The profile remains unofficial and ineligible for automatic notifications.

```sh
node scripts/run.mjs banuri-town --input methods/banuri-town/examples/zawal-plus-five-input.json
```

The [example output](examples/zawal-plus-five-output.json) is generated locally, not a publisher reference.

The [adapter](implementation/zawal-plus-five.mjs) is original code; the prior kernel is unchanged. [Regression coverage](../../tests/banuri-zawal-rule.test.mjs) checks default preservation, the six unaffected events, minute-only inputs, exact elapsed addition, date rollover, and execution without network or calendar access.

## Validation boundary and next gap

The archived comparison measured **Zawal**, not an independently labeled Dhuhr start. Its 946/1,098 result remains attached to the original six-marker comparison. There is no new Dhuhr exactness percentage and no new held-out calendar result. Applying +5 to both predicted and reference Zawal would merely retain the same error and would not independently validate Dhuhr.

The remaining mathematical gaps are the production Zawal point/rounding and the horizon/solar-coordinate convention. A separately linked perpetual Karachi chart does not by itself prove that every monthly web table is perpetual. The archived calendar-year ambiguity remains. No high-latitude rule or wider geographical scope is introduced.
