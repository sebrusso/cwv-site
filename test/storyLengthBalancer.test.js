import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildBalancedChatRequest } from '../src/lib/ai/storyLengthBalancer.js';

test('buildBalancedChatRequest creates proper request structure', () => {
  const prompt = 'Write a story about a dragon';
  const referenceStory = 'Once upon a time, there was a brave knight.\n\nHe fought many battles and saved the kingdom.\n\nThe end.';
  
  const request = buildBalancedChatRequest(prompt, referenceStory, 'gpt-4o');
  
  // Check basic structure
  assert.equal(request.model, 'gpt-4o');
  assert.equal(request.messages.length, 2);
  assert.equal(request.messages[0].role, 'system');
  assert.equal(request.messages[1].role, 'user');
  assert.equal(request.messages[1].content, prompt);
  
  // Check parameters
  assert.equal(request.temperature, 0.7);
  assert.equal(request.top_p, 0.9);
  assert.equal(request.frequency_penalty, 0.15);
  assert.equal(request.presence_penalty, 0);
  assert.deepEqual(request.stop, ['<|endofstory|>']);
});

test('buildBalancedChatRequest calculates correct stats', () => {
  const prompt = 'Write a story';
  const referenceStory = 'Short story with ten words exactly here.\n\nSecond paragraph with eight words total.'; // 13 words, 2 paragraphs
  
  const request = buildBalancedChatRequest(prompt, referenceStory, 'gpt-4o');
  
  // Check that system message contains calculated stats
  const systemMessage = request.messages[0].content;
  assert.ok(systemMessage.includes('*2* paragraphs')); // 2 paragraphs
  assert.ok(systemMessage.includes('≈ 7 words')); // 13/2 = 6.5 -> 7 words per paragraph
  assert.ok(systemMessage.includes('between 12 and 14 words')); // 95% to 105% of 13
  
  // Check max_tokens calculation (13 * 1.35 + 50 = 67.55 -> 68)
  assert.equal(request.max_tokens, 68);
});

test('buildBalancedChatRequest handles single paragraph', () => {
  const prompt = 'Write a story';
  const referenceStory = 'This is a single paragraph with twelve words in it total.'; // 11 words, 1 paragraph
  
  const request = buildBalancedChatRequest(prompt, referenceStory, 'gpt-4o');
  
  const systemMessage = request.messages[0].content;
  assert.ok(systemMessage.includes('*1* paragraphs')); // 1 paragraph
  assert.ok(systemMessage.includes('≈ 11 words')); // 11/1 = 11 words per paragraph
  assert.ok(systemMessage.includes('between 10 and 12 words')); // 95% to 105% of 11
});

test('buildBalancedChatRequest handles empty reference story', () => {
  const prompt = 'Write a story';
  const referenceStory = '';
  
  const request = buildBalancedChatRequest(prompt, referenceStory, 'gpt-4o');
  
  // Should handle gracefully with 0 words and 0 paragraphs
  assert.equal(request.max_tokens, 50); // 0 * 1.35 + 50 = 50
  const systemMessage = request.messages[0].content;
  assert.ok(systemMessage.includes('*0* paragraphs'));
});

test('buildBalancedChatRequest uses default model when not specified', () => {
  const prompt = 'Write a story';
  const referenceStory = 'Test story.';
  
  const request = buildBalancedChatRequest(prompt, referenceStory);
  
  assert.equal(request.model, 'gpt-4o'); // Should use the default
}); 