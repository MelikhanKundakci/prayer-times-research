// Explicit family allowlist; never turn user input into an unchecked import path.
export const methodIds = Object.freeze([
  "moonsighting-committee",
  "diyanet",
  "umm-al-qura",
  "egyptian-survey",
  "uae-awqaf",
  "kemenag",
  "oman-mara",
  "banuri-town",
  "jakim",
  "muis-singapore",
  "fcna",
  "shia-angles",
  "bayynat",
  "fazilet",
  "turkiye-takvimi"
]);
export async function loadMethod(id) {
  if (!methodIds.includes(id)) throw new RangeError(`Unknown method family: ${String(id)}`);
  return import(new URL(`./${id}/index.mjs`, import.meta.url));
}
