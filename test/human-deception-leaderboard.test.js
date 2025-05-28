import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'fs';
import path from 'path';
import ts from 'typescript';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

function loadRoute(tsPath) {
  const src = fs.readFileSync(tsPath, 'utf8');
  const compiled = ts.transpileModule(src, {
    compilerOptions: { module: 'commonjs', target: 'es2020' },
  }).outputText;
  const outDir = path.join('.test-tmp');
  fs.mkdirSync(outDir, { recursive: true });
  const unique = path.basename(path.dirname(tsPath)) + '-' + path.basename(tsPath);
  const outPath = path.join(outDir, unique + '.cjs');
  fs.writeFileSync(outPath, compiled);
  return require(path.resolve(outPath));
}

function supabaseSelectMock(data) {
  return {
    from: () => ({
      select: () => ({ data, error: null }),
      gte: () => ({ select: () => ({ data, error: null }) }),
      lte: () => ({ select: () => ({ data, error: null }) }),
    }),
  };
}

test('human-deception-leaderboard sorts by success rate', async () => {
  const { handleHumanDeceptionLeaderboard } = loadRoute(
    'src/app/api/human-deception-leaderboard/route.ts'
  );
  const supabase = supabaseSelectMock([
    { model_name: 'A', guess_correct: false, created_at: '2024-01-01' },
    { model_name: 'A', guess_correct: true, created_at: '2024-01-02' },
    { model_name: 'B', guess_correct: false, created_at: '2024-01-01' },
    { model_name: 'B', guess_correct: false, created_at: '2024-01-03' },
  ]);
  const res = await handleHumanDeceptionLeaderboard(supabase);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.deepEqual(body.map((r) => r.model), ['B', 'A']);
  assert.equal(body[0].total, 2);
  assert.ok(body[0].successRate > body[1].successRate);
});
