import assert from 'node:assert/strict';
import { test } from 'node:test';
import { wordCount, readingTimeMinutes } from '../src/lib/text-utils.js';

test('wordCount counts words correctly', () => {
  assert.equal(wordCount('one two three'), 3);
  assert.equal(wordCount('  spaced   words  '), 2);
});

test('readingTimeMinutes estimates at least one minute', () => {
  assert.equal(readingTimeMinutes(''), 1);
  const longText = Array(600).fill('word').join(' ');
  assert.equal(readingTimeMinutes(longText, 200), 3);
});
