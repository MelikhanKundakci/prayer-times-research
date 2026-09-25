# Nairobi 2027: a frozen low-latitude Diyanet comparison

The unchanged, fully offline southern UTC00 reconstruction matches **2,093 of 2,190** displayed Diyanet minutes for Nairobi, Kenya in 2027. Every other value differs by exactly one minute; all 97 differences are model-earlier. There are no source `00:00` values, missing model events or model event-date shifts in this cohort. This is a comparison with one named-city calendar, **not** a certification for arbitrary coordinates in Kenya or elsewhere.

## What was frozen before viewing the source times

At **2026-09-25 14:33:31 UTC**, the complete 365-day, six-event forecast and its SHA-256 hash were stored before finding a Diyanet Nairobi city ID or reading an official Nairobi calendar. The predeclared input was **−1.28°, 36.82°, `Africa/Nairobi`, 2027**, taken from the [UNGEGN Nairobi city entry](https://ungegn.un.org/dashboard/cities/details?id=26), whose stated coordinate source is Kenya's national mapping agency. This is a city proxy, not a confirmed Diyanet production point. The frozen recipe was the existing [`south` own USNO UTC00 variant](implementation/south/candidate.mjs): Fajr −18°, Isha −17°, conventional horizon, standard Asr, documented minute adjustments and nearest-minute rounding. No parameter was selected from Nairobi residuals.

After the freeze, the [public Diyanet Kenya city list](https://namazvakitleri.diyanet.gov.tr/assets/locations/KENYA.json) identified `NAIROBI` as city **15015**. The [official Nairobi page](https://namazvakitleri.diyanet.gov.tr/tr-TR/15015/nairobi-namaz-vakitleri) identified country `KENYA` and contained exactly 365 ordered 2027 rows. Both the existing strict HTML parser and a second independent cell parser checked the city/country identity, every Gregorian date and weekday, six valid clocks per day, and the full comparison. Neither parser supplies source UTC instants; the comparison treats each published row date as the local event date. The model's local event date equals that date in every slot.

| Event | Exact / 365 | Within one minute | Model −1 minute |
|---|---:|---:|---:|
| Fajr | 348 | 365 | 17 |
| Sunrise | 351 | 365 | 14 |
| Dhuhr | 344 | 365 | 21 |
| Asr | 350 | 365 | 15 |
| Maghrib | 353 | 365 | 12 |
| Isha | 347 | 365 | 18 |
| **Total** | **2,093 / 2,190 (95.57%)** | **2,190 / 2,190** | **97** |

The independent recount obtained the same signed distribution: 2,093 zero and 97 minus-one-minute differences. It did not read the first parser's parsed rows. The original HTML and the complete forecast are retained only in the private research workspace; the source pages' public availability does not grant a calendar redistribution license. Evidence pins: forecast SHA-256 `af9724b9579f4894fc559738d2a6f734182852c16f74e48d82b8fcbe2de97d48`; Diyanet HTML SHA-256 `bd9158d46714cbd881a4efe2e112f70cbfc52ccaec9116dfded47b43ab751b89`; Kenya city-list SHA-256 `18673a2753c445c5845ecec5590805909a1d89641f89e62124c1fd213210502d`. Runtime: Node 26.7.0, ICU 78.3, pinned tzdb 2026d.

## Interpretation and limits

The uniform direction of the 97 one-minute differences may reflect the unconfirmed city calculation point, numerical epoch or rounding. The displayed minute cannot distinguish these causes, and the source gives neither production coordinates nor seconds. Adding one minute everywhere would make 2,093 currently exact values late and would be a fitted correction, so the calculator is unchanged.

This sample extends geographic evidence to equatorial East Africa. It does not validate a worldwide Diyanet algorithm, local elevation/horizon, future timezone law, source event instants, or notification accuracy. The current method remains `productionReady: false`.
