# mawaqit Local Relative Estimation benchmark

This standalone harness compares annual schedules produced by pinned revisions of the [`mawaqit`](https://github.com/sniper1720/mawaqit) Rust library. It is for implementation-behavior analysis; it is not an independent accuracy validation and does not establish equivalence with Diyanet or another institution.

The default manifest pins v0.5.0 at commit `aa31f98b0128e54c936b6e8e37841102ce90d454`. The alternate manifest in `v0.4/` pins v0.4.0 at commit `50f18017317a6858058fb8734a68fd415073f5e7`. Each manifest has its own lockfile. Both harnesses accept a calendar year argument (default 2027) and write one JSON object per city/date to stdout:

```sh
cargo run --locked -- 2027 > mawaqit-v0.5.0-2027.jsonl
cargo run --locked --manifest-path v0.4/Cargo.toml -- 2027 > mawaqit-v0.4.0-2027.jsonl
```

The fixed locations are Frankfurt, Berlin, Edinburgh, Oslo, Ushuaia, and Tromsø. The method is Muslim World League (Fajr 18°, Isha 17°), Shafi madhab (Asr shadow factor 1), `LocalRelativeEstimation`, `polar_estimation = None`, and `Rounding::None`. Rows preserve calculation errors and never substitute values for failed dates. Successful v0.5 rows also include the library's Fajr/Isha status values.

The JSONL `events` values are UTC RFC 3339 timestamps or null when the library returns an error. The source repository identifies the library as MIT-licensed; this harness does not bundle third-party sources.
