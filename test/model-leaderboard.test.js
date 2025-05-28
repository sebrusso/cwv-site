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

function supabaseMock(dataMap) {
  return {
    from: (table) => ({
      select: async () => ({ data: dataMap[table], error: null }),
    }),
  };
}

test('model leaderboard returns an array of entries', async () => {
  const { handleModelLeaderboard } = loadRoute('src/app/api/model-leaderboard/route.ts');
  const supabase = supabaseMock({
    model_evaluations: [
      { model_name: 'A', is_correct: true },
      { model_name: 'B', is_correct: false },
    ],
    human_model_evaluations: [
      { model_name: 'A', is_correct: true },
    ],
  });
  const res = await handleModelLeaderboard(supabase);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(Array.isArray(data));
  assert.ok(data.length > 0);
  assert.ok('model' in data[0]);
});
