import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeHistoricalGame, validateHistoricalGame } from '../src/providers/historical.js';
import { buildTwoWayMarket, forecastNBA } from '../src/pipeline/forecast.js';
import { fitLogistic, predictLogistic, nbaFeatureVector } from '../src/models/nba/logistic.js';

test('historical normalization validates a real-looking NBA game', () => {
  const game = normalizeHistoricalGame({ id: 'g1', scheduled: '2026-01-01T00:00:00Z', home_team: 'H', away_team: 'A', home_points: 110, away_points: 105, source: 'test' });
  assert.equal(validateHistoricalGame(game), true);
  assert.equal(game.eventId, 'g1');
});

test('two-way market removes vig', () => {
  const market = buildTwoWayMarket(1.90, 1.90);
  assert.ok(Math.abs(market.home + market.away - 1) < 1e-12);
});

test('forecast evaluates both sides and returns a bounded probability', () => {
  const result = forecastNBA({ homeRating: 1600, awayRating: 1500, homeOdds: 1.90, awayOdds: 1.90 });
  assert.ok(['HOME', 'AWAY'].includes(result.side));
  assert.ok(result.modelProbability > 0 && result.modelProbability < 1);
  assert.ok(Number.isFinite(result.ev));
});

test('regularized logistic model trains and predicts', () => {
  const rows = [];
  for (let i = 0; i < 60; i++) {
    const x = (i - 30) / 10;
    rows.push({ features: [x, x / 2, 0, 0, 0], outcome: x > 0 ? 1 : 0 });
  }
  const model = fitLogistic(rows, { iterations: 400 });
  const prediction = predictLogistic(model, nbaFeatureVector({ homeRating: 1600, awayRating: 1500, homeForm: .6, awayForm: .4, homePointDiff: 5, awayPointDiff: 0, homePace: 100, awayPace: 100, restDifference: 0 }));
  assert.ok(prediction > 0 && prediction < 1);
});
