import fs from 'fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const sql = fs.readFileSync('supabase_setup.sql', 'utf8');

test('SQL setup includes human_model_evaluations table', () => {
  assert(sql.includes('human_model_evaluations'), 'human_model_evaluations table missing');
});

test('dataset_downloads table exists with policies', () => {
  assert.match(sql, /CREATE TABLE IF NOT EXISTS dataset_downloads/i);
  assert.match(sql, /ALTER TABLE dataset_downloads ENABLE ROW LEVEL SECURITY/i);
  assert.match(sql, /CREATE POLICY "Dataset downloads are viewable by everyone"/i);
  assert.match(sql, /CREATE POLICY "Users can insert their own dataset downloads"/i);
});

test('model_comparisons table exists', () => {
  assert.match(sql, /CREATE TABLE IF NOT EXISTS model_comparisons/i);
});
