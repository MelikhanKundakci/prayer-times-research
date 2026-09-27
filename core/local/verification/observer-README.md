# Zero-elevation topocentric SPA check

This fixture checks a new, explicitly bounded solar-coordinate option against a separately executed implementation of the NREL Solar Position Algorithm (SPA). It is a calculation cross-check, not an accuracy score against an observatory, prayer calendar or observed prayer onset.

The reference runs the retained pvlib-python 0.13.1 SPA source. Its geocentric position is converted to an observer-relative position using the equations in the [NREL SPA report](https://docs.nlr.gov/docs/fy08osti/34302.pdf), equations 33–41: solar horizontal parallax, ellipsoidal reduced observer latitude, topocentric right ascension and declination, and topocentric geometric altitude. The observer elevation is fixed explicitly at **0 m**. Atmospheric refraction is set to zero in the position calculation; the selected event retains its declared fixed horizon threshold (−50 arcminutes by default). No terrain, skyline, weather, height inference or additional refraction model is introduced.

Transit is the topocentric meridian passage, `H′ = 0`; solar-cycle boundaries are the adjacent `H′ = ±180°` roots. The Asr altitude is derived from the same model's topocentric altitude at transit, then the descending topocentric altitude crossing is solved. This keeps the noon-shadow reference and afternoon crossing in one coordinate frame. It leaves the existing event angles and selected margins untouched.

## Frozen cases and result

The 371 unique declared inputs combine the existing 348-case SPA event grid, the separate 22-case northern/Istanbul grid (including both distinct Tromsø Isha-angle inputs despite their reused source labels), and a Bodø winter diagnostic. Nine civil-date transit ownership cases are rejected by both paths. On the remaining 362 cycles, the production implementation agrees with independent pvlib roots for 1,999 available event timestamps and 1,086 transit/cycle boundaries; 173 event fields are unavailable in both. The maximum timestamp difference is **0.000089 seconds**. The maximum noon/Asr angle difference is **3.63×10⁻¹⁰ degrees**. The reference root search uses a 0.0002-second tolerance; the JavaScript verifier allows 0.01 seconds. All unavailable crossings and ownership rejections are retained.

Comparing the topocentric events with the existing geocentric SPA implementation on these same inputs gives 1,996 paired event timestamps, 3 topocentric-only crossings, and no geocentric-only crossings. Thirty-three paired events change nearest-minute display label. The absolute time shift has median 0.640 seconds and 95th percentile 2.293 seconds. The maximum shift is 125.484 seconds at a deliberately near-tangent solstice sunrise case (65.73° latitude); it illustrates the sensitivity of a grazing crossing and is not representative of ordinary events. These are model differences only.

At the additional Bodø point (67.28324° N, 14.38305° E) on 2027-12-08, the topocentric-minus-geocentric shifts are +1.522 seconds Fajr, +5.881 sunrise, 0 Dhuhr, −0.199 Asr, −5.881 Maghrib and −1.549 Isha. Meridian Dhuhr is unchanged because solar parallax in right ascension is zero at the meridian. These figures test the new observer geometry; they do not establish that this model is closer to any published calendar.

## Reproduce

The checked-in fixture is consumed without Python, network access or file writes:

```sh
TZ=UTC node core/timezones/with-tzdata.mjs core/local/verification/observer-verify.mjs
TZ=UTC node core/timezones/with-tzdata.mjs --test tests/local-observer-reference.test.mjs
```

To regenerate the independent roots, use Python 3.9+ with NumPy and provide a separately retained pvlib 0.13.1 `spa.py` file. The generator checks the exact upstream source SHA-256 before running and checks both frozen input-grid hashes; it performs no download. For example:

```sh
python3 core/local/verification/observer-oracle.py /path/to/pvlib-0.13.1/spa.py --output /tmp/observer-reference-fixtures.json
```

The upstream source is [pvlib-python 0.13.1 `spa.py`](https://github.com/pvlib/pvlib-python/blob/v0.13.1/pvlib/spa.py), SHA-256 `ad7762ccca5fd9611ef9e2a9b1e37f95fe4c5b31628616b2ad3e84ea1e5f9202`. The frozen expected-results file SHA-256 is recorded in the verifier output. The fixtures inherit the declared sample scopes and source limitations of the two input grids; the near-tangent rows intentionally stress availability boundaries.
