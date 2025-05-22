import { randomizePair } from '../src/lib/random.js';
import assert from 'node:assert';
import { test } from 'node:test';

test('randomizePair returns both items', () => {
  const { left, right } = randomizePair(1, 2);
  assert.ok(new Set([left, right]).has(1));
  assert.ok(new Set([left, right]).has(2));
});
