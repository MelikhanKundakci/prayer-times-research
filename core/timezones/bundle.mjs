// Pinned official Unicode ICU resources; no prayer-specific timezone rules.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {endianness} from 'node:os';
import {fileURLToPath} from 'node:url';

export function verifiedBundle() {
  const manifest = JSON.parse(readFileSync(new URL('./manifest.json', import.meta.url), 'utf8'));
  if (endianness() !== manifest.endianness) throw new Error('This pinned ICU bundle requires a little-endian machine.');
  if (!process.versions.icu || Number(process.versions.icu.split('.')[0]) < 54) throw new Error('ICU54 or newer is required for timezone resource overrides.');
  for (const source of manifest.files) {
    const bytes = readFileSync(new URL(source.file, import.meta.url));
    if (bytes.length !== source.bytes || createHash('sha256').update(bytes).digest('hex') !== source.sha256) throw new Error(`Pinned timezone source changed: ${source.file}`);
  }
  return {directory:fileURLToPath(new URL(manifest.resourceDirectory + '/', import.meta.url)), version:manifest.tzdbVersion, sourceCommit:manifest.icuDataCommit};
}
