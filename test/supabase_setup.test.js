import fs from 'fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const sql = fs.readFileSync('supabase_setup.sql', 'utf8');

test('SQL setup includes human_model_evaluations table', () => {
  assert.ok(sql.includes('human_model_evaluations'), 'human_model_evaluations table missing');
});

test('dataset_downloads table exists with policies', () => {
  assert.match(sql, /CREATE TABLE IF NOT EXISTS dataset_downloads/i);
  assert.match(sql, /ALTER TABLE dataset_downloads ENABLE ROW LEVEL SECURITY/i);
  assert.match(sql, /CREATE POLICY "Dataset downloads are viewable by everyone"/i);
  assert.match(sql, /CREATE POLICY "Users can insert their own dataset downloads"/i);
});

test('model_evaluations table has expected columns', () => {
  assert.match(sql, /CREATE TABLE IF NOT EXISTS model_evaluations/i);
  assert.match(sql, /model_name TEXT NOT NULL/i);
  assert.match(sql, /selected_response TEXT NOT NULL/i);
  assert.match(sql, /ground_truth TEXT NOT NULL/i);
  assert.match(sql, /is_correct BOOLEAN NOT NULL/i);
});

test('model_writing_rationales table supports evaluation_id', () => {
  assert.match(sql, /CREATE TABLE IF NOT EXISTS model_writing_rationales/i);
  assert.match(sql, /evaluation_id UUID REFERENCES model_evaluations/i);
});

