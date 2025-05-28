import fs from 'fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const sql = fs.readFileSync('supabase_setup.sql', 'utf8');

test('SQL setup defines key tables', () => {
  assert.match(sql, /CREATE TABLE IF NOT EXISTS human_model_evaluations/i);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS dataset_downloads/i);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS evaluation_quality_metrics/i);
});
