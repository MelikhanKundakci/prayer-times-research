# SPA daily-coordinate comparison

This source-free experiment replaces only the apparent geocentric solar coordinates used by the existing Diyanet research recipes. It is **not an app method, official Diyanet implementation or notification-ready calculator**. The complete [calendar comparison](../../SPA-REFERENCE.md) rejects this candidate as a replacement.

## Run locally

From the root of the cloned `prayer-times-research` repository, using the pinned Node version:

```sh
node core/timezones/with-tzdata.mjs methods/diyanet/research/spa-reference/run.mjs \
  2026-09-02 64.1289 -21.9082 Atlantic/Reykjavik spa-utc00
```

Use `baseline` as the last argument for the unchanged USNO recipe. The command computes the whole year internally so northern seasonal anchors are available, then prints the requested day's raw adjusted and rounded event instants. Coordinates in this example are supplied points, not certified institutional production coordinates. No network service, calendar or city table is consulted.

`calculateCalendar(input, solarModel)` in [calendar.mjs](calendar.mjs) accepts `{year,latitude,longitude,timeZone}` and the explicit mode `baseline` or `spa-utc00`. It returns `{route,solarModel,timeConvention,official:false,notificationEligible:false,annual}`. The `annual` member is an audit copy of the inherited recipe result: its old profile/engine descriptions and reconstruction `solarVariant` retain their original USNO wording. **The outer `solarModel` identifies the active provider.** Those legacy descriptions are not evidence that SPA was bypassed. The CLI deliberately reports the outer identity and selected event data instead of those inherited labels.

The adapter context is synchronous and rejects nesting and Promise-returning callbacks. Six [audit copies](clones/methods/diyanet/implementation/north/solar.mjs) differ from the repository's existing recipes only in import targets. They preserve the same daily epoch, carrier selection, religious parameters, geometry, seasonal logic and rounding. The northern continuous-Asr diagnostic still uses its original USNO implementation and never selects an event time; the exported traces omit it. The southern continuous-event variant is not invoked.

## Astronomy and time scale

[astronomy/spa.mjs](astronomy/spa.mjs) implements the apparent geocentric subset of Reda and Andreas' [Solar Position Algorithm report](https://docs.nlr.gov/docs/fy08osti/34302.pdf). It includes the complete longitude/latitude/radius series used by SPA, all 63 nutation terms, aberration, apparent right ascension, declination and equation of time. It does not implement topocentric parallax, atmospheric refraction or continuous event solving.

The raw API `solarCoordinates(jdUtc,{deltaTSeconds:69.184})` returns declination and right ascension in **degrees**, and equation of time in **minutes**. The adapter converts to the inherited API's hours. The experiment assumes `UT1=UTC` and `TT=UT1+69.184 seconds`, at the unchanged solar-carrier UTC00 sample. This fixed diagnostic assumption is not a Diyanet specification or a future leap-second prediction. The report's worked example uses its own deltaT of 67 seconds.

## Licensing and reproduction

The coefficient tables were extracted from pinned [pvlib-python v0.13.1 spa.py](https://github.com/pvlib/pvlib-python/blob/v0.13.1/pvlib/spa.py). The complete [BSD-3-Clause notice](astronomy/vendor/LICENSE-pvlib) applies to those tables; preserve it and the attribution. The JavaScript equations are independently expressed from the documented procedure. No NREL program source or report PDF is redistributed here.

[Acquisition hashes](astronomy/vendor/acquisition.json) identify the privately downloaded reference files; they are not all bundled here. To regenerate the tables or independent fixture, place the exact upstream `spa.py` in `astronomy/vendor/`, then run [extract-coefficients.py](astronomy/extract-coefficients.py) and [generate-pvlib-fixture.py](astronomy/generate-pvlib-fixture.py). The first verifies its source hash; the second needs Python with NumPy. No such dependency or download is needed for calculations or the checked-in JavaScript tests.

The official worked example and 64 independently executed pvlib coordinate samples are checked by [spa.test.mjs](astronomy/spa.test.mjs). Their agreement verifies this implementation, not observed prayer-time accuracy. A separate private replay also checked all 1,095 unique carrier dates used by the complete calendar experiment.

[catalog.json](catalog.json) lists the 59 already exposed location/year inputs, without original source clocks. The public comparison contains all aggregate losses. Complete source-calendar scoring also requires the private archives; input hashes cannot substitute for those unavailable originals. [trace.mjs](transition-audit/trace.mjs) exposes model intermediates without source observations.
