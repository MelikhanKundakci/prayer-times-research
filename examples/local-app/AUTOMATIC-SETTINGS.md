# Automatic method settings

Selecting one of the eight named methods now configures Asr and night handling without extra questions. The visible **Automatic settings** card states what the app will use. These are application defaults, not a claim that a method name identifies every user's school or an institution's complete production calendar.

| Method | Asr factor | Automatic profile / night handling |
|---|---:|---|
| MWL | 1 | `sunni-mwl-shadow1-local-relative-v1`: stable physical signs, with the existing bounded local summer interpretation where supported |
| Karachi | 2 | `sunni-karachi-shadow2-physical-v1`: physical signs; missing twilight remains unavailable |
| Egyptian | 1 | `sunni-egyptian-shadow1-physical-v1`: physical signs; missing twilight remains unavailable |
| Umm al-Qura | 1 | `sunni-umm-al-qura-shadow1-calendar-v1`: offline civil-calendar selection of 90/120-minute Isha for each date |
| ISNA | 1 | `sunni-isna-shadow1-physical-v1`: physical signs; missing twilight remains unavailable |
| Diyanet | 1 | `diyanet-local-seasonal-spa-v1`: published criteria with our separately documented local summer/winter extension |
| Kemenag | 1 | `kemenag-worked-example-point-v1`: existing bounded Indonesian recipe |
| JAKIM | 1 | `sunni-jakim-shadow1-physical-v1`: existing bounded Malaysian recipe |

The app's [resolver](method-settings.mjs) composes only existing profiles. The numerical kernels, frozen catalogue defaults and historical verification reports remain unchanged. The browser selects the separate MWL and Diyanet local summer extensions; the underlying strict defaults remain available manually. The same resolved profile is submitted for the selected day and the whole schedule; it is not swapped daily to fill gaps.

## Why these choices

The [MWL local-relative interpretation](../../core/local/LOCAL-RELATIVE.md) has independently checked gradual entry/return transitions, marked estimates and explicit latitude/horizon limits. Its [2009 source account](https://astronomycenter.net/latitude.html?l=ar) supplies the method's basis; our date framing, envelope and southern application remain declared local choices. Selecting automatic settings enables this interpretation. The runtime decides whether each supplied place/date has stable physical signs or needs the supported estimate. Polar horizons are not manufactured. First-time annual preparation may take several seconds.

The [reference-45 research option](../../core/local/REFERENCE45.md) has measured seasonal jumps of hours and remains a manual choice for both MWL and Egyptian. It is not enabled merely because it fills missing values. Karachi and ISNA do not silently inherit a generic software fallback. Diyanet uses the separately labelled [SPA local seasonal extension](../../core/local/DIYANET-LOCAL.md), whose added equations and winter admission remain project interpretations. Automatic mode does not promise a complete schedule in those unresolved cases. See the [source audit](../../core/local/SPECIAL-RULES.md).

Karachi factor 2 and the adjustable families' factor 1 selections are app defaults. GPS is used for astronomy, not to infer a school of law. Umm al-Qura's date-based mode follows the supported offline civil calendar rather than predicting a local moon sighting.

## Overrides and state

- **Advanced settings → Use automatic settings for this method** is checked initially. Uncheck it to reveal supported Asr, short-night and Ramadan overrides. Fixed national recipes have no misleading editable controls.
- Turning automatic settings back on restores the current method's defaults, ignoring stale manual values. Choosing another method starts that method in automatic mode and closes advanced settings.
- Language changes, seconds display, date changes and location changes preserve the chosen automatic/manual mode. Calculation-input changes clear stale results until recalculated.
- Choosing **Custom local rules** or **Other point profiles** keeps the existing explicit workflow.
- Estimated and unavailable output remains labelled. The result summary records automatic versus custom settings; the JSON result carries the precise numerical profile.

The focused [automatic-settings tests](../../tests/local-app-automatic.test.mjs) check selection, overrides, catalogue immutability, MWL summer/winter results, Diyanet summer estimates and the unchanged strict fallback and date-based Ramadan intervals. The UI is also checked for manual/automatic switching, method changes and translation without losing selection state.
