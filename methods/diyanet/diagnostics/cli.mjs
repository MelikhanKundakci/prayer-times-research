#!/usr/bin/env node
import fs from 'node:fs/promises';
import { fitPointConsistency } from './point-consistency.mjs';

try {
  const args = process.argv.slice(2);
  if (args.length !== 1 || args[0] === '--help') {
    process.stdout.write('Usage: node methods/diyanet/diagnostics/cli.mjs input.json|-\nReads user-supplied observations; prints one research diagnostic JSON; writes no files.\n');
    if (args[0] !== '--help') process.exitCode = 1;
  } else {
    const text = args[0] === '-' ? await new Promise((resolve, reject) => {
      const chunks = []; process.stdin.setEncoding('utf8');
      process.stdin.on('data', chunk => chunks.push(chunk));
      process.stdin.on('end', () => resolve(chunks.join(''))); process.stdin.on('error', reject);
    }) : await fs.readFile(args[0], 'utf8');
    process.stdout.write(JSON.stringify(fitPointConsistency(JSON.parse(text)), null, 2) + '\n');
  }
} catch (error) {
  process.stderr.write(`Point consistency diagnostic: ${error.message}\n`);
  process.exitCode = 1;
}
