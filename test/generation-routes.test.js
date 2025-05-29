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
  transpileAndWrite('src/lib/textStats.ts', 'textStats', '../../../lib/textStats');
  transpileAndWrite('src/lib/ai/storyLengthBalancer.ts', 'storyLengthBalancer', '../../../lib/ai/storyLengthBalancer');
  
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
test('generate-live-comparison accepts custom prompt text', async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.com';
  process.env.SUPABASE_SERVICE_KEY = 'test-key';

  const { handleGenerateLiveComparison } = loadRoute('src/app/api/generate-live-comparison/route.ts');
  let insertedPromptTextInDb; // To check what's inserted in DB
  let promptTextUsedForGeneration; // To check what's passed to AI generation

  const supabaseMock = {
    from: (table) => {
      if (table === 'writingprompts-pairwise-test') {
        return {
          insert: (data) => {
            insertedPromptTextInDb = data.prompt; // Capture the prompt text being inserted
            return {
              select: () => ({
                single: async () => ({ data: { id: 'new1', prompt: data.prompt }, error: null })
              })
            };
          },
          select: () => ({ // Fallback for non-custom prompt path, not strictly needed for this test
            eq: () => ({ single: async () => ({ data: { id: 'p1', prompt: 'Default Prompt' }, error: null }) }),
          }),
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

  // Mock global.fetch as aiService.generateText uses it
  const originalFetch = global.fetch;
  // @ts-ignore
  global.fetch = async (url, init) => {
    if (url.includes('api.openai.com')) { // Check if it's an OpenAI call
      const body = JSON.parse(init.body);
      promptTextUsedForGeneration = body.messages.find(m => m.role === 'user')?.content;
    }
    return {
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'Done.' }, finish_reason: 'stop' }] }),
      text: async () => "Done." // Fallback for non-JSON responses if any
    };
  };

  // Call with prompt_text, no openai client needed in the call
  const res = await handleGenerateLiveComparison(supabaseMock, { prompt_text: 'My custom test prompt' });
  global.fetch = originalFetch; // Restore original fetch

  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.prompt_text, 'My custom test prompt'); // Check if the API returns the custom prompt
  assert.equal(insertedPromptTextInDb, 'My custom test prompt'); // Check if custom prompt was "inserted"
  assert.equal(promptTextUsedForGeneration, 'My custom test prompt'); // Check if custom prompt was used for AI generation
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

test('gpt-4.1 model configuration and system instructions', async () => {
  const { handleGenerateOpenAI } = loadRoute('src/app/api/generate-openai/route.ts');
  let captured;
  const fetchMock = async (url, init) => {
    captured = JSON.parse(init.body);
    return {
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'Generated with GPT-4.1.' }, finish_reason: 'stop' }] }),
    };
  };
  
  const res = await handleGenerateOpenAI(fetchMock, { prompt: 'Write a creative story', model: 'gpt-4.1' });
  assert.equal(res.status, 200);
  
  // Verify GPT-4.1 model is used
  assert.equal(captured.model, 'gpt-4.1');
  
  // Verify system message contains GPT-4.1 specific instructions
  const systemMessage = captured.messages.find(m => m.role === 'system');
  assert.ok(systemMessage, 'System message should be present');
  assert.ok(systemMessage.content.includes('GPT-4.1'), 'System message should reference GPT-4.1');
  assert.ok(systemMessage.content.includes('exceptional'), 'System message should emphasize GPT-4.1 capabilities');
  
  // Verify default max_tokens is higher for GPT-4.1
  assert.ok(captured.max_tokens >= 512, 'GPT-4.1 should have higher max_tokens default');
  
  const body = await res.json();
  assert.equal(body.text, 'Generated with GPT-4.1.');
});
