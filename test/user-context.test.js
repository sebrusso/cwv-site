import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'fs';

const file = fs.readFileSync('src/contexts/UserContext.tsx', 'utf8');

test('UserContext includes password auth methods', () => {
  assert.match(file, /signInWithPassword/, 'missing signInWithPassword');
  assert.match(file, /signUp\s*:/, 'missing signUp');
});
