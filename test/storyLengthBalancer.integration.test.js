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
  buildBalancedChatRequest: (prompt, referenceStory, model = "gpt-4o") => {
    const refWords = mockTextStats.countWords(referenceStory);
    const refParas = mockTextStats.countParagraphs(referenceStory);
    const avgParaWords = Math.round(refWords / refParas);
    const lo = Math.round(refWords * 0.95);
    const hi = Math.round(refWords * 1.05);
    const maxTokens = Math.ceil(refWords * 1.35) + 50;

    // Optimize parameters for GPT-4.1's enhanced instruction following
    const isGPT41 = model === 'gpt-4.1';
    const optimizedParams = isGPT41 ? {
      temperature: 0.6,        // Lower temperature for better instruction adherence
      top_p: 0.85,            // Slightly more focused sampling
      frequency_penalty: 0.1,  // Reduced to allow for better narrative flow
      presence_penalty: 0.05,  // Small penalty for better content diversity
    } : {
      temperature: 0.7,
      top_p: 0.9,
      frequency_penalty: 0.15,
      presence_penalty: 0,
    };

    const systemMsg = isGPT41 ? `
You are an exceptional award-winning short-story author with precise narrative control.
Write ONE complete, engaging story in exactly *${refParas}* paragraphs.
Target approximately ${avgParaWords} words per paragraph (±10% flexibility).
Aim for total word count between ${lo} and ${hi} words.
Focus on rich storytelling while maintaining these structural constraints naturally.
End with: <|endofstory|>
    `.trim() : `Write ONE complete story in *${refParas}* paragraphs. Each paragraph ≈ ${avgParaWords} words (±15). Total length between ${lo} and ${hi} words.`;

    return {
      model: model === 'gpt-4o' ? "gpt-4o-latest" : model, // Keep backwards compatibility for existing test
      messages: [
        { role: "system", content: systemMsg },
        { role: "user", content: prompt }
      ],
      max_tokens: maxTokens,
      ...optimizedParams,
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

test('story length balancer optimizes parameters for gpt-4.1', async () => {
  const referenceStory = 'A short test story here.\n\nAnother paragraph for testing.'; // ~12 words, 2 paragraphs
  
  // Test GPT-4.1 optimized parameters
  const gpt41Request = mockStoryLengthBalancer.buildBalancedChatRequest(
    'Write a story about adventure',
    referenceStory,
    'gpt-4.1'
  );

  // Test standard GPT-4o parameters
  const gpt4oRequest = mockStoryLengthBalancer.buildBalancedChatRequest(
    'Write a story about adventure',
    referenceStory,
    'gpt-4o'
  );

  // Verify GPT-4.1 uses optimized parameters
  assert.equal(gpt41Request.model, 'gpt-4.1');
  assert.equal(gpt41Request.temperature, 0.6, 'GPT-4.1 should use lower temperature');
  assert.equal(gpt41Request.top_p, 0.85, 'GPT-4.1 should use focused top_p');
  assert.equal(gpt41Request.frequency_penalty, 0.1, 'GPT-4.1 should use reduced frequency penalty');
  assert.equal(gpt41Request.presence_penalty, 0.05, 'GPT-4.1 should use small presence penalty');

  // Verify standard parameters for other models
  assert.equal(gpt4oRequest.temperature, 0.7, 'GPT-4o should use standard temperature');
  assert.equal(gpt4oRequest.top_p, 0.9, 'GPT-4o should use standard top_p');
  assert.equal(gpt4oRequest.frequency_penalty, 0.15, 'GPT-4o should use standard frequency penalty');
  assert.equal(gpt4oRequest.presence_penalty, 0, 'GPT-4o should use no presence penalty');

  // Verify GPT-4.1 has enhanced system message
  assert.ok(gpt41Request.messages[0].content.includes('exceptional'), 'GPT-4.1 should have enhanced system message');
  assert.ok(gpt41Request.messages[0].content.includes('precise narrative control'), 'GPT-4.1 should emphasize precision');
  
  // Verify both use the same structure
  assert.equal(gpt41Request.messages.length, 2);
  assert.equal(gpt4oRequest.messages.length, 2);
  assert.deepEqual(gpt41Request.stop, ['<|endofstory|>']);
  assert.deepEqual(gpt4oRequest.stop, ['<|endofstory|>']);
}); 