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

function supabaseMock(session, onInsert) {
  return {
    auth: {
      getSession: async () => ({ data: { session } }),
    },
    from: () => ({
      insert: async (data) => {
        if (onInsert) onInsert(data);
        return { error: null };
      },
    }),
  };
}

function supabaseSelectMock(dataMap) {
  return {
    from: (table) => ({
      select: async () => ({ data: dataMap[table], error: null }),
    }),
  };
}

test('download-dataset unauthorized', async () => {
  const { handleDownloadDataset } = loadRoute('src/app/api/download-dataset/route.ts');
  const res = await handleDownloadDataset(supabaseMock(null));
  assert.equal(res.status, 401);
});

test('download-dataset inserts row for authorized user', async () => {
  let inserted = false;
  const { handleDownloadDataset } = loadRoute('src/app/api/download-dataset/route.ts');
  process.env.DATASET_URL = 'https://example.com/dataset';
  const res = await handleDownloadDataset(
    supabaseMock({ user: { id: '123' } }, () => {
      inserted = true;
    })
  );
  assert.equal(res.status, 200);
  assert.ok(inserted);
});

test('human-model-evaluations unauthorized', async () => {
  const { handleHumanModelEvaluation } = loadRoute('src/app/api/human-model-evaluations/route.ts');
  const res = await handleHumanModelEvaluation(supabaseMock(null), { prompt_id: 'p1', is_correct: true });
  assert.equal(res.status, 401);
});

test('human-model-evaluations inserts row', async () => {
  let inserted;
  const { handleHumanModelEvaluation } = loadRoute('src/app/api/human-model-evaluations/route.ts');
  const res = await handleHumanModelEvaluation(
    supabaseMock({ user: { id: 'u1' } }, (data) => {
      inserted = data;
    }),
    { prompt_id: 'p1', is_correct: false }
  );
  assert.equal(res.status, 200);
  assert.deepEqual(inserted, { user_id: 'u1', prompt_id: 'p1', is_correct: false });
});

test('model-leaderboard aggregates results', async () => {
  const { handleModelLeaderboard } = loadRoute('src/app/api/model-leaderboard/route.ts');
  const supabase = supabaseSelectMock({
    model_evaluations: [
      { model_name: 'A', is_correct: true },
      { model_name: 'A', is_correct: false },
      { model_name: 'B', is_correct: true },
    ],
    human_model_evaluations: [
      { model_name: 'A', is_correct: true },
      { model_name: 'B', is_correct: false },
      { model_name: 'B', is_correct: false },
    ],
  });
  const res = await handleModelLeaderboard(supabase);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.deepEqual(body.map((r) => r.model), ['A', 'B']);
  assert.ok(Math.abs(body[0].winRate - 2 / 3) < 1e-6);
  assert.ok(Math.abs(body[1].winRate - 1 / 3) < 1e-6);
});

test('model-quality-leaderboard aggregates comparisons', async () => {
  const { handleModelQualityLeaderboard } = loadRoute(
    'src/app/api/model-quality-leaderboard/route.ts'
  );
  const supabase = supabaseSelectMock({
    model_comparisons: [
      { model_a_name: 'A', model_b_name: 'B', winner: 'A' },
      { model_a_name: 'A', model_b_name: 'B', winner: 'B' },
      { model_a_name: 'B', model_b_name: 'C', winner: 'B' },
    ],
  });
  const res = await handleModelQualityLeaderboard(supabase);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.leaderboard[0].model, 'B');
  assert.equal(body.matrix['A']['B'], 1);
});
