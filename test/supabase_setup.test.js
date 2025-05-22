import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'fs';

const sql = fs.readFileSync('supabase_setup.sql', 'utf8');

test('dataset_downloads table exists with policies', () => {
  assert.match(sql, /CREATE TABLE IF NOT EXISTS dataset_downloads/i);
  assert.match(sql, /ALTER TABLE dataset_downloads ENABLE ROW LEVEL SECURITY/i);
  assert.match(sql, /CREATE POLICY "Users can insert their own dataset download"/i);
  assert.match(sql, /CREATE POLICY "Users can view their own dataset downloads"/i);
});
