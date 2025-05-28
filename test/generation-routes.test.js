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
  const utilsSrc = fs.readFileSync('src/lib/utils.ts', 'utf8');
  const utilsOut = ts.transpileModule(utilsSrc, { compilerOptions: { module: 'commonjs', target: 'es2020' } }).outputText;
  const utilsPath = path.join(outDir, 'utils.cjs');
  if (!fs.existsSync(utilsPath)) fs.writeFileSync(utilsPath, utilsOut);
  compiled = compiled.replace('../../../lib/utils', './utils.cjs');
  const unique = path.basename(path.dirname(tsPath)) + '-' + path.basename(tsPath);
  const outPath = path.join(outDir, unique + '.cjs');
  fs.writeFileSync(outPath, compiled);
  return require(path.resolve(outPath));
}

test('generate-openai truncates incomplete sentences', async () => {
  const { handleGenerateOpenAI } = loadRoute('src/app/api/generate-openai/route.ts');
  const fetchMock = async () => ({
    ok: true,
    json: async () => ({
      choices: [
        { message: { content: 'Hello world. This is partial' }, finish_reason: 'length' },
      ],
    }),
  });
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
  const openai = {
    chat: {
      completions: {
        create: async () => {
          call++;
          return { 
            choices: [
              {
                message: {
                  content: call === 1 ? 'A sentence. And partial' : 'Another full sentence.',
                },
                finish_reason: 'length',
              },
            ]
          };
        }
      }
    }
  };
  
  const res = await handleGenerateLiveComparison(supabase, openai, { prompt_db_id: 'p1' });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.response_A, 'A sentence.');
  assert.equal(body.response_B, 'Another full sentence.');
});

test('generate-live-comparison accepts custom prompt text', async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.com';
  process.env.SUPABASE_SERVICE_KEY = 'test-key';

  const { handleGenerateLiveComparison } = loadRoute('src/app/api/generate-live-comparison/route.ts');
  let insertedPrompt;
  const supabase = {
    from: (table) => {
      if (table === 'writingprompts-pairwise-test') {
        return {
          insert: (data) => ({
            select: () => ({
              single: async () => ({ data: { id: 'new1', prompt: data.prompt }, error: null })
            })
          })
        };
      }
      if (table === 'live_generations') {
        return {
          insert: () => ({ select: () => ({ single: async () => ({ data: { id: 'g1' }, error: null }) }) })
        };
      }
      return {};
    }
  };
  const openai = {
    chat: {
      completions: {
        create: async ({ messages }) => {
          insertedPrompt = messages[1].content;
          return { choices: [{ message: { content: 'Done.' }, finish_reason: 'stop' }] };
        }
      }
    }
  };

  const res = await handleGenerateLiveComparison(supabase, openai, { prompt_text: 'My prompt' });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.prompt_text, 'My prompt');
  assert.equal(insertedPrompt, 'My prompt');
});

