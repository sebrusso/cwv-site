import assert from 'node:assert/strict';
import { test } from 'node:test';
import { wordCount, countWords, countParagraphs } from '../src/lib/text-utils.js';

test('wordCount/countWords counts words correctly', () => {
  assert.equal(wordCount('Hello world'), 2);
  assert.equal(countWords('Hello world'), 2); // Test the alias
  assert.equal(wordCount('The quick brown fox jumps'), 5);
  assert.equal(wordCount(''), 0);
  assert.equal(wordCount('   '), 0);
  assert.equal(wordCount('Single'), 1);
});

test('wordCount handles multiple spaces', () => {
  assert.equal(wordCount('Hello    world'), 2);
  assert.equal(wordCount('  Hello   world  '), 2);
});

test('wordCount handles newlines', () => {
  assert.equal(wordCount('Hello\nworld'), 2);
  assert.equal(wordCount('Hello\n\nworld'), 2);
});

test('wordCount handles punctuation', () => {
  assert.equal(wordCount('Hello, world!'), 2);
  assert.equal(wordCount("Don't count contractions as two words"), 6);
});

test('countParagraphs counts paragraphs correctly', () => {
  assert.equal(countParagraphs('Single paragraph'), 1);
  assert.equal(countParagraphs('First paragraph\n\nSecond paragraph'), 2);
  assert.equal(countParagraphs('First\n\nSecond\n\nThird'), 3);
});

test('countParagraphs handles empty strings', () => {
  assert.equal(countParagraphs(''), 0);
  assert.equal(countParagraphs('   '), 0);
});

test('countParagraphs handles single newlines', () => {
  assert.equal(countParagraphs('First line\nSecond line'), 2);
});

test('countParagraphs handles multiple newlines', () => {
  assert.equal(countParagraphs('First\n\n\nSecond'), 2);
  assert.equal(countParagraphs('First\n  \n  \nSecond'), 2);
});

test('countParagraphs ensures at least 1 paragraph for non-empty text', () => {
  assert.equal(countParagraphs('Single line'), 1);
  assert.equal(countParagraphs('Word'), 1);
}); 