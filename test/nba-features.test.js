import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTrainingRows } from '../src/models/nba/training.js';
import { buildRollingEfficiency, opponentAdjustedNetRating } from '../src/models/nba/efficiency.js';
import { buildRestFeatures } from '../src/models/nba/rest.js';

const games = [
  { eventId: 'g1', date: '2025-01-01T00:00:00Z', homeTeam: 'A', awayTeam: 'B', homePoints: 110, awayPoints: 100, home: { points: 110, possessions: 100, offensiveRating: 110, defensiveRating: 100 }, away: { points: 100, possessions: 100, offensiveRating: 100, defensiveRating: 110 } },
  { eventId: 'g2', date: '2025-01-03T00:00:00Z', homeTeam: 'B', awayTeam: 'A', homePoints: 105, awayPoints: 108, home: { points: 105, possessions: 98, offensiveRating: 107.14, defensiveRating: 110.2 }, away: { points: 108, possessions: 98, offensiveRating: 110.2, defensiveRating: 107.14 } },
  { eventId: 'g3', date: '2025-01-05T00:00:00Z', homeTeam: 'A', awayTeam: 'B', homePoints: 115, awayPoints: 104, home: { points: 115, possessions: 102, offensiveRating: 112.75, defensiveRating: 101.96 }, away: { points: 104, possessions: 102, offensiveRating: 101.96, defensiveRating: 112.75 } }
];

test('training rows use only games before the prediction game', () => {
  const rows = buildTrainingRows(games, { window: 10 });
  assert.equal(rows[0].homeGamesBefore, 0);
  assert.equal(rows[0].awayGamesBefore, 0);
  assert.equal(rows[1].homeGamesBefore, 1);
  assert.equal(rows[1].awayGamesBefore, 1);
  assert.equal(rows[2].homeGamesBefore, 1);
  assert.equal(rows[2].awayGamesBefore, 1);
});

test('rest is measured from the previous game', () => {
  const rest = buildRestFeatures(games, 'A', '2025-01-05T00:00:00Z');
  assert.equal(rest.daysRest, 2);
  assert.equal(rest.backToBack, false);
});

test('rolling efficiency excludes the current game', () => {
  const beforeG3 = buildRollingEfficiency(games, 'A', '2025-01-05T00:00:00Z', { window: 10 });
  assert.equal(beforeG3.games, 2);
  assert.ok(beforeG3.offensiveRating < 112.75);
});

test('opponent-adjusted efficiency exposes matchup gaps', () => {
  const home = { offensiveRating: 115, defensiveRating: 105, netRating: 10, pace: 100 };
  const away = { offensiveRating: 108, defensiveRating: 112, netRating: -4, pace: 98 };
  const matchup = opponentAdjustedNetRating(home, away);
  assert.equal(matchup.homeAttackVsAwayDefense, 3);
  assert.equal(matchup.awayAttackVsHomeDefense, 3);
  assert.equal(matchup.netRatingGap, 14);
  assert.equal(matchup.expectedPace, 99);
});
