# Export provenance

This repository is a source-only extraction from a larger prayer-time research workspace. Historical publisher calendars, HTTP responses, and internal working records are not redistributed here.

- [`source-map.json`](source-map.json) records the original research-relative identifier, source SHA-256, destination SHA-256, import rewrites, and declared extraction changes for each transferred file. Research identifiers are provenance labels, not paths promised to exist in this repository.
- [`entrypoints.json`](entrypoints.json) lists the selected native calculation functions and contracts.
- [`relocation-verification.json`](relocation-verification.json) records the local comparison of the original and exported modules, including one complete-output sample for each of the 22 selected entry points. Annual samples compare every day. This verifies extraction equivalence on those inputs; it is not a new comparison with institutional calendars.
- [`wrapper-parity.json`](wrapper-parity.json) extends that check to 158 public-wrapper/original-module comparisons: seasonal and leap-day inputs, northern calendars, several continents, the international date line, polar missing events, both Asr choices for FCNA, and all four Shia angle profiles with both solar engines. Its coordinates are test inputs, not certified institutional calculation points. The stored rendered-output hashes can be checked without the original archive.

The original archive is needed to independently repeat the historical source-to-export comparison. Public contributors can verify the exported hashes with `npm run check` and exercise the included examples, regression cases, and comparison tests with `npm test`. These checks do not independently reproduce the original institution-calendar accuracy measurements.

The public wrappers, CLI, comparison utility, tests, and documentation were added for this repository. They are outside the original-source map and have their own Git history. When intentionally improving a mapped numerical module, record the new version, rationale, validation and source-map lineage together; do not silently change the historical accuracy claim.
