# Türkiye Takvimi: rule evidence and unresolved reconstruction

Reviewed **2026-09-25**. This is an audit of a publisher, distinct from Diyanet and Fazilet. No new annual calendar or API result was acquired. The existing failed reconstruction remains unchanged.

## Published technical statements

| Element | Evidence | Boundary |
|---|---|---|
| Solar inputs | [Son Teknoloji, pages 1 and 3–4](https://namazvakti.com/documents/Son_Teknoloji.pdf) names MICA declination/equation of time at the prayer instant and city coordinates determined with Google Earth. | The current NOAA and approximate-USNO alternatives are not MICA. “USNO” in both names does not make them the same algorithm. |
| Temkin construction | The same publication, pages 2–3, combines apparent solar radius, refraction and horizon dip, subtracting parallax; it describes subtracting before noon and adding from noon onward. | Its components and area-height convention must not be stacked on a pre-corrected −0.833° horizon without checking for double counting. |
| Common city policy | That publication gives a common Temkin and an Istanbul mean of ten minutes. | This does not identify an exact current daily formula or validate the fixed-ten-minute implementation. |
| Angle alternatives | [Calculation book, printed page 2](https://namazvakti.com/documents/tr.1.pdf), distinguishes Imsak −19° and two Isha criteria, −17° and −19°. | These are this publisher's attributed rules, not proof that every legal school or institution uses the same values. |
| Light travel time | The same book's printed page 2 explicitly says not to add another 8 minutes 20 seconds to the clock calculation. | Adding such a delay to an apparent solar ephemeris would not repair the existing residuals. |

The [Temkin derivation](https://namazvakti.com/documents/Temkin.MuddetiNV.pdf) was also reachable. Its historical examples and the separate caution interpretation are already covered in [TABLE-COMPONENT.md](TABLE-COMPONENT.md); this audit does not reselect a value from known calendar errors. The marker-definition PDF link returned a fetch/cache failure in this review, so no fresh verification is claimed for it.

## Confirmed versus reconstructed

The publisher's inputs and corrections are described more fully than the operational numerical pipeline. Solar coordinate conventions, present city height/extent, interpolation, precision and final rounding still need to be identified. A historical example and a mean correction do not uniquely fix those choices.

Our default uses continuous NOAA coordinates, 41°N/29°E and a constant ten-minute Temkin. Its disagreement with the archived annual is real. The [shared-horizon test](COMMON-HORIZON.md), [rounding-policy test](ROUNDING-POLICIES.md), and [table-component counterexperiment](TABLE-COMPONENT.md) already reject or bound several simple repairs; repeating them would not be new evidence.

## Next useful improvement

An independently specified apparent solar calculation compatible with the named ephemeris conventions would provide a more defensible experiment than another fitted minute offset. It would still need paired tests against the same complete archive and independent geographic metadata. Source statements about high numerical precision do not demonstrate second-level prediction accuracy, and this audit promotes no failed candidate.
