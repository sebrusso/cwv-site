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
  const outPath = path.join(outDir, path.basename(tsPath).replace('.ts', '.cjs'));
  fs.writeFileSync(outPath, compiled);
  return require(path.resolve(outPath));
}

function supabaseMock(existing) {
  let saved;
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: existing, error: existing ? null : { code: 'PGRST116' } })
        })
      }),
      upsert: async (data) => { saved = data; existing = data; return { error: null }; }
    }),
    __get: () => saved
  };
}

test('creates and increments anonymous session', async () => {
  const supabase = supabaseMock(null);
  const { handleAnonymousSession } = loadRoute('src/app/api/anonymous-session/route.ts');
  const res1 = await handleAnonymousSession(supabase, { sessionId: 'abc', increment: false });
  assert.equal(res1.status, 200);
  const res2 = await handleAnonymousSession(supabase, { sessionId: 'abc', increment: true });
  assert.equal(res2.status, 200);
  const rec = supabase.__get();
  assert.equal(rec.session_id, 'abc');
  assert.equal(rec.evaluations_count, 1);
});
