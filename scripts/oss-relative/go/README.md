# go-prayer Local Relative Estimation output

This standalone benchmark harness calculates annual schedules with `github.com/hablullah/go-prayer` v1.1.1. That tag resolves to commit `02a763f9afd0eba1d93489bd9a47370695aba44b`.

It uses `LocalRelativeEstimation()`, MWL angles (Fajr 18°, Isha 17°), Shafii Asr (shadow factor 1), second precision, and no manual offsets. It emits one JSON object per city and local calendar date. Event values are UTC RFC 3339 timestamps or `null`; `error` is `null` for a successful calculation or contains the calculation error.

Run with Go 1.27.1 from this directory:

```sh
go run . > root-common.jsonl
```

The calculation asks Go to load the named IANA time zones from the host. Record the host tzdata version when comparing outputs. For the reference run in this repository, `/usr/share/zoneinfo/tzdata.zi` reported `2026c-rearguard`; event values are serialized in UTC.

The output records are for implementation-behavior comparison only. They are not independent accuracy validation, and this benchmark does not use or compare Diyanet published calendars.
