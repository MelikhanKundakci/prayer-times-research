# Calculation architecture

## Primary app calculation path

The app's primary calculation direction is an **explicit local point and documented rule profile**, implemented in [`core/local/`](../core/local/README.md). The first profile, `diyanet-published-point-v1`, solves continuous solar events for supplied coordinates, then applies the profile's published event rules and margins. GPS supplies latitude and longitude; the caller must also supply the appropriate IANA time zone because coordinates alone do not resolve one.

This point-specific model is separate from the existing city-calendar reconstruction and comparison work. It does not look up a city timetable, import stored city corrections, or claim to reproduce Diyanet's undisclosed production algorithm. See the [local rule contract](../core/local/RULES.md) and [independent validation contract](LOCAL-VALIDATION.md). In the original profile, northern Fajr/Isha require the [ordinary-event annual guard](../core/local/NORTHERN-ORDINARY.md); unresolved seasonal cases and horizon substitutions remain `policy-blocked`. Annual point contexts are computed locally and cached with a four-entry limit; returned diagnostics cannot mutate the cache. The separate `local-northern-seasonal-v1` profile adds a [fully defined local summer policy](../core/local/SEASONAL.md), with frozen annual night fractions and a bounded smooth transition. The same four-entry cache holds optional seasonal contexts. It preserves independent raw astronomy and labels all blended/substituted twilight as estimated. Local point output is not proof of observed or religious superiority, second-level accuracy, or notification eligibility.

## Three boundaries

- `methods/<family>/implementation/` contains extracted numerical models and explicitly named variants.
- `core/` contains shared numerical helpers and the verified timezone bundle.
- `validation/` compares results with supplied reference data. It is outside the calculation path.

Calculation modules do not load official prayer calendars, contact a prayer-time API, or correct their outputs from a stored city/date table. Published reference measurements live in `validation.json` files and documentation, not in the numerical recipe.

The local point path makes this boundary visible in its output: `astronomy.events` contains raw solar events and `events` contains selected profile times. Source-based rule policy sits between those layers. Raw geometry is not silently promoted to a prayer beginning where a seasonal policy is required.

## Public entry points

Each research family exports `calculate(options)` from `index.mjs` and keeps additional relevant named entry points accessible. Those research wrappers translate arguments to documented native functions; they do not merge incompatible religious semantics. For local point calculations, `core/local/index.mjs` exports `calculateLocalDay({date, latitude, longitude, timeZone, profile})`; `core/local/schedule.mjs` exports `calculateLocalSchedule()` and `nextLocalPrayer(schedule, nowEpochMilliseconds)`, preserving actual event dates and selecting by absolute instant. A loopback-only browser prototype uses the schedule API for a seven-day view and next-prayer display; see [`examples/local-app/README.md`](../examples/local-app/README.md).

The input under `examples/input.json` is the exact object accepted by that family's public entry point. Annual seasonal reconstructions require a whole year because their transition anchors depend on the surrounding season. The local point profile accepts one civil date and a supplied point/time-zone pair; its complete coverage is conditional on implemented event rules. Read the relevant contract instead of assuming every method accepts an arbitrary point or provides all events at all latitudes.

Native output shapes are preserved. For example, a researched table marker can remain `asrTable` rather than being presented as a confirmed Asr beginning. Unspecified fields and absent solar events remain null or unavailable with reasons.

## Reproducible timezone runtime

`scripts/run.mjs` starts a new Node process through `core/timezones/with-tzdata.mjs`. ICU needs the resource directory before initialization. The launcher verifies resource hashes and the loaded timezone version before running a calculation.

The public tests use the same launcher. Node 26.7.0 is the checked publication runtime. Other runtimes must be validated explicitly, especially where Hijri-calendar conversion or ICU behavior is part of a model.

## Extraction provenance

`provenance/source-map.json` maps exported modules to the research modules from which they were extracted and records hashes and adaptations. `provenance/entrypoints.json` identifies the entry modules used by each family.

Arithmetic should remain unchanged by import relocation. The publication checks compare exported calculations with the corresponding original local modules and record their scope. This parity check is distinct from matching an institution's original calendar.

The public repository intentionally has its own test count. The larger research workspace's cumulative historical test count does not imply that all those tests, original datasets, or native GPL-dependent experiments are present here.

## Shared local event-rule registry

[profiles.mjs](../core/local/profiles.mjs) is the single source for the 23 local profile definitions in version 0.6.0. The six prior profiles remain available; 16 compositions combine four sourced Fajr/Isha angle pairs, Asr factors 1/2, and physical-only or opt-in angle/night twilight handling. A separate Diyanet-criteria profile opts into SPA astronomy. Each event declares its solar-rule kind, role, evidence, margin, quantization and resolution. Definitions are deeply frozen; `getLocalProfile(id)` returns one immutable definition, while `listLocalProfiles()` supplies detached records for consumer interfaces. Profiles are selected explicitly, never inferred from coordinates.

The 16 compositions and the opt-in Diyanet profile explicitly select the Reda–Andreas SPA point implementation; the six earlier profiles retain their prior USNO numerical model. Both use the shared event-selection layer with profile-specific twilight/horizon parameters and shadow factors. [selection.mjs](../core/local/selection.mjs) quantizes raw UTC instants, when specified, before adding elapsed margins. Only profiles declaring a northern policy build an annual northern context; other profiles do not inherit its substitutions. The context uses the profile's solar provider for every padded day, records it in metadata, and includes it in its cache identity. This keeps the two Diyanet point models isolated without changing the separate city-calendar reconstruction. See the [SPA assumptions and implementation evidence](../core/astronomy/SPA-POINT.md).

The output separates geometry markers from five `prayer-start-model` fields. Egypt/FCNA angle-only profiles intentionally retain noon, shadow and sunset markers; the separately named local compositions provide complete five-prayer model outputs under explicit project conventions. The Kemenag continuous-point adaptation applies its source-example minute operations inside a stated input domain. See [the profile guide](../core/local/PROFILES.md), [composition rules](../core/local/COMPOSED.md), and [independent parameter/profile verification](../core/local/verification/profiles-README.md).
