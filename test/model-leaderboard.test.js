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

function supabaseSelectMock(dataMap) {
  return {
    from: (table) => ({
      select: async () => ({ data: dataMap[table], error: null }),
    }),
  };
}

test('model leaderboard returns an array of entries', async () => {
  const { handleModelLeaderboard } = loadRoute('src/app/api/model-leaderboard/route.ts');
  const supabase = supabaseSelectMock({
    model_evaluations: [
      { model_name: 'A', is_correct: true },
      { model_name: 'A', is_correct: false },
      { model_name: 'B', is_correct: true },
    ],
    human_model_evaluations: [
      { model_name: 'A', is_correct: false },
      { model_name: 'B', is_correct: false },
      { model_name: 'B', is_correct: false }
    ],
  });
  const res = await handleModelLeaderboard(supabase);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(Array.isArray(data));
  assert.equal(data.length, 2, "Should return data for both models");
  
  // Find model entries
  const modelA = data.find(entry => entry.model === 'A');
  const modelB = data.find(entry => entry.model === 'B');
  
  assert.ok(modelA, "Model A should be in results");
  assert.ok(modelB, "Model B should be in results");
  
  // Check win rates
  assert.equal(modelA.humanDeceptions, 1, "Model A should have 1 human deception");
  assert.equal(modelB.humanDeceptions, 2, "Model B should have 2 human deceptions");
  
  // Verify model win rates based on the test data
  assert.equal(modelA.totalEvaluations, 2, "Model A should have 2 evaluations");
  assert.equal(modelB.totalEvaluations, 1, "Model B should have 1 evaluation");
});

