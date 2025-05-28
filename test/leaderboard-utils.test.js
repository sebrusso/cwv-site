import assert from 'node:assert/strict';
import { test } from 'node:test';
import { sortBySuccessRate, sortByWinRate } from '../src/lib/leaderboard.ts';

test('sortBySuccessRate sorts descending', () => {
  const data = [
    { model: 'A', total: 2, successRate: 0.5 },
    { model: 'B', total: 3, successRate: 0.8 },
  ];
  const sorted = sortBySuccessRate(data);
  assert.deepEqual(sorted.map((e) => e.model), ['B', 'A']);
});

test('sortByWinRate sorts by win percentage', () => {
  const data = [
    { model: 'A', wins: 1, losses: 1 },
    { model: 'B', wins: 2, losses: 0 },
  ];
  const sorted = sortByWinRate(data);
  assert.deepEqual(sorted.map((e) => e.model), ['B', 'A']);
});
