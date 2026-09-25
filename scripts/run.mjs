#!/usr/bin/env node
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const launcher = fileURLToPath(new URL('../core/timezones/with-tzdata.mjs', import.meta.url));
const calculator = fileURLToPath(new URL('./calculate.mjs', import.meta.url));
const child = spawnSync(process.execPath, [launcher, calculator, ...process.argv.slice(2)], {stdio: 'inherit'});
if (child.error) console.error(child.error.message);
process.exitCode = child.status ?? 1;
