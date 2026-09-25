# Fazilet: rule evidence and the local calculation

Reviewed **2026-09-25**. This is a publisher-specific audit, not a definition of all Hanafi practice. Only explanatory publications were revisited; no new prayer calendar or API result was acquired. It makes no numerical change and adds no accuracy sample.

## What is established

| Element | Evidence and implementation consequence |
|---|---|
| Fajr/Imsak, sunrise, Isha | The publisher's [FAQ, question about the degrees used](https://fazilettakvimi.com/sikca-sorulan-sorular/muhteva-ile-ilgili-sorular/) specifies solar altitudes −19°, −1°, and −17°. These agree with the candidate's input angles. |
| Asr | The same FAQ describes the noon shadow plus one object length. This supports factor 1 for this publisher's first Asr marker; it does not justify making factor 1 or 2 automatic from the word “Hanafi.” |
| Maghrib | The FAQ specifies −1° with reference to the locality's highest place. Our −1° threshold alone does not implement that entire location policy. |
| Sabah | The FAQ explicitly describes a 20-minute separation between Imsak and Sabah and directs readers to the distinct Sabah marker for prayer. Thus the published separation is supported, even though the exact arithmetic/rounding order is not given. Our V2 adds 20 minutes to rounded Imsak. |
| Spatial inputs | The [calculation workflow](https://fazilettakvimi.com/hakkimizda/vakitler-nasil-hesaplaniyor/) includes coordinates, civil time, climate, highest inhabited elevation, and the city's outer extent. Its area-wide Temkin policy is more than calculation at a GPS point. |

## What remains reconstructed

The [V2 implementation](implementation/v2/model.mjs) uses event-specific floor/nearest/ceiling rounding. Neither reviewed page establishes those rounding choices. The candidate's fixed minute margins and local solar-hour sampling anchors remain empirical, bounded reconstruction choices; the pages do not disclose a complete production ephemeris or formula for city extent/elevation.

The numerical region remains the declared Turkish domain. A fresh GPS point does not justify silently deleting the publisher's Temkin or replacing its area policy with observer altitude. Those would be separately named interpretations requiring evidence.

## Next useful improvement

Model the published spatial components explicitly only when their definitions are sufficiently specified, and compare the result with the fixed-margin control across the complete archived cohort. Keep the [historical validation](validation.json) unchanged. The current audit corrects the earlier README's over-broad description of Sabah +20 as unconfirmed; it does not convert the full V2 recipe into an official method.
