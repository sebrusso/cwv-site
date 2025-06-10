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

test('model quality leaderboard returns leaderboard and matrix', async () => {
  const { handleModelQualityLeaderboard } = loadRoute(
    'src/app/api/model-quality-leaderboard/route.ts'
  );
  const supabase = {
    from: () => ({
      select: async () => ({
        data: [
          { model_a_name: 'A', model_b_name: 'B', winner: 'A' },
          { model_a_name: 'A', model_b_name: 'B', winner: 'B' },
        ],
        error: null,
      }),
    }),
  };
  const res = await handleModelQualityLeaderboard(supabase);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(Array.isArray(data.leaderboard));
  assert.ok('matrix' in data);
  assert.equal(data.matrix['A']['B'], 1);
});
