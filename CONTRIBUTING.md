# Contributing

Thank you for helping make prayer-time calculations easier to understand, verify, and improve. Useful contributions include numerical fixes, independent implementations, better source evidence, clearer religious semantics, translation review, and reproducible calendar comparisons.

## Before changing a method

1. Read its README, `validation.json`, and open questions. Identify the exact institution, version, parameters, and event meanings involved.
2. Separate a numerical defect from a new reconstruction hypothesis. State what changes and why it follows from evidence.
3. Write down the intended test locations, dates, timezone version, rounding, and failure policy **before** inspecting new reference values.
4. Keep development data and genuinely new validation data separate. Once a dataset has informed a change, it is development data for later changes.

## Local workflow

```sh
npm ci
npm run check
npm test
node scripts/run.mjs --list
node scripts/run.mjs diyanet --example
```

Use Node 26.7.0 and the supplied launchers for the checked runtime. Add focused regression tests for meaningful behavior changes. Preserve old profile versions when a new hypothesis changes their meaning or published behavior.

For a calculation change, provide:

- the explicit equation, parameter, or branch change;
- the source supporting it, or a clear label that it is an empirical hypothesis;
- complete comparison denominators, including missing and unusable entries;
- exact matches, ≤1-minute matches, signed errors, maximum error, and local regressions;
- evidence from new places and/or dates that were not used to select the change;
- a statement of which production coordinates, religious rules, or source-date assumptions remain unconfirmed.

An aggregate improvement is not sufficient reason to hide a worse result in another city or prayer. Avoid unexplained city/day correction tables and post-hoc latitude switches.

## Adding a method or version

Create a lowercase directory under `methods/` with an `index.mjs` exporting `calculate(options)`, an `implementation/` directory, a README, `validation.json`, and `examples/input.json`. Register the family in `methods/index.mjs`. Document the input domain and event meanings before connecting it to the CLI. A new variant of an existing institution normally belongs in that institution's folder, with an explicit selector and its own evidence.

Keep calculations free of reference-calendar access. Share solar geometry through `core/` where its numerical convention actually agrees; preserve distinct ephemeris epochs, rounding, and religious rules where it does not. Add a case in `tests/cases.json` and a meaningful behavioral regression. `npm run examples:generate` refreshes generated examples and model snapshots; inspect the resulting differences before committing them. Regenerating a snapshot is not an accuracy validation.

Document new modules in Git and identify their authorship or upstream license. Extracted historical modules additionally have SHA-256 lineage in `provenance/source-map.json`; a deliberate change must update the recorded destination hash and explain its new version instead of claiming unchanged extraction. Preserve prior validation records and add a separate study for a changed recipe.

## Contributing references

Use public reference locations rather than personal home coordinates. Include the publisher, original URL, publication year, retrieval date, source hash, timezone interpretation, event definitions, and redistribution license or permission.

Full third-party calendars, PDFs, scraped HTML, authentication headers, and browser exports should not be added without a documented right to redistribute them. Where redistribution is unclear, contribute a source link, acquisition instructions, hashes, and derived aggregate findings. Do not include cookies, API credentials, private correspondence, or tracking data.

For source errors, preserve the original evidence locally and explain the error. A backend failure, unknown year, duplicate date, or placeholder must not become an exact match. For a repaired source contract, document the old failure and the new rule explicitly instead of rewriting the original experiment's history.

See [the validation protocol](docs/VALIDATION.md) for the public reference format and comparison tool.

## Religious interpretation and respectful discussion

Please identify the named authority or publication behind a rule. A technical pull request does not establish a ruling for every member of a tradition. Consult knowledgeable representatives where a religious specification is missing; preserve uncertainty in the implementation until it is resolved.

Discuss the specific criterion and evidence, and avoid claims that one community's practice makes another community illegitimate. See [the code of conduct](CODE_OF_CONDUCT.md).

## Pull requests

Keep each PR focused. Explain the previous and resulting behavior, affected method versions, new evidence, tests run, regressions, and limitations. The PR template helps capture these details. Do not mark a method “official”, “perfect”, or “production ready” solely because a finite sample matched.

By contributing original code or documentation, you agree to make that contribution available under the repository's MIT License. Third-party material retains its own license and must be identified separately.
