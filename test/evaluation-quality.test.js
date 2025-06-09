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
      select: async () => ({ data: [], error: null }),
    }),
  };
}

test('evaluation-quality unauthorized', async () => {
  const { handlePostQuality } = loadRoute('src/app/api/evaluation-quality/route.ts');
  const res = await handlePostQuality(supabaseMock(null), { evaluationTime: 1000, promptSimilarity: 0.5, confidenceScore: 0.8 });
  assert.equal(res.status, 401);
});

test('evaluation-quality inserts row', async () => {
  let inserted;
  const { handlePostQuality } = loadRoute('src/app/api/evaluation-quality/route.ts');
  const res = await handlePostQuality(
    supabaseMock({ user: { id: 'u1' } }, (data) => { inserted = data; }),
    { evaluationTime: 2000, promptSimilarity: 0.6, confidenceScore: 0.9 }
  );
  assert.equal(res.status, 200);
  assert.deepEqual(inserted, {
    user_id: 'u1',
    evaluation_time: 2000,
    prompt_similarity: 0.6,
    confidence_score: 0.9,
  });
});
