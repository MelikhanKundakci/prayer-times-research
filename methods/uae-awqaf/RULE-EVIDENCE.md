# UAE: software rules versus operational settings

Reviewed on 25 September 2026. This audit used published explanatory documentation, not new Awqaf API or PDF timetable data.

## Primary software evidence

[Mohammad Odeh's Accurate Times documentation](https://astronomycenter.net/accut.html?l=en), marked updated **11 July 2022**, identifies the software as used for UAE prayer calculations. It documents:

- a western city point plus city width, with Fajr/sunrise calculated at the eastern point and the later events at the western point;
- configurable twilight angles, Asr school, elevation, per-prayer minute changes, and temperature/pressure;
- a refraction-method change to Hohenkerk–Sinclair in version 5.5, and noon-shadow refraction for Asr in version 5.3.8;
- both minute and second display formats.

This is the author's software specification. It does **not** publish Awqaf's current per-region configuration. A supported option is not proof of which value a publisher selected. The software's claimed numerical agreement is also not validation of this repository.

## Consequences for the local model

The documented city-width direction agrees with the current morning/evening split. The default [V2 candidate](implementation/candidate.mjs) fixes a standard atmosphere even though pressure and temperature are carried as metadata. The [own-ray variant](OWN-RAY.md) is our bounded refraction reconstruction; it is not a complete implementation of all documented Accurate Times settings. The current evidence does not justify making pressure/temperature active controls or promoting own-ray to default without a paired regression study.

## Next mathematical gap

Implementing the documented refraction formulation independently would be a source-motivated mathematical experiment; it must preserve the current own-ray results and score sunrise/Maghrib and Asr separately. Independently identified region extent and height remain essential. Do not estimate a city width from prayer residuals and then describe it as operational metadata. The already completed [February transfer](FEBRUARY-2027-TRANSFER.md) remains the newest scored test here; no numerical change or new accuracy count is introduced by this audit.
