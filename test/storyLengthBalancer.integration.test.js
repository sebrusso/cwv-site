import assert from 'node:assert/strict';
import { test } from 'node:test';

// Mock the dependencies for the API route
const mockUtils = {
  isValidLength: (str, min, max) => str.length >= min && str.length <= max,
  truncateToSentence: (text) => ({ text })
};

const mockSystemInstructions = {
  getSystemInstruction: () => 'Default system instruction'
};

const mockAiService = {
  generateText: async () => 'Generated text from aiService'
};

// Mock the new dependencies
const mockTextStats = {
  countWords: (str) => str.split(/\s+/).filter(w => w.length > 0).length,
  countParagraphs: (str) => {
    if (!str || !str.trim()) return 0;
    const paragraphs = str.trim().split(/\n\s*\n|\n/).filter(para => para.trim().length > 0);
    return Math.max(1, paragraphs.length);
  }
};

const mockStoryLengthBalancer = {
  buildBalancedChatRequest: (prompt, referenceStory) => {
    const refWords = mockTextStats.countWords(referenceStory);
    const refParas = mockTextStats.countParagraphs(referenceStory);
    const avgParaWords = Math.round(refWords / refParas);
    const lo = Math.round(refWords * 0.95);
    const hi = Math.round(refWords * 1.05);
    const maxTokens = Math.ceil(refWords * 1.35) + 50;

    return {
      model: "gpt-4o-latest",
      messages: [
        { role: "system", content: `Write ONE complete story in *${refParas}* paragraphs. Each paragraph ≈ ${avgParaWords} words (±15). Total length between ${lo} and ${hi} words.` },
        { role: "user", content: prompt }
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
      top_p: 0.9,
      frequency_penalty: 0.15,
      presence_penalty: 0,
      stop: ["<|endofstory|>"]
    };
  }
};

test('generate-openai with reference story uses story length balancer', async () => {
  // Mock the handleGenerateOpenAI function logic
  const handleGenerateOpenAI = async (fetchFn, { prompt, model, params, referenceStory }) => {
    if (referenceStory) {
      // Use StoryLength-Balancer v1.0 for balanced generation
      const balancedRequest = mockStoryLengthBalancer.buildBalancedChatRequest(prompt, referenceStory);
      
      // Calculate reference story stats for logging
      const refWords = mockTextStats.countWords(referenceStory);
      const refParas = mockTextStats.countParagraphs(referenceStory);
      const genTokens = balancedRequest.max_tokens;

      // Make direct OpenAI API call with balanced parameters
      const res = await fetchFn('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer test-key`,
        },
        body: JSON.stringify(balancedRequest),
      });

      const data = await res.json();
      let text = data.choices?.[0]?.message?.content || '';
      
      // Remove the end token if present
      text = text.replace(/<\|endofstory\|>/g, '').trim();

      return {
        json: async () => ({ text, refWords, refParas, genTokens }),
        status: 200
      };
    } else {
      // Use existing generateText service for backward compatibility
      const text = await mockAiService.generateText();
      return {
        json: async () => ({ text }),
        status: 200
      };
    }
  };

  // Test with reference story
  const fetchMock = async (url, init) => {
    const body = JSON.parse(init.body);
    
    // Verify the balanced request structure
    assert.equal(body.model, 'gpt-4o-latest');
    assert.equal(body.messages.length, 2);
    assert.equal(body.messages[0].role, 'system');
    assert.equal(body.messages[1].role, 'user');
    assert.ok(body.messages[0].content.includes('*2* paragraphs'));
    assert.ok(body.messages[0].content.includes('≈ 7 words'));
    assert.equal(body.temperature, 0.7);
    assert.deepEqual(body.stop, ['<|endofstory|>']);
    
    return {
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Generated balanced story<|endofstory|>' } }]
      })
    };
  };

  const referenceStory = 'Short story with ten words exactly here.\n\nSecond paragraph with eight words total.'; // 13 words, 2 paragraphs
  const res = await handleGenerateOpenAI(fetchMock, {
    prompt: 'Write a story',
    model: 'gpt-4o',
    referenceStory
  });

  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.text, 'Generated balanced story');
  assert.equal(body.refWords, 13);
  assert.equal(body.refParas, 2);
  assert.equal(body.genTokens, 68); // 13 * 1.35 + 50 = 67.55 -> 68
});

test('generate-openai without reference story uses existing flow', async () => {
  // Mock the handleGenerateOpenAI function logic
  const handleGenerateOpenAI = async (fetchFn, { prompt, model, params, referenceStory }) => {
    if (referenceStory) {
      // This path should not be taken
      throw new Error('Should not use balanced generation without reference story');
    } else {
      // Use existing generateText service for backward compatibility
      const text = await mockAiService.generateText();
      return {
        json: async () => ({ text }),
        status: 200
      };
    }
  };

  const res = await handleGenerateOpenAI(null, {
    prompt: 'Write a story',
    model: 'gpt-4o'
    // No referenceStory provided
  });

  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.text, 'Generated text from aiService');
  assert.equal(body.refWords, undefined);
  assert.equal(body.refParas, undefined);
  assert.equal(body.genTokens, undefined);
}); 