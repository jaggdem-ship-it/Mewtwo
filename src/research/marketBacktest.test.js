import test from 'node:test';
import assert from 'node:assert/strict';
import { fairTwoWayMarket, evaluateMarketPath, summarizeMarketBacktest } from './marketBacktest.js';

test('fairTwoWayMarket removes vig', () => {
  const market = fairTwoWayMarket(2, 2);
  assert.equal(market.home, 0.5);
  assert.equal(market.away, 0.5);
});

test('market path uses a later closing snapshot', () => {
  const result = evaluateMarketPath(
    { eventId: 'g1', snapshotAt: '2026-01-01T18:00:00Z', side: 'HOME', marketProbability: 0.50 },
    [
      { eventId: 'g1', snapshotAt: '2026-01-01T17:00:00Z', homeOdds: 2, awayOdds: 2 },
      { eventId: 'g1', snapshotAt: '2026-01-01T19:00:00Z', homeOdds: 1.8, awayOdds: 2.2 }
    ]
  );
  assert.equal(result.status, 'EVALUATED');
  assert.ok(result.clv < 0);
});

test('summary reports positive CLV rate', () => {
  const result = summarizeMarketBacktest([{ status: 'EVALUATED', clv: 0.03 }, { status: 'EVALUATED', clv: -0.01 }]);
  assert.equal(result.sampleSize, 2);
  assert.equal(result.positiveClvRate, 0.5);
});
