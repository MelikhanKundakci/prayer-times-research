# Calculation architecture

## Three boundaries

- `methods/<family>/implementation/` contains extracted numerical models and explicitly named variants.
- `core/` contains shared numerical helpers and the verified timezone bundle.
- `validation/` compares results with supplied reference data. It is outside the calculation path.

Calculation modules do not load official prayer calendars, contact a prayer-time API, or correct their outputs from a stored city/date table. Published reference measurements live in `validation.json` files and documentation, not in the numerical recipe.

## Public entry points

Each family exports `calculate(options)` from `index.mjs` and keeps additional relevant named entry points accessible. The wrapper translates arguments to a documented native function. It does not add a new astronomical formula, choose a method by geography, or merge incompatible religious semantics.

The input under `examples/input.json` is the exact object accepted by that family's public entry point. Annual seasonal models require a whole year because their transition anchors depend on the surrounding season. Other models accept an individual date, a date range, or a named geographic zone. Read the family contract instead of assuming every method accepts an arbitrary global point.

Native output shapes are preserved. For example, a researched table marker can remain `asrTable` rather than being presented as a confirmed Asr beginning. Unspecified fields and absent solar events remain null or unavailable with reasons.

## Reproducible timezone runtime

`scripts/run.mjs` starts a new Node process through `core/timezones/with-tzdata.mjs`. ICU needs the resource directory before initialization. The launcher verifies resource hashes and the loaded timezone version before running a calculation.

The public tests use the same launcher. Node 26.7.0 is the checked publication runtime. Other runtimes must be validated explicitly, especially where Hijri-calendar conversion or ICU behavior is part of a model.

## Extraction provenance

`provenance/source-map.json` maps exported modules to the research modules from which they were extracted and records hashes and adaptations. `provenance/entrypoints.json` identifies the entry modules used by each family.

Arithmetic should remain unchanged by import relocation. The publication checks compare exported calculations with the corresponding original local modules and record their scope. This parity check is distinct from matching an institution's original calendar.

The public repository intentionally has its own test count. The larger research workspace's cumulative historical test count does not imply that all those tests, original datasets, or native GPL-dependent experiments are present here.
