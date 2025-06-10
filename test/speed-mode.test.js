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
  fs.mkdirSync(outDir, { recursive: true });
  const unique = path.basename(path.dirname(tsPath)) + '-' + path.basename(tsPath);
  const outPath = path.join(outDir, unique + '.cjs');
  fs.writeFileSync(outPath, compiled);
  return require(path.resolve(outPath));
}

function supabaseMock(session, onInsert) {
  return {
    auth: { getSession: async () => ({ data: { session } }) },
    from: () => ({
      insert: async (data) => {
        if (onInsert) onInsert(data);
        return { error: null };
      },
    }),
  };
}

function supabaseSelectMock(rows) {
  return {
    from: () => ({
      select: () => {
        const builder = {
          async then(resolve) {
            return resolve({ data: rows, error: null });
          },
          async eq(field, value) {
            return { data: rows.filter((r) => r[field] === value), error: null };
          },
        };
        return builder;
      },
    }),
  };
}

test('speed-mode POST unauthorized', async () => {
  const { handlePostSpeedScore } = loadRoute('src/app/api/speed-mode/route.ts');
  const res = await handlePostSpeedScore(supabaseMock(null), {
    correct: 1,
    total: 2,
    durationSeconds: 10,
    longestStreak: 2,
  });
  assert.equal(res.status, 401);
});

test('speed-mode POST inserts row', async () => {
  let inserted;
  const { handlePostSpeedScore } = loadRoute('src/app/api/speed-mode/route.ts');
  const res = await handlePostSpeedScore(
    supabaseMock({ user: { id: 'u1' } }, (d) => { inserted = d; }),
    { correct: 3, total: 5, durationSeconds: 40, longestStreak: 4 },
  );
  assert.equal(res.status, 200);
  assert.deepEqual(inserted, {
    user_id: 'u1',
    correct: 3,
    total: 5,
    duration_seconds: 40,
    longest_streak: 4,
  });
});

test('speed-mode leaderboard aggregates results', async () => {
  const { handleSpeedModeLeaderboard } = loadRoute('src/app/api/speed-mode/route.ts');
  const supabase = supabaseSelectMock([
    { user_id: 'u1', correct: 8, total: 10, longest_streak: 5 },
    { user_id: 'u1', correct: 5, total: 10, longest_streak: 8 },
    { user_id: 'u2', correct: 9, total: 10, longest_streak: 4 },
  ]);
  const res = await handleSpeedModeLeaderboard(supabase);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.length, 2);
  const u1 = body.find((r) => r.user_id === 'u1');
  const u2 = body.find((r) => r.user_id === 'u2');
  assert.ok(u1);
  assert.ok(u2);
  assert.equal(u1.total_correct, 13);
  assert.equal(u1.attempts, 20);
  assert.equal(u1.best_streak, 8);
  assert.equal(u2.total_correct, 9);
  assert.equal(u2.attempts, 10);
});

test('speed-mode user stats are computed', async () => {
  const { handleUserSpeedStats } = loadRoute('src/app/api/speed-mode/route.ts');
  const supabase = supabaseSelectMock([
    { user_id: 'u1', correct: 2, longest_streak: 3 },
    { user_id: 'u1', correct: 7, longest_streak: 5 },
    { user_id: 'u2', correct: 9, longest_streak: 4 },
  ]);
  const res = await handleUserSpeedStats(supabase, 'u1');
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.bestScore, 7);
  assert.equal(body.longestStreak, 5);
});
