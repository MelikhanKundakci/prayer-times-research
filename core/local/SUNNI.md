# Sunni calculation profiles

This registry adds a practical set of named local-point profiles around a shared continuous solar model. It is an offline calculation, not a publisher timetable, religious ruling, or claim of seconds-level observed accuracy. The method names identify the source of selected criteria where available; they do not certify that every implementation detail reproduces an institution's production system.

## Available choices

| Profile family | Fajr / Isha rule | Additional convention and scope |
|---|---|---|
| MWL | 18° / 17° | Common calculation-software convention. MWL's inspected official prayer-time pages provide location-based times but do not publish this complete numerical recipe. |
| Karachi | 18° / 18° | Common calculation-software convention. This implementation does not claim a verified, current University of Islamic Sciences, Karachi production specification. |
| Egyptian | 19.5° / 17.5° | Supported by Egyptian Dar al-Ifta angle guidance; the rest of the local point recipe remains explicitly composed. |
| ISNA | 15° / 15° | Common ISNA-labelled application convention; FCNA separately recommends 15°/15° for the USA. FCNA's 13°/13° Canadian recommendation is not an ISNA method in this catalogue. |
| Umm al-Qura | Fajr 18.5°; Isha by interval | A declared reconstruction: 90 minutes after sunset ordinarily, 120 minutes for the selected Ramadan mode. The inspected publisher site does not specify this complete recipe. |
| JAKIM | Fajr / Isha 18° / 18° | A bounded Malaysia point composition from the cited institutional teaching material; it is not a verified production backend or a single rule for every state/version. |
| Diyanet | Existing local profile | Reuses `diyanet-published-spa-point-v1` without changing its rules. |
| Kemenag | Existing worked-example profile | Reuses `kemenag-worked-example-point-v1` and its minute operation order without changing its rules. |

The common family profile IDs use `sunni-{mwl|karachi|egyptian|isna}-shadow{1|2}-{physical|angle-night}-v1`. Umm al-Qura IDs use `sunni-umm-al-qura-shadow{1|2}-{calendar|ramadan|ordinary}-v1`. The JAKIM profile ID is `sunni-jakim-shadow1-physical-v1`. The method catalogue lists all eight named method families and points to their available profiles; it does not claim a rank by global usage. There are 23 new recipes (16 common angle/Asr/night combinations, six Umm al-Qura choices, and one JAKIM point recipe). Its Diyanet and Kemenag method entries map to their existing named local profiles; those calculations are unchanged.

## Use the API

Import `calculateSunniDay` for one explicitly selected local day, or `calculateSunniSchedule` for a dated sequence. The method catalogue and registry are available through `listSunniMethods()` and `listSunniProfiles()`.

```js
import {calculateSunniDay, listSunniMethods} from './core/local/sunni.mjs';

const methods = listSunniMethods();
const result = calculateSunniDay({
  date: '2026-06-21',
  latitude: 40.7128,
  longitude: -74.006,
  timeZone: 'America/New_York',
  profile: 'sunni-egyptian-shadow1-physical-v1',
});
```

Callers must choose the full profile ID. The method catalogue's default profile IDs are convenience defaults only: e.g. the Karachi entry chooses Asr factor 2 as an explicit application default, while the registry also includes factor 1. An app should expose that Asr choice instead of implying that the twilight label decides it. FCNA's separate Canada 13°/13° guidance remains available as the existing `fcna-canada-2017-point-v1` local profile, not through the `isna` method entry.

The new MWL, Karachi, Egyptian, and ISNA compositions each select shadow factor 1 or 2 and either physical twilight only or an explicit angle/60 adjacent-night limit. Those are separately named profiles. The night-limit version is a software estimate for a missing or later-than-limit angle crossing; it is not an institution's stated rule. It requires the actual adjacent sunset and sunrise and does not invent a polar horizon.

The core accepts dates from 2001 through 2098. For night-limit profiles, Fajr on 2001-01-01 and Isha on 2098-12-31 remain blocked because their required adjacent solar day lies outside that range. The browser uses the narrower 2002–2097 range with room for its seven-day schedule.

The common composed point convention uses the SPA geocentric solar model already in the local core, a flat 50-arcminute horizon for sunrise/sunset, Dhuhr transit plus one minute, no Temkin margin, and nearest-minute display. These settings are implementation choices shared by the composition; they do not follow automatically from the Fajr/Isha criterion. Asr factor 1 versus factor 2 is explicit and independent of the twilight family. The selected solar-event calculation does not assume a particular school of law for every user.

For Umm al-Qura, the `calendar` variant uses the runtime's ICU `islamic-umalqura` civil date to select the interval. The `ordinary` variant always uses 90 minutes; `ramadan` always uses 120 minutes. The latter is an explicit caller choice. None predicts a local moon sighting or guarantees the interval used in a future official Saudi calendar. If the physical sunset is absent, the interval cannot be computed and Isha remains unavailable; no twilight estimate is added.

The JAKIM variant is constrained to latitude 0°–8°N, longitude 99°–120°E, and `Asia/Kuala_Lumpur` or `Asia/Kuching`. It applies the sourced 64-second Dhuhr component before ceiling start events to whole minutes and floors sunrise; minute-defined output has no seconds field. The cited post-2019 18° Fajr criterion is applied throughout the profile's supported dates as a declared recipe; this is not a reconstruction of earlier 20° calendar versions. The selected pieces are supported by Pahang falak training material and Selangor explanations; that source scope does not certify the profile as a current production backend for every Malaysian state. It does not inherit Diyanet margins, Kemenag margins, or another country's seasonal fallback.

## Evidence and limits

- [FCNA's recommendation](https://fiqhcouncil.org/the-suggested-calculation-method-for-fajr-and-isha/) specifies 15°/15° for the USA and 13°/13° for Canada throughout the year, and describes observation-based caution as a recommendation rather than a fixed universal offset.
- [Egyptian Dar al-Ifta fatwa 4021](https://www.dar-alifta.org/ar/fatwa/details/13816/فتوى-دار-الإفتاء-المصرية-في-توقيت-الفجر) supports Egypt's 19.5° Fajr and 17.5° Isha angle pair; it does not specify this document's full point engine.
- JAKIM components are documented in [Pahang falak training material](https://mufti.pahang.gov.my/muat-turun-dokumen/nota-kursus-taklimat/3-asas-falak-dalam-ibadah/file), [JAKIM's 2015 Falak Journal](https://www.islam.gov.my/images/ePenerbitan/jurnal_falak_bil1_2015.pdf), [Selangor's Rembang explanation](https://www.muftiselangor.gov.my/2024/08/09/66-taudhih-al-hukmi-hukum-solat-pada-waktu-rembang/), its [Falak Bulletin 34 (April–September 2023)](https://www.muftiselangor.gov.my/wp-content/uploads/2025/08/EDIT-Inlay-Buletin-34.pdf), and the [Selangor FAQ](https://www.muftiselangor.gov.my/soalan-lazim/). They support selected ingredients, not a complete current national timetable implementation.
- The official [MWL prayer-time page](https://themwl.org/ar/prayer_times) and [Umm al-Qura prayer-time page](https://www.ummulqura.org.sa/ar/prayer-times) provide prayer-time interfaces, but the inspected primary pages do not publish complete executable recipes for these profiles.
- Existing national evidence and its precise scope are recorded in the [Kemenag audit](../../methods/kemenag/RULE-EVIDENCE.md), [JAKIM audit](../../methods/jakim/RULE-EVIDENCE.md), [Diyanet rule evidence](../../methods/diyanet/RULE-EVIDENCE.md), and [Umm al-Qura evidence boundary](../../methods/umm-al-qura/RULE-EVIDENCE.md).

The existing source-calendar comparisons do not validate the new composed profiles. Their mathematical output is a local model result under declared conventions, not proof of agreement with a particular mosque or official timetable. For institution-specific use, compare against the relevant dated local authority and follow its adopted guidance.

The shared astronomy engine has independent SPA arithmetic/root validation in [the local SPA verification](verification/spa-README.md). The tests for this registry add selection, interval, scope, rounding, and invariance checks; they do not create a new observational calendar-accuracy study.

## Declared coverage verification

The [frozen grid report](verification/sunni-grid-2026-09-27.json) checks eight full 2027 city-years, all 23 new variants, 312 boundary cases and 416 overlapping schedule windows. It checks 3,975 unique calculated point-days (23,850 event fields), with 22 expected rejections of Apia's skipped civil date. The runner checks finite values, UTC/date ownership, prayer roles, rounding, interval arithmetic, coverage accounting and within/across-day ordering. All assertions passed. The report pins the implementation and test-grid definition; it is not a test against official timetables.

| Default method / demonstration city, 2027 | Days with five calculated starts |
|---|---:|
| MWL / Frankfurt, physical crossings only | 323 / 365 |
| Karachi / Karachi | 365 / 365 |
| Egyptian / Cairo | 365 / 365 |
| Umm al-Qura / Makkah | 365 / 365 |
| ISNA / New York | 365 / 365 |
| Diyanet / Istanbul | 365 / 365 |
| Kemenag / Jakarta | 365 / 365 |
| JAKIM / Kuala Lumpur | 365 / 365 |

Frankfurt's physical-only MWL recipe has 42 unavailable Fajr and 26 unavailable Isha events across 42 days: the chosen solar angles are not reached. This is a declared physical limitation, not a missing-data lookup failure. The separately selected night-fraction recipe can supply marked estimates when its actual horizon endpoints exist. The Istanbul result does not extend Diyanet's unresolved northern seasonal policy. No selected cross-day Isha/Fajr conflict occurred in the declared grid.

Reproduce the complete grid without changing the stored report:

```sh
node core/timezones/with-tzdata.mjs scripts/verify-sunni-grid.mjs --check
```

Use `--write` only when intentionally producing a newly reviewed report. The fast regression suite also checks the stored report's case declaration and implementation hashes.
