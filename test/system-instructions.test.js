import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'fs';
import { getSystemInstruction } from '../src/lib/systemInstructions.ts';

const config = JSON.parse(fs.readFileSync('system-instructions.json', 'utf8'));

test('getSystemInstruction returns model specific instruction', () => {
  assert.equal(getSystemInstruction('gpt-4o'), config.models['gpt-4o']);
});

test('getSystemInstruction falls back to default', () => {
  assert.equal(getSystemInstruction('unknown-model'), config.default);
});
