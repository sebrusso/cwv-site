import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'fs';
import path from 'path';
import ts from 'typescript';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

function loadRoute(tsPath) {
  const src = fs.readFileSync(tsPath, 'utf8');
  const compiled = ts.transpileModule(src, { compilerOptions: { module: 'commonjs', target: 'es2020' } }).outputText;
  const outDir = path.join('.test-tmp');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
  const unique = path.basename(path.dirname(tsPath)) + '-' + path.basename(tsPath);
  const outPath = path.join(outDir, unique + '.cjs');
  fs.writeFileSync(outPath, compiled);
  return require(path.resolve(outPath));
}

function supabaseSelectMock(data) {
  return {
    from: () => ({
      select: async () => ({ data, error: null })
    })
  };
}

test('speed mode leaderboard returns entries', async () => {
  const { handleSpeedModeLeaderboard } = loadRoute('src/app/api/speed-mode-leaderboard/route.ts');
  const supabase = supabaseSelectMock([
    { username: 'a', total_correct: 5, attempts: 10, accuracy: 0.5, best_streak: 2 },
    { username: 'b', total_correct: 8, attempts: 10, accuracy: 0.8, best_streak: 5 }
  ]);
  const res = await handleSpeedModeLeaderboard(supabase);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.length, 2);
  assert.equal(data[0].username, 'a');
});
