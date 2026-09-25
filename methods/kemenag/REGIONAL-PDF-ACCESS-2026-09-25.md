# Bau-Bau regional PDF access follow-up

**The original regional calendar PDF could not be acquired as a local file or visually inspected in this follow-up.** The existing Bau-Bau transcription and model remain unchanged.

The attempted source was the official PDF linked by Kanwil Kementerian Agama Provinsi Sulawesi Tenggara:

<https://sultra.kemenag.go.id/cms_/public/data/files/users/6/KOTA%20BAU%20BAU.pdf>

Attempts on 2026-09-25:

- A normal direct `curl -L --fail` GET returned DNS resolution failure (`Could not resolve host: sultra.kemenag.go.id`), with HTTP code `000` and zero downloaded bytes.
- Opening the same URL in Chrome ended at `ERR_CONNECTION_TIMED_OUT`.
- The web PDF reader returned a one-page text extraction for the same official URL. Its result was marked “Crawled: 5 months ago,” so it is cached/indexed content rather than evidence of a fresh download. The extraction includes the title, 1–30 Ramadan row labels, all eight time columns and the printed location coordinates. The displayed column sequences correspond to the stored 30-row transcription, with no discrepancy observed.
- A PDF screenshot request returned no image, so the rendered table could not be visually checked. No raw PDF bytes, response headers, file size or file hash were obtained.

This provides a cross-check against the available indexed text only. It is not an independent binary acquisition or visual verification, and it does not upgrade the holdout's provenance. The original research record correctly retains `originalPdfRetrieved: false` and `visualVerification: false`; the frozen model, transcription, and comparison are untouched. No unofficial mirror was used.

## Scope

The official PDF text describes 30 days of Ramadan 1446 H for Kota Bau Bau and prints `5° 27' 25.11" S, 122° 36' 20.19" E`. The Gregorian mapping continues to rely on the separately cited official decision that 1 Ramadan 1446 H began on 1 March 2025. This access attempt did not independently verify that date decision or the calendar's calculation recipe.

The next useful source-quality step remains obtaining the official PDF bytes through a normally accessible official channel and checking the rendered table against the private transcription. This report does not assert a right to redistribute that PDF.
