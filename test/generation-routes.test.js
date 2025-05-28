import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'fs';
import path from 'path';
import ts from 'typescript';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

function loadRoute(tsPath) {
  const src = fs.readFileSync(tsPath, 'utf8');
  let compiled = ts.transpileModule(src, {
    compilerOptions: { module: 'commonjs', target: 'es2020' },
  }).outputText;
  const outDir = path.join('.test-tmp');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

  const transpileAndWrite = (srcFile, outFilePrefix, relativePath) => {
    const src = fs.readFileSync(srcFile, 'utf8');
    const out = ts.transpileModule(src, { compilerOptions: { module: 'commonjs', target: 'es2020' } }).outputText;
    const outPath = path.join(outDir, `${outFilePrefix}.cjs`);
    if (!fs.existsSync(outPath)) fs.writeFileSync(outPath, out);
    // Replace relative paths in the compiled code
    compiled = compiled.replace(new RegExp(relativePath.replace(/\//g, '\\/'), 'g'), `./${outFilePrefix}.cjs`);
  };

  transpileAndWrite('src/lib/utils.ts', 'utils', '../../../lib/utils');
  transpileAndWrite('src/lib/systemInstructions.ts', 'systemInstructions', '../../../lib/systemInstructions');
  transpileAndWrite('src/lib/models/aiService.ts', 'aiService', '../../../lib/models/aiService');
  transpileAndWrite('src/lib/models/modelConfig.ts', 'modelConfig', '../../../lib/models/modelConfig');
  
  const unique = path.basename(path.dirname(tsPath)) + '-' + path.basename(tsPath);
  const outPath = path.join(outDir, unique + '.cjs');
  fs.writeFileSync(outPath, compiled);
  return require(path.resolve(outPath));
}

test('generate-openai truncates incomplete sentences', async () => {
  const { handleGenerateOpenAI } = loadRoute('src/app/api/generate-openai/route.ts');
  const fetchMock = async (url, init) => {
    return {
      ok: true,
      json: async () => ({
        choices: [
          { message: { content: 'Hello world. This is partial' }, finish_reason: 'length' },
        ],
      }),
    };
  };
  const res = await handleGenerateOpenAI(fetchMock, { prompt: 'test', model: 'gpt' });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.text, 'Hello world.');
});

test('generate-openai error when no boundary', async () => {
  const { handleGenerateOpenAI } = loadRoute('src/app/api/generate-openai/route.ts');
  const fetchMock = async () => ({
    ok: true,
    json: async () => ({ choices: [{ message: { content: 'word word word' }, finish_reason: 'length' }] }),
  });
  const res = await handleGenerateOpenAI(fetchMock, { prompt: 'test', model: 'gpt' });
  assert.equal(res.status, 500);
});

test('generate-live-comparison trims both responses', async () => {
  // Set required environment variables for tests
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.com';
  process.env.SUPABASE_SERVICE_KEY = 'test-key';
  
  const { handleGenerateLiveComparison } = loadRoute('src/app/api/generate-live-comparison/route.ts');
  const supabase = {
    from: (table) => {
      if (table === 'writingprompts-pairwise-test') {
        return {
          select: () => ({
            eq: () => ({ single: async () => ({ data: { id: 'p1', prompt: 'Prompt' }, error: null }) }),
          }),
        };
      }
      if (table === 'live_generations') {
        return {
          insert: () => ({
            select: () => ({ single: async () => ({ data: { id: 'g1' }, error: null }) }),
          }),
        };
      }
      return {};
    },
  };
  
  let call = 0;
  const fetchMock = async () => {
    call++;
    return {
      ok: true,
      json: async () => ({
        choices: [
          {
            message: { content: call === 1 ? 'A sentence. And partial' : 'Another full sentence.' },
            finish_reason: 'length',
          },
        ],
      }),
    };
  };
  const originalFetch = global.fetch;
  // @ts-ignore
  global.fetch = fetchMock;
  const res = await handleGenerateLiveComparison(supabase, { prompt_db_id: 'p1' });
  global.fetch = originalFetch;
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.response_A, 'A sentence.');
  assert.equal(body.response_B, 'Another full sentence.');
});


test('generate-openai uses provided parameters', async () => {
  const { handleGenerateOpenAI } = loadRoute('src/app/api/generate-openai/route.ts');
  let captured;
  const fetchMock = async (url, init) => {
    captured = JSON.parse(init.body);
    return {
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'Done.' }, finish_reason: 'stop' }] }),
    };
  };
  const res = await handleGenerateOpenAI(fetchMock, { prompt: 'hi', model: 'gpt-test', params: { temperature: 0.9 } });
  assert.equal(res.status, 200);
  assert.equal(captured.temperature, 0.9);
  const systemMessage = captured.messages.find(m => m.role === 'system');
  assert.ok(systemMessage, 'System message should be present');
  // Check if systemInstructions.getSystemInstruction was called for 'gpt-test' (or a default)
  // This requires systemInstructions.ts to export a simple getSystemInstruction for testing or actual logic.
  // For this test, we assume getSystemInstruction returns a non-empty string for 'gpt-test' or any model.
  assert.ok(systemMessage.content.length > 0, 'System message content should not be empty');
});
