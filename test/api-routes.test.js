import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'fs';
import path from 'path';
import ts from 'typescript';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

function loadRoute(tsPath) {
  const src = fs.readFileSync(tsPath, 'utf8');
  let compiled = ts.transpileModule(src, { compilerOptions: { module: 'commonjs', target: 'es2020' } }).outputText;
  const outDir = path.join('.test-tmp');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
  
  // Handle utils.ts for routes that need it
  const utilsSrc = fs.readFileSync('src/lib/utils.ts', 'utf8');
  const utilsOut = ts.transpileModule(utilsSrc, { compilerOptions: { module: 'commonjs', target: 'es2020' } }).outputText;
  const utilsPath = path.join(outDir, 'utils.cjs');
  if (!fs.existsSync(utilsPath)) fs.writeFileSync(utilsPath, utilsOut);
  const sysSrc = fs.readFileSync('src/lib/systemInstructions.ts', 'utf8');
  const sysOut = ts.transpileModule(sysSrc, { compilerOptions: { module: 'commonjs', target: 'es2020' } }).outputText;
  const sysPath = path.join(outDir, 'systemInstructions.cjs');
  if (!fs.existsSync(sysPath)) fs.writeFileSync(sysPath, sysOut);

  // Replace relative imports with the correct path for tests
  compiled = compiled
    .replace('../../../lib/utils', './utils.cjs')
    .replace('../../../lib/systemInstructions', './systemInstructions.cjs');
  
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
  assert.deepEqual(inserted, {
    user_id: 'u1',
    prompt_id: 'p1',
    model_name: '',
    guess_correct: false,
  });
});

test('model-leaderboard aggregates results', async () => {
  const { handleModelLeaderboard } = loadRoute('src/app/api/model-leaderboard/route.ts');
  const supabase = supabaseSelectMock({
    model_comparisons: [
      { model_a: 'A', model_b: 'B', winner: 'A' },
      { model_a: 'A', model_b: 'B', winner: 'B' },
      { model_a: 'B', model_b: 'C', winner: 'B' },
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
  // Leaderboard is sorted by winRate desc, Model B (~0.67) should be first, Model A (0.5) second
  assert.deepEqual(body.map((r) => r.model), ['B', 'A', 'C']);
  const modelA = body.find(r => r.model === 'A');
  const modelB = body.find(r => r.model === 'B');

  assert.ok(modelA, "Model A data should exist");
  assert.ok(modelB, "Model B data should exist");

  // Model A: 1 win / 2 total evals = 0.5
  assert.ok(Math.abs(modelA.winRate - 0.5) < 1e-6, "Model A win rate should be 0.5");
  // Model B: 2 wins / 3 total evals ≈ 0.6667
  assert.ok(Math.abs(modelB.winRate - 2 / 3) < 1e-6, "Model B win rate should be 2/3");
});

test('generate-live-comparison cache serves prefetched data', async () => {
  // Set required environment variables for tests
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.com';
  process.env.SUPABASE_SERVICE_KEY = 'test-key';
  
  const { handleGenerateLiveComparison, generationCache } = loadRoute(
    'src/app/api/generate-live-comparison/route.ts'
  );

  let callCount = 0;
  const supabase = {
    from: (table) => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: { id: 'p1', prompt: 'test prompt' }, error: null }),
        }),
      }),
      insert: () => ({
        select: () => ({ single: async () => ({ data: { id: 'g1' }, error: null }) }),
      }),
    }),
  };
  const openai = {
    chat: {
      completions: {
        create: async () => {
          callCount++;
          return { choices: [{ message: { content: 'This is a complete sentence.' } }] };
        },
      },
    },
  };

  await handleGenerateLiveComparison(supabase, openai, { prompt_db_id: 'p1', prefetch: true });
  assert.equal(callCount, 2);

  const res = await handleGenerateLiveComparison(supabase, openai, { prompt_db_id: 'p1' });
  assert.equal(callCount, 2);
  const body = await res.json();
  assert.equal(body.prompt_db_id, 'p1');
  assert.ok(!generationCache.has('p1'));
});

test('auth callback redirects to provided path', async () => {
  let exchanged;
  const supabase = { auth: { exchangeCodeForSession: async (c) => { exchanged = c; } } };
  const { handleAuthCallback } = loadRoute('src/app/auth/callback/route.ts');
  const res = await handleAuthCallback(supabase, 'code', 'http://site/dest', 'http://site');
  assert.equal(exchanged, 'code');
  assert.equal(res.status, 307);
  assert.equal(res.headers.get('location'), 'http://site/dest');
});

test('model-quality-leaderboard aggregates comparisons', async () => {
  const { handleModelQualityLeaderboard } = loadRoute(
    'src/app/api/model-quality-leaderboard/route.ts'
  );
  const supabase = supabaseSelectMock({
    model_comparisons: [
      { model_a: 'A', model_b: 'B', winner: 'A' },
      { model_a: 'A', model_b: 'B', winner: 'B' },
      { model_a: 'B', model_b: 'C', winner: 'B' },
    ],
  });
  const res = await handleModelQualityLeaderboard(supabase);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.leaderboard[0].model, 'B');
  assert.equal(body.matrix['A']['B'], 1);
});

test('human-deception-leaderboard aggregates results', async () => {
  const { handleHumanLeaderboard } = loadRoute('src/app/api/human-deception-leaderboard/route.ts');
  const supabase = supabaseSelectMock({
    human_model_evaluations: [
      { model_name: 'A', guess_correct: false },
      { model_name: 'A', guess_correct: true },
      { model_name: 'B', guess_correct: false },
    ],
  });
  const res = await handleHumanLeaderboard(supabase);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.deepEqual(body.map((r) => r.model), ['B', 'A']);
  assert.ok(Math.abs(body[0].deceptionRate - 1) < 1e-6);
  assert.ok(Math.abs(body[1].deceptionRate - 0.5) < 1e-6);
});

test('user-dashboard aggregates user stats', async () => {
  const { handleUserDashboard } = loadRoute('src/app/api/user-dashboard/route.ts');
  const supabase = supabaseSelectMock({
    human_model_evaluations: [
      { user_id: 'u1', is_correct: true, created_at: '2024-01-01T00:00:00Z' },
      { user_id: 'u2', is_correct: false, created_at: '2024-01-01T00:00:00Z' }
    ],
    model_evaluations: [
      { user_id: 'u1', is_correct: false, created_at: '2024-01-02T00:00:00Z' }
    ]
  });
  const res = await handleUserDashboard(supabase, 'u1');
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.total.correct, 1);
  assert.equal(body.total.total, 2);
});

test('content-report unauthorized', async () => {
  const { handleContentReport } = loadRoute('src/app/api/content-report/route.ts');
  const res = await handleContentReport(supabaseMock(null), {
    contentType: 'prompt',
    contentId: 'p1',
    reason: 'spam'
  });
  assert.equal(res.status, 401);
});

test('content-report inserts row', async () => {
  let inserted;
  const { handleContentReport } = loadRoute('src/app/api/content-report/route.ts');
  const res = await handleContentReport(
    supabaseMock({ user: { id: 'u1' } }, (data) => {
      inserted = data;
    }),
    { contentType: 'prompt', contentId: 'p1', reason: 'bad' }
  );
  assert.equal(res.status, 200);
  assert.deepEqual(inserted, { user_id: 'u1', content_type: 'prompt', content_id: 'p1', reason: 'bad' });
});

test('log-event inserts row', async () => {
  let inserted;
  const { handleLogEvent } = loadRoute('src/app/api/log-event/route.ts');
  const res = await handleLogEvent(
    supabaseMock(null, (data) => {
      inserted = data;
    }),
    { eventType: 'click', eventData: { a: 1 } }
  );
  assert.equal(res.status, 200);
  assert.deepEqual(inserted, { user_id: null, event_type: 'click', event_data: { a: 1 } });
});
