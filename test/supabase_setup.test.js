import fs from 'fs';
import assert from 'node:assert';
import { test } from 'node:test';

test('SQL setup includes human_model_evaluations table', () => {
  const sql = fs.readFileSync('./supabase_setup.sql', 'utf8');
  assert(sql.includes('human_model_evaluations'), 'human_model_evaluations table missing');
});
