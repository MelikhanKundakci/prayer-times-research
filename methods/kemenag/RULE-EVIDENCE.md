# Kemenag: criterion and publication-rule audit

Reviewed 25 September 2026. This review read public institutional explanations, not a prayer-time API. It makes no new calendar-accuracy claim and changes no numerical recipe.

| Evidence | Confirmed scope | Implementation consequence |
|---|---|---|
| [Kemenag Temanggung training report](https://temanggung.kemenag.go.id/bimbingan-masyarakat-islam/standar-baku-hisab-rukyat-dalam-pelatihan-perhitungan-jadwal-shalat/) | Page dated 24 October 2022 describes training held **14 April 2016**, with Ahmad Izzudin as the speaker. It states rounding seconds upward for starts and downward for sunrise, followed by Dhuhr +3 minutes; Asr, Maghrib, Isha, Fajr and Duha +2; sunrise −2. | Independent institutional corroboration of the existing book-example operation order. The report is not a versioned specification of every current Bimas calendar. |
| [Kemenag regional publication of the national Subuh explanation](https://kalteng.kemenag.go.id/kanwil/cetak/537222/Soal-Penetapan-Waktu-Subuh-di-Indonesia-Ini-Penjelasan-Kemenag) | Uploaded 10 December 2025; reports a 1 December explanation supporting approximately −20° for Indonesia and discusses local observational verification. | Supports the existing Fajr criterion. It does not supply exact solar ephemerides, horizon constants or production city points. |

The [strict wrapper](implementation/api.mjs) already distinguishes the book-example profile from angle-only astronomy and identifies its rounded Imsak derivation. No evidence found in this audit supports replacing these rules with an unrounded GPS instant while retaining the claim that the result is the same published recipe.

For a future seconds view, expose the raw solar event, the applied margin, and the final published-rule marker as separate quantities. The current book profile intentionally rounds to minutes. Displaying its final marker as `HH:mm:00` does not recover an institutional second-level measurement.

Still unconfirmed: the central service's current markaz selection, elevation/horizon policy, exact solar tables and nationwide applicability of the worked example. The Muhammadiyah 18° Fajr criterion remains a separate named criterion; this review does not turn it into a complete Muhammadiyah profile. Existing comparison counts remain in [validation.json](validation.json).
