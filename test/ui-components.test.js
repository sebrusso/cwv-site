import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'fs';
import path from 'path';
import ts from 'typescript';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

function loadTSX(tsPath) {
  let src = fs.readFileSync(tsPath, 'utf8');
  src = src.replace("@/lib/utils", './utils.cjs');
  const compiled = ts.transpileModule(src, { compilerOptions: { module: 'commonjs', target: 'es2020', jsx: 'react' } }).outputText;
  const outDir = path.join('.test-tmp');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
  const outPath = path.join(outDir, path.basename(tsPath) + '.cjs');
  fs.writeFileSync(outPath, compiled);
  const utilsSrc = fs.readFileSync('src/lib/utils.ts', 'utf8');
  const utilsCompiled = ts.transpileModule(utilsSrc, { compilerOptions: { module: 'commonjs', target: 'es2020' } }).outputText;
  fs.writeFileSync(path.join(outDir, 'utils.cjs'), utilsCompiled);
  return require(path.resolve(outPath));
}

test('skeleton component exports', () => {
  const { Skeleton } = loadTSX('src/components/ui/skeleton.tsx');
  assert.equal(typeof Skeleton, 'function');
});

