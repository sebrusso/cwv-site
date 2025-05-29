import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'fs';
import path from 'path';
import ts from 'typescript';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

function loadConfig(tsPath) {
  const src = fs.readFileSync(tsPath, 'utf8');
  const compiled = ts.transpileModule(src, { compilerOptions: { module: 'commonjs', target: 'es2020' } }).outputText;
  const outDir = path.join('.test-tmp');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'config.cjs');
  fs.writeFileSync(outPath, compiled);
  return require(path.resolve(outPath));
}

test('default config hides leaderboard date filters', () => {
  const { config } = loadConfig('src/config.ts');
  assert.equal(config.showLeaderboardDateFilters, false);
});
