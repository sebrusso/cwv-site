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
    model_comparisons: [
      { model_a: 'A', model_b: 'B', winner: 'B' }, // B beats A
      { model_a: 'A', model_b: 'C', winner: 'A' }, // A beats C
    ],
    human_model_evaluations: [
      { model_name: 'A', is_correct: false }, // Model A deception
      { model_name: 'B', is_correct: false }, // Model B deception
      { model_name: 'B', is_correct: false }  // Model B deception
    ],
  });
  const res = await handleModelLeaderboard(supabase);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(Array.isArray(data));
  assert.equal(data.length, 3, "Should return data for all models");
  
  const modelA = data.find(entry => entry.model === 'A');
  const modelB = data.find(entry => entry.model === 'B');
  const modelC = data.find(entry => entry.model === 'C');
  
  assert.ok(modelA, "Model A should be in results");
  assert.ok(modelB, "Model B should be in results");
  assert.ok(modelC, "Model C should be in results");
  
  // Check human deceptions (human_model_evaluations where is_correct is false)
  assert.equal(modelA.humanDeceptions, 1, "Model A human deceptions");
  assert.equal(modelB.humanDeceptions, 2, "Model B human deceptions");

  // Check total evaluations (from model_comparisons)
  assert.equal(modelA.totalEvaluations, 2, "Model A total evaluations");
  assert.equal(modelB.totalEvaluations, 1, "Model B total evaluations");
  
  // Check win rate (based on model_comparisons: wins / totalEvaluations)
  // Model A: 1 win / 2 total = 0.5
  // Model B: 1 win / 1 total = 1.0
  assert.ok(Math.abs(modelA.winRate - 0.5) < 1e-6, "Model A win rate");
  assert.ok(Math.abs(modelB.winRate - 1.0) < 1e-6, "Model B win rate");
});

