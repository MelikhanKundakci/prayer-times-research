# Local prayer-time browser prototype

Run the prototype from the `public/prayer-times-research` directory:

```sh
npm run preview:local
```

Open the printed address, normally [`http://127.0.0.1:4377`](http://127.0.0.1:4377). The server binds to loopback only. It calculates on the same computer and makes no prayer-calculation API requests or account connections.

Use that HTTP address rather than opening `index.html` as a file: the JavaScript modules and local calculation endpoints require the loopback server. The interface starts in **English** and offers **English, German and Turkish**. Only the selected language is saved in browser storage. Switching languages preserves the current inputs, calculated times, schedule and comparison; it makes no new calculation request. Clearing browser storage restores English. Location and calculation results are not stored by this language preference.

Custom compositions additionally offer **Observer-position correction** under **Solar calculation**. This opt-in adds 16 versioned profiles using observer-relative solar geometry and a consistent Asr noon shadow. The original geocentric calculation remains the default. Read the [observer model](../../core/local/OBSERVER.md) before interpreting its small differences: elevation, terrain and measured atmospheric conditions are not modeled, and improved agreement with Diyanet is not established.

The prototype lets you choose a sample location or enter coordinates, select a calculation profile, and calculate one day plus a seven-day schedule. It shows the next available prayer start within that seven-day window, marks estimated values, identifies unavailable events, explains the selected rules and source links, and can save the full result as JSON. The 16 composed profiles let you choose one of four sourced Fajr/Isha angle pairs, Asr shadow factor 1 or 2, and either physical crossings only or the optional angle/night estimate. A selected composition is a software rule combination, not a claim that a named institution publishes the full recipe.

The profile menu also has an optional `diyanet-published-spa-point-v1` choice. It applies the same selected Diyanet angles, margins and ordinary-only northern guard as the existing point profile, with SPA for daily astronomy and the annual guard. It does not change the existing USNO profiles or calculate unresolved Diyanet summer/transition times. This astronomy option does not claim better agreement with Diyanet's city calendars.

After calculating that SPA profile, **Compare Diyanet calculations** runs the [offline point/day comparison](../../core/diagnostics/README.md) on demand. It shows both models at the exact same supplied point, each event's status and actual display date, the signed difference between rounded UTC minutes, and the difference before minute rounding. This does not fetch official times or change the selected day, next prayer or schedule. Missing local events remain empty even when the reconstruction returns an estimated time. The comparison is cleared whenever calculation inputs change; an old in-flight response cannot replace a newer point/day result. The shared comparison latitude range is −60° through 75°; a comparison failure leaves the original schedule available. Comparison results are not included in the schedule download.

The calculation includes the preceding solar day as padding so its after-midnight Isha can still be the next calculated start on the displayed day. The seven visible rows retain their source-day ownership; an event on another actual date is labeled explicitly. On a partial schedule, the next available entry is labeled a calculated start, since an earlier uncomputed prayer may exist. Stop the local server with Ctrl+C when finished.

You can request device location explicitly; coordinates are taken from the browser's location permission. The browser's configured IANA timezone is then suggested. Check that timezone yourself for the selected location before calculating, especially near timezone borders. You can also enter coordinates and timezone manually. GPS does not identify an IANA timezone by itself.

The current prototype is a local browser preview, not a mobile app. It does not schedule background notifications or mobile alarms. Polar cases without real required horizon events remain unavailable; no general polar-day/night replacement is provided. Dates outside the calculation's supported range and locations outside a profile's declared domain fail explicitly. Seconds display is numerical resolution, not a guarantee of observed prayer onset at second-level accuracy.

The API and rule definitions live in [`../../core/local/README.md`](../../core/local/README.md); the browser client and loopback-only launcher are [`app.mjs`](app.mjs) and [`../../scripts/local-app.mjs`](../../scripts/local-app.mjs).
