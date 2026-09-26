# Local point profile: rule contract

This page specifies the first **Diyanet-inspired point profile** for the continuous local solar model. It combines selected published Diyanet event criteria with a point-geometry implementation. It is not a Diyanet production algorithm, an official local timetable, a religious ruling, or notification approval.

The input point is latitude and longitude plus the requested local civil date and an appropriate IANA time zone. The application must supply the time zone separately: GPS coordinates do not identify one without a zone resolver. The initial model accepts dates from 2001 through 2098 and latitudes from −89° through +89°. It does not accept observer elevation and does not model terrain, local obstructions, or topocentric parallax. A flat-horizon crossing is not an observation from the user's actual skyline.

## Selected event rules

The API keeps each **raw geometric event** separate from its **selected event time**. It first solves solar crossings in continuous UTC time, then applies the selected profile's published minute margins to produce the selected clock. The continuous solver's subsecond root precision is numerical precision, not demonstrated subsecond or second-level timing accuracy.

| Event | Ordinary point rule | Selected-time margin | Rule identifier |
|---|---|---:|---|
| Fajr / Imsak | Rising Sun at −18° altitude | 0 min | `diyanet-published-point-v1.fajr.altitude-18.temkin-0` |
| Sunrise | Rising Sun at −50 arcminutes; model convention for apparent horizon | −7 min | `diyanet-published-point-v1.sunrise.altitude-50arcmin.temkin-minus7` |
| Dhuhr | Upper meridian culmination | +5 min | `diyanet-published-point-v1.dhuhr.transit.temkin-5` |
| Asr | Descending Sun at the altitude where the shadow added after the noon shadow equals the object's height (factor 1) | +4 min | `diyanet-published-point-v1.asr.fixed-noon-shadow-1.temkin-4` |
| Maghrib | Setting Sun at −50 arcminutes; model convention for apparent horizon | +7 min | `diyanet-published-point-v1.maghrib.altitude-50arcmin.temkin-7` |
| Isha | Setting Sun at −17° altitude in the ordinary profile | 0 min | `diyanet-published-point-v1.isha.altitude-17.temkin-0` |

The angle and shadow criteria name event signs; the margins define the point profile's selected clock. Diyanet's Temkin explanation says its published calendars apply −7 minutes to sunrise, +7 to sunset, +5 to Dhuhr, +4 to Asr, and no additional Temkin to Imsak or Isha. It explains Temkin in part as a publication convention for one timetable covering east/west and elevation differences within a locality. This profile retains those stated margins by contract. Supplying a precise GPS point is not evidence that those published margins should be removed.

The ordinary Fajr −18° and Isha −17° values are stated in Diyanet's [17 July 2013 press statement](https://www.diyanet.gov.tr/tr-TR/Kurumsal/Detay/2921/basin-aciklamasi), paragraphs 5 and 7. This dated statement supports these criteria; it does not certify every region or unspecified calculation detail today. Diyanet's High Board says its calendars use *Asr-i evvel*: the noon shadow excluded, an object's shadow equals its height; it distinguishes Abu Hanifa's factor-2 *Asr-i sani* ([2017 ruling](https://kurul.diyanet.gov.tr/tr/fetva/asr-i-evvel-ve-asr-i-sani-ne-demektir/0193c42d-4d64-7acf-2961-12b0db4e1723)).

For the factor-1 Asr crossing, let `h₀` be the modeled solar altitude at that day's upper culmination. The noon shadow-to-height ratio is `cot(h₀)`. The afternoon target solves `cot(h) − cot(h₀) = 1`, hence `h = atan(1 / (1 + cot(h₀)))`. The continuous solver finds the descending crossing of this target. If the computed noon Sun is not above the geometric horizon, this equation does not provide an Asr crossing.

The −50′ horizon is the model's conventional flat apparent-horizon threshold. The Temkin page establishes the published minute margins, but it does not specify the solver's horizon/refraction model, ephemeris, point height, numerical root tolerance, or final display rounding. Those are implementation choices and limitations, not additional Diyanet criteria.

## Northern seasonal policy is intentionally incomplete

At latitude **44.5° north and above**, this profile does not present raw twilight crossings as complete selected Fajr or Isha beginnings. The archived detailed high-latitude criteria specify true Fajr at −18° and true Isha at −16°, but then add seasonal selection: Isha may be replaced by Maghrib plus one-third of the religious night; Fajr may be replaced by a determined value; missing-Fajr periods use a frozen night ratio; and gradual transition rules apply. The technical criteria also specify five-hour minimum day/night handling and identify 44.5° as the threshold. The newer [Diyanet activity report](https://kurul.diyanet.gov.tr/tr/faaliyetler/2020-2025/ibadet-vakitleri-dini-gun-ve-gecelerin-tespiti/ileri-enlemlerde-namaz-vakitleri) summarizes the current scope as 45° north and above and says implementation began in 2023. These documents have different scopes and dates; the local profile conservatively uses 44.5° as its explicit policy gate and does not claim that this is a complete current worldwide implementation boundary.

The public [Diyanet rule evidence note](../../methods/diyanet/RULE-EVIDENCE.md) summarizes the archived criteria and their provenance. Until a complete, source-traceable point-profile implementation covers seasonal ratios, transition anchors, horizon estimation, and chronology behavior, the local profile returns **`policy-blocked`** for selected northern Fajr and Isha under `diyanet-published-point-v1.fajr.northern-seasonal-policy` and `diyanet-published-point-v1.isha.northern-seasonal-policy`. Raw −18°/−16° crossings, when found, remain under `astronomy.events` for diagnosis; they are not exposed as selected prayer times.

The same five-hour day/night rule affects selected sunrise and Maghrib at or above this gate. If a geometric crossing is missing, or the raw/adjusted day length is outside the documented five-to-nineteen-hour window, the selected horizon event is **`policy-blocked`** under `diyanet-published-point-v1.<event>.five-hour-horizon-policy` until that estimate rule is implemented. Do not substitute a generic polar-day/polar-night estimate under a Diyanet label. The high-latitude Asr criterion permits Dhuhr to count as Asr when the Asr sign is absent. A proven north-polar-winter case may return that as **`estimated`** under `diyanet-published-point-v1.asr.no-daylight-shadow.use-dhuhr`, using Dhuhr's selected instant and its +5-minute adjustment rather than applying an extra Asr +4; the result should carry an explicit no-daylight-shadow reason. Other missing northern Asr cases are **`policy-blocked`** under `diyanet-published-point-v1.asr.northern-substitution-policy`. Multiple roots, failed bracketing, or numerical failure are not proof of physical absence and must remain blocked/unavailable, not silently substituted.

These northern rules are not mirrored into the southern hemisphere. A southern event without a geometric crossing remains unavailable unless a separately sourced southern policy is added under its own name.

## Status and chronology contract

- **`calculated`**: a selected event follows a complete declared rule, and its required geometric crossing exists. This describes how the model produced the value; it does not assert religious or institutional certification.
- **`estimated`**: a declared policy supplied a substitute, such as documented Dhuhr-as-Asr after the solver establishes that the factor-1 Asr sign is physically absent. Include the rule identifier and reason.
- **`unavailable`**: required geometry does not exist and no supported substitute applies.
- **`policy-blocked`**: geometry may exist, but selection requires an unimplemented seasonal/horizon policy or the event fails a required safety check. Keep raw diagnostic crossings separate and leave selected time null.

After margins are applied, check chronology without altering event clocks. Fajr must precede sunrise, Dhuhr must precede Asr, and Maghrib must precede Isha. Equal Dhuhr/Asr instants are permitted only for the documented northern no-daylight-shadow Dhuhr substitute, which is marked `estimated`; every other equality or reversal blocks the affected selection. The one-day API cannot establish `Isha < next Fajr` without evaluating the following day; a multi-day schedule consumer must perform that comparison before treating the night as a complete sequence. If a night event falls after local midnight, report the actual local date and UTC instant; do not assume the event belongs to the label date's clock day.

## Source trail and limits

- [Diyanet Temkin explanation](https://vakithesaplama.diyanet.gov.tr/temkin.php): event-specific published margins and why a locality calendar uses Temkin.
- [Diyanet Imsak explanation](https://vakithesaplama.diyanet.gov.tr/imsak.php): Imsak is tied to the beginning of true dawn.
- [Diyanet 2013 press statement](https://www.diyanet.gov.tr/tr-TR/Kurumsal/Detay/2921/basin-aciklamasi): ordinary Fajr/Imsak 18° and Isha 17° statement.
- [Diyanet High Board Asr ruling](https://kurul.diyanet.gov.tr/tr/fetva/asr-i-evvel-ve-asr-i-sani-ne-demektir/0193c42d-4d64-7acf-2961-12b0db4e1723): Diyanet calendar uses Asr-i evvel, factor 1.
- [Detailed high-latitude criteria, English](https://www.awqatsalah.com/sub/18/calculation-criteria) and [Turkish](https://www.awqatsalah.com/sub/34/tespit-kriterleri): archived 18°/16° real twilight, one-third-night and seasonal rules, 5-hour horizons, and 44.5° technical threshold.
- [Diyanet 2020–2025 activity report](https://kurul.diyanet.gov.tr/tr/faaliyetler/2020-2025/ibadet-vakitleri-dini-gun-ve-gecelerin-tespiti/ileri-enlemlerde-namaz-vakitleri): newer summary says 45°N and above, implementation from 2023.

USNO continuous point geometry is the selected software model, not a Diyanet-published ephemeris. It uses geocentric solar coordinates and a conventional flat horizon; it does not model local elevation, skyline obstruction, or topocentric parallax. The app must provide the appropriate IANA zone separately. Local-time rendering, minute rounding, and seconds display do not establish physical or institutional accuracy to that display precision. Every output remains an estimate from this explicitly named model, not a certified religious timetable or notification guarantee.
