import test from 'node:test';
import assert from 'node:assert/strict';
import { ingestNBASeason, mapWithConcurrency } from './nbaSeasonRunner.js';

const summary = (id, date, home, away, hp, ap) => ({
  sport_event: {
    id,
    start_time: date,
    competitors: [
      { id: home, qualifier: 'home', statistics: { points: hp } },
      { id: away, qualifier: 'away', statistics: { points: ap } }
    ]
  }
});

test('mapWithConcurrency processes every item once', async () => {
  const seen = [];
  const result = await mapWithConcurrency([1, 2, 3, 4, 5], async value => {
    seen.push(value);
    return value * 2;
  }, 2);
  assert.deepEqual(result, [2, 4, 6, 8, 10]);
  assert.deepEqual([...seen].sort((a, b) => a - b), [1, 2, 3, 4, 5]);
});

test('ingestNBASeason validates, sorts, batches and skips seen events', async () => {
  const calls = [];
  const provider = {
    async fetchSchedule() {
      return { games: [
        { id: 'g2' },
        { id: 'g1' },
        { id: 'already-seen' }
      ] };
    },
    async fetchGameSummary(id) {
      calls.push(id);
      if (id === 'g1') return summary(id, '2025-01-01T00:00:00Z', 'home', 'away', 110, 100);
      return summary(id, '2025-01-02T00:00:00Z', 'home', 'away', 100, 105);
    }
  };
  const batches = [];
  const result = await ingestNBASeason({
    provider,
    seasonYear: 2025,
    seenEventIds: new Set(['already-seen']),
    concurrency: 2,
    batchSize: 1,
    onBatch: async batch => batches.push(batch)
  });
  assert.equal(result.scheduled, 3);
  assert.equal(result.fetched, 2);
  assert.equal(result.accepted, 2);
  assert.equal(result.rejected, 0);
  assert.deepEqual(calls.sort(), ['g1', 'g2']);
  assert.equal(batches.length, 2);
  assert.equal(batches[0][0].eventId, 'g1');
  assert.equal(batches[1][0].eventId, 'g2');
});
