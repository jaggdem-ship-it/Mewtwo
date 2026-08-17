import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTrainingRows } from '../src/models/nba/training.js';

const games = [
  { eventId: 'g1', date: '2025-01-01T00:00:00Z', homeTeam: 'A', awayTeam: 'B', homePoints: 110, awayPoints: 100 },
  { eventId: 'g2', date: '2025-01-03T00:00:00Z', homeTeam: 'B', awayTeam: 'A', homePoints: 105, awayPoints: 115 },
  { eventId: 'g3', date: '2025-01-06T00:00:00Z', homeTeam: 'A', awayTeam: 'B', homePoints: 95, awayPoints: 100 }
];

test('training rows are chronological and never use the current game result in its features', () => {
  const rows = buildTrainingRows(games, { window: 10 });
  assert.equal(rows.length, 3);
  assert.equal(rows[0].homeRating, 1500);
  assert.equal(rows[0].awayRating, 1500);
  assert.equal(rows[0].homeGamesBefore, 0);
  assert.equal(rows[0].awayGamesBefore, 0);
  assert.notEqual(rows[1].homeRating, 1500);
  assert.equal(rows[1].homeGamesBefore, 1);
  assert.equal(rows[1].awayGamesBefore, 1);
  assert.equal(rows[2].homeGamesBefore, 2);
  assert.equal(rows[2].awayGamesBefore, 2);
});

test('rolling state is point-in-time', () => {
  const rows = buildTrainingRows(games, { window: 1 });
  assert.equal(rows[1].homeForm, 0);
  assert.equal(rows[1].awayForm, 1);
  assert.equal(rows[2].homeForm, 1);
  assert.equal(rows[2].awayForm, 0);
});

test('rest difference is computed from prior games only', () => {
  const rows = buildTrainingRows(games);
  assert.equal(rows[0].homeRestDays, null);
  assert.equal(rows[0].awayRestDays, null);
  assert.equal(rows[1].homeRestDays, 2);
  assert.equal(rows[1].awayRestDays, 2);
  assert.equal(rows[2].homeRestDays, 3);
  assert.equal(rows[2].awayRestDays, 3);
});
