# Optional observer-position solar model

The 16 `*-observer-v1` compositions use the Sun's direction from an observer on the Earth's surface. They apply SPA's solar-parallax correction to the existing geocentric SPA position. This is a versioned, opt-in geometry extension; the 23 existing profiles and historical comparison outputs are unchanged. The app keeps its existing astronomy default.

The same four Fajr/Isha angle pairs, Asr factors 1 or 2, and physical-crossing or angle/night policies remain selectable. These combinations are explicit local software profiles. They do not adopt a named institution's undisclosed regional policies or establish closer agreement with its timetable.

## Equations and conventions

The source is Reda and Andreas, [Solar Position Algorithm for Solar Radiation Applications](https://docs.nlr.gov/docs/fy08osti/34302.pdf), sections 3.12–3.14, equations 33–41. Given geocentric right ascension α, declination δ, Earth–Sun distance R in AU, latitude φ, and local hour angle H, we calculate:

```text
ξ = 8.794 arcseconds / R
u = atan(0.99664719 tan φ)
x = cos u                         # observer elevation explicitly fixed to 0 m
y = 0.99664719 sin u
Δα = atan2(−x sin ξ sin H, cos δ − x sin ξ cos H)
α′ = α + Δα
δ′ = atan2((sin δ − y sin ξ) cos Δα, cos δ − x sin ξ cos H)
H′ = H − Δα
h′ = asin(sin φ sin δ′ + cos φ cos δ′ cos H′)
```

The solver finds directed crossings of this observer-relative height throughout the solar cycle. Meridian transit and cycle boundaries use the corrected hour angle. Asr uses the **same corrected frame** for both its noon shadow and afternoon crossing. With positive meridian height `h₀` and shadow factor `f`, its target is `atan2(sin h₀, cos h₀ + f sin h₀)`. A noon Sun below the geometric horizon supplies no physical shadow target.

The observer elevation is a fixed 0 m reference surface, not a measured GPS altitude. No elevation or terrain parameter is accepted. The −50 arcminute sunrise/sunset threshold retains the existing standard semidiameter/refraction convention; no second atmospheric correction is added. UT1 = UTC and ΔT = 69.184 s retain the existing explicit time-scale approximation. Real weather, skyline, elevation and future Earth rotation are not predicted.

The numerical interpretation of Fajr/Isha is also explicit: the selected angle now refers to observer-relative solar height. The cited institutional angle sources do **not** establish that their numerical angles were calibrated in this frame. Solar parallax therefore cannot be advertised as proof of improved religious or timetable accuracy. Ordinary changes are usually much smaller than a minute; near a grazing crossing they can be larger or change availability. This is not a fitted remedy for a two-minute Diyanet discrepancy.

## Use and inspect

In the local app select **Custom local rules · five prayers**, then **Solar calculation → Observer-position correction**. Language changes do not affect this choice, the coordinates, or any calculated instant.

```js
import {calculateObserverDay, calculateObserverSchedule} from './core/local/observer.mjs';

const point = {
  latitude: 30.0444, longitude: 31.2357, timeZone: 'Africa/Cairo',
  profile: 'local-18-17-shadow1-physical-observer-v1',
};
const day = calculateObserverDay({date: '2027-03-20', ...point});
const schedule = calculateObserverSchedule({startDate: '2027-03-20', dayCount: 7, ...point});
console.log(day.calculation.astronomicalModel);
console.log(schedule.coverage);
```

```sh
npm run calculate:local -- 2027-03-20 30.0444 31.2357 Africa/Cairo local-18-17-shadow1-physical-observer-v1 --json
```

The supported input range remains 2001–2098 and latitude −89° through 89°, with explicit IANA timezone and longitude. Those bounds are not complete policy coverage. Physical missing events remain unavailable; the optional angle/night convention uses the actual adjacent observer-model horizon crossings and labels substitutions as estimates. Missing polar endpoints are never invented. The shared schedule compositor retains actual event dates, UTC ordering and cross-day conflict checks.

## Verification

Read the [independent observer-model verification](verification/observer-README.md) for the reproducible pvlib oracle, fixed test cases, measured differences and limitations. Separate tests check a Cartesian observer-to-Sun vector, both Asr factors, strict inputs, polar absence, all 16 rule compositions, daylight-saving transitions, the date line, and day/schedule agreement. Old numerical source pins and schedule regression checks protect historical results.

Seconds are model resolution. Neither a small numerical residual nor agreement between two implementations establishes second-level observational accuracy or official Diyanet equivalence.
