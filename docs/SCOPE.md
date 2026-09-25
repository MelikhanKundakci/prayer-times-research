# Methods, institutions, and jurisprudence

Prayer-time calculation has several layers. Keeping them separate is essential for a useful multi-community implementation.

1. **Astronomy:** solar position, horizon crossings, meridian transit, and shadow geometry at an explicit location and date.
2. **Religious criteria:** which sign or interval defines a prayer's start, the Asr shadow factor, precautions, combined/shared windows, and what to do when an astronomical sign is absent.
3. **Institutional practice:** reference locations, geographic zones, atmospheric assumptions, seasonal transitions, safety adjustments, and minute rounding.
4. **Publication and software:** the printed civil date, timezone rules, placeholders, source bugs, and the difference between a prayer's beginning and a congregation's Iqama.

An accurate solar position does not uniquely determine all four layers. Matching a calendar also does not prove that every reconstructed implementation detail is a religious rule.

## Names are deliberate

A country, institution, madhhab, or community name is not an interchangeable calculation preset. The repository names a specific source or experiment wherever possible. Examples:

- “Diyanet northern seasonal candidate” is an institutional reconstruction hypothesis.
- “Hanafi Asr factor 2” describes a particular shadow criterion; it does not determine the entire daily timetable.
- The named FCNA profiles refer to particular recommendation sources, not a universal current rule for every mosque in the USA or Canada.
- Tehran, Leva, and ARC angle profiles do not establish all Shia prayer windows or the rulings of every marja.
- Oman/MARA comparisons do not establish a general Ibadi algorithm.
- An Indonesian 18° Fajr override is not a complete reconstruction of every Muhammadiyah rule.

## Missing specifications remain visible

No unspecified Asr or Isha time is invented merely to fill a six-column display. A table column called Zawal is not silently relabeled as a confirmed Dhuhr beginning. A published Isha table marker is not automatically a separately established legal time window.

Similarly, missing astronomical crossings require a named, sourced replacement policy. This export does not select a religion, institution, or polar fallback automatically from a user's GPS position.

The long-term aim is wider coverage with explicit choices and provenance. It is not to erase legitimate differences by finding one averaged timetable.
