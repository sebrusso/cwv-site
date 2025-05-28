import fs from 'fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const sql = fs.readFileSync('supabase_setup.sql', 'utf8');

test('SQL setup includes human_model_evaluations table', () => {
  assert.match(sql, /human_model_evaluations/i);
});

test('dataset_downloads table exists with policies', () => {
  assert.match(sql, /CREATE TABLE IF NOT EXISTS dataset_downloads/i);
  assert.match(sql, /ALTER TABLE dataset_downloads ENABLE ROW LEVEL SECURITY/i);
  assert.match(sql, /CREATE POLICY "Dataset downloads are viewable by everyone"/i);
  assert.match(sql, /CREATE POLICY "Users can insert their own dataset downloads"/i);
});

test('profiles table contains demographic fields', () => {
  const fields = [
    'age_range',
    'education_level',
    'first_language',
    'literature_interest',
    'reading_habits',
    'writing_background',
    'demographics_completed',
  ];
  for (const field of fields) {
    assert.match(sql, new RegExp(field, 'i'), `${field} missing`);
  }
});
