# Recognizable method names

The method picker uses familiar names, expanded abbreviations and identifying origins. A user should be able to find the method named by their mosque or existing calendar without knowing solar angles or internal profile IDs. English remains the default; names and explanations are localized into German and Turkish.

| Family ID (unchanged) | English display name |
|---|---|
| `mwl` | Muslim World League (MWL) |
| `karachi` | Karachi method · Pakistan |
| `egyptian` | Egyptian method |
| `umm-al-qura` | Umm al-Qura · Saudi Arabia |
| `isna` | Islamic Society of North America (ISNA) |
| `diyanet` | Diyanet · Türkiye’s religious authority |
| `kemenag` | Kemenag · Indonesia’s religious ministry |
| `jakim` | JAKIM · Malaysia’s Islamic affairs |

A short description immediately below the picker explains the chosen name and relevant availability limits. The common selection hint states that these are independently calculated local times which can differ from official calendars. Full rule explanations remain accessible under **Method details and limitations** and in the result's existing rules/source section. The picker references its hints with `aria-describedby`.

## Naming boundaries

- Preserve familiar identifiers such as Diyanet, MWL and ISNA; do not replace them with unexplained numbers or internal research-version names.
- Translate the explanation rather than assuming every user understands the original institution's language. [ISNA](https://isna.net/mission-and-vision/) expands to Islamic Society of North America. [Kemenag](https://m.kemenag.go.id/en) is Indonesia's Ministry of Religious Affairs. [JAKIM's official material](https://www.islam.gov.my/images/garis-panduan/garis_panduan_pengurusan_ayat_suci_alquran.pdf) identifies the Department of Islamic Development Malaysia. A shortened UI description identifies the body; it does not claim that body supplied our software.
- Use **Egyptian method**, rather than presenting our implementation as the Egyptian Survey Authority's complete production system. The brief explanation identifies Dar al-Ifta's Fajr/Isha criteria; the [source audit](../../core/local/SPECIAL-RULES.md) states the remaining local conventions.
- Keep **Karachi** as the established method label, with Pakistan as an identifying origin. Do not invent a verified university issuer or rename the whole method “Hanafi”; Asr is a separate choice.
- Keep the ISNA-labelled method distinct from FCNA's separate Canadian recommendation. A geographic label does not mean every Muslim in that region follows one rule.
- Describe the Kemenag worked-example basis and the JAKIM local Malaysian composition honestly. Their regional input limits still apply.
- Treat a country's name as context for identifying the method, not as an automatic choice of a user's faith or practice from GPS.

This presentation change does not alter profile IDs, defaults, astronomical calculations, summer policies or saved language behavior. More complete onboarding and advanced-settings organization remain separate UI work. Read [the local-profile guide](../../core/local/SUNNI.md) for calculation contracts.
