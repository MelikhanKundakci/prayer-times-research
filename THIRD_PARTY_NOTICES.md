# Third-party notices and source attribution

The [MIT license](LICENSE) covers original project code. Third-party code and data retain their own terms. Method names identify research subjects and published parameter sets; they do not imply endorsement, institutional certification, or that a calculation profile represents every member of a religious tradition.

## Adhan and seasonal coefficients

Some compatibility modules use **Adhan 4.4.6**, by Batoul Apps, under the MIT license. The package version is pinned in the dependency lockfile. The MSC seasonal coefficient implementation also uses coefficients from that library, even where the surrounding solar calculation is independent.

Copyright (c) 2016 Batoul Apps. The full permission and warranty notice is in [LICENSES/Adhan-MIT.txt](LICENSES/Adhan-MIT.txt). Upstream: [Adhan v4.4.6](https://github.com/batoulapps/adhan-js/tree/v4.4.6).

## Unicode ICU and IANA timezones

The pinned timezone resources come from Unicode's ICU data repository, commit `c5aeb38e05607d094b783f0665bd66219b038ca9`, for tzdb `2026d`. The resource manifest identifies the individual files and hashes. The complete [Unicode/ICU notice](LICENSES/Unicode-ICU.txt), including its third-party notices, is retained. It identifies Unicode-3.0 and the public-domain status of the underlying Time Zone Database. These resources are not relicensed under the project's MIT license.

Upstream: [ICU data and license at the pinned commit](https://github.com/unicode-org/icu-data/tree/c5aeb38e05607d094b783f0665bd66219b038ca9), [IANA Time Zone Database](https://www.iana.org/time-zones).

## Geographic data and institutional parameters

GeoNames-derived coordinates require the attribution described in [LICENSES/GEOGRAPHIC-DATA.md](LICENSES/GEOGRAPHIC-DATA.md). Other coordinate and parameter sources retain their individual provenance. Geographic city proxies, gazetteer points and published zone reference points are distinct from verified current institutional production inputs.

The research modules use selected numerical parameters from public descriptions, including Diyanet, FCNA, MSC, MUIS, JAKIM/JUPEM, Kemenag, and separately attributed Shia angle publications. Other experiments concern Banuri, Oman, UAE, Fazilet, Türkiye Takvimi and Bayynat. Source references and uncertainty labels are retained with the methods. A software library's preset is not independent confirmation of the institution's complete operational rules. No blanket license for institutional publications, calendars, maps or databases is claimed.

## Astronomical equations

The project contains original implementations of published astronomical equations, with attribution to [USNO's approximate solar coordinates](https://aa.usno.navy.mil/faq/sun_approx) and [NOAA/Meeus calculation details](https://gml.noaa.gov/grad/solcalc/calcdetails.html). Downloaded source-site JavaScript and original publications used during research are not part of this code distribution. Scientific attribution does not confer rights to unrelated institutional data.

## SPA coefficient tables

The [SPA point provider](core/astronomy/SPA-POINT.md) independently implements the Reda–Andreas equations. Its [coefficient tables](core/astronomy/spa-coefficients.json) were extracted from [pvlib-python v0.13.1](https://github.com/pvlib/pvlib-python/blob/v0.13.1/pvlib/spa.py) under BSD-3-Clause. Preserve the full [pvlib license and copyright notice](core/astronomy/LICENSE-pvlib-SPA), including the pvlib contributors and Sandia attributions, when redistributing these tables in source or binary form. The earlier [SPA research experiment](methods/diyanet/research/spa-reference/README.md) retains the same notice with its own table copy. No institutional endorsement is implied.

## Excluded research material

This repository does not redistribute the downloaded institutional calendars, PDFs, website HTML, raw API responses, extracted clock tables, screenshots, HTTP headers or public-site client keys used in the private evaluation archive. Published research summaries describe comparisons; access to an original public URL is not a redistribution license. Reproducing source-based comparisons may require obtaining the relevant material independently under its applicable terms.

The **Starlink PAL-dependent UAE V3 experiment is excluded** from this distribution. That separate study used GPL-3.0-or-later PAL sources and a GPL-declared linked driver. It is not covered by the project's MIT license and is not an installed dependency of this export. Upstream provenance: [Starlink PAL](https://github.com/Starlink/pal/tree/75017db16bb3efe9031e0f01921caa1b9554e922).
