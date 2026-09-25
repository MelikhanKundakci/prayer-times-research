#!/usr/bin/env node
// Start a NEW Node process: ICU reads the directory before its first initialization.
import {spawnSync} from 'node:child_process';
import {verifiedBundle} from './bundle.mjs';

try {
  const args = process.argv.slice(2);
  if (!args.length) throw new Error('Usage: node core/timezones/with-tzdata.mjs <Node arguments or script>');
  const bundle = verifiedBundle();
  const env = {...process.env, ICU_TIMEZONE_FILES_DIR:bundle.directory};
  const check = spawnSync(process.execPath, ['-p', 'process.versions.tz'], {env, encoding:'utf8'});
  if (check.error) throw check.error;
  if (check.status !== 0 || check.stdout.trim() !== bundle.version) throw new Error(`Node did not load pinned ICU timezone data ${bundle.version}: ${check.stderr || check.stdout}`);
  const child = spawnSync(process.execPath, args, {env, stdio:'inherit'});
  if (child.error) throw child.error;
  process.exitCode = child.status ?? 1;
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
