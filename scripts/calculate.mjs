import fs from 'node:fs';
import {methodIds, loadMethod} from '../methods/index.mjs';
import {preview} from './output.mjs';

const usage = 'Usage: node scripts/run.mjs --list | <family> (--example | --input FILE) [--full]';
try {
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === '--list') {
    console.log(methodIds.join('\n'));
  } else {
    const family = args.shift();
    const module = await loadMethod(family);
    let filename, example = false, full = false;
    while (args.length) {
      const option = args.shift();
      if (option === '--full' && !full) full = true;
      else if (option === '--example' && !example && !filename) example = true;
      else if (option === '--input' && !filename && !example && args.length) filename = args.shift();
      else throw new Error(usage);
    }
    if (!example && !filename) throw new Error(usage);
    const source = example ? new URL(`../methods/${family}/examples/input.json`, import.meta.url) : filename;
    const input = JSON.parse(fs.readFileSync(source, 'utf8'));
    const result = module.calculate(input);
    console.log(JSON.stringify(full ? result : preview(result), null, 2));
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
