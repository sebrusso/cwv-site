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
      select: async () => ({ data: rows, error: null }),
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
  assert.equal(body.topScores[0].userId, 'u2');
  assert.equal(body.bestStreaks[0].userId, 'u1');
});
