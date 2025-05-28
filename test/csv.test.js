import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'fs';
import path from 'path';
import ts from 'typescript';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

function loadTS(tsPath) {
  const src = fs.readFileSync(tsPath, 'utf8');
  const compiled = ts.transpileModule(src, { compilerOptions: { module: 'commonjs', target: 'es2020' } }).outputText;
  const outDir = path.join('.test-tmp');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
  const unique = path.basename(tsPath).replace(/\\W/g, '') + '.cjs';
  const outPath = path.join(outDir, unique);
  fs.writeFileSync(outPath, compiled);
  return require(path.resolve(outPath));
}

test('toCSV generates CSV string', () => {
  const { toCSV } = loadTS('src/lib/csv.ts');
  const rows = [{ model: 'A', rate: 0.5 }];
  const csv = toCSV(rows, [
    { key: 'model', label: 'Model' },
    { key: 'rate', label: 'Rate' },
  ]);
  assert.equal(csv.trim(), 'Model,Rate\nA,0.5');
});
