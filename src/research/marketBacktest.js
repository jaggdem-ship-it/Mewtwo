import { impliedProbability, removeVig } from '../quant/core.js';
import { closingLineValue } from '../monitoring/clv.js';

function validOdds(value) { return Number.isFinite(value) && value > 1; }

/** Convert one two-way historical snapshot into a fair market probability. */
export function fairTwoWayMarket(homeOdds, awayOdds) {
  if (!validOdds(homeOdds) || !validOdds(awayOdds)) return null;
  const fair = removeVig([impliedProbability(homeOdds), impliedProbability(awayOdds)]);
  return { home: fair[0], away: fair[1] };
}

/**
 * Joins forecasts to the closest known closing market snapshot without using
 * any snapshot after the forecast timestamp for the opening decision.
 */
export function evaluateMarketPath(forecast, snapshots, { maxClosingLagHours = 12 } = {}) {
  if (!forecast?.eventId || !forecast?.snapshotAt) return { status: 'INVALID_FORECAST' };
  const event = snapshots.filter(s => s.eventId === forecast.eventId && new Date(s.snapshotAt) >= new Date(forecast.snapshotAt));
  const closing = event.sort((a, b) => new Date(a.snapshotAt) - new Date(b.snapshotAt))[0];
  if (!closing) return { status: 'NO_CLOSING_MARKET' };
  const lagHours = (new Date(closing.snapshotAt) - new Date(forecast.snapshotAt)) / 3_600_000;
  if (!Number.isFinite(lagHours) || lagHours > maxClosingLagHours) return { status: 'CLOSING_MARKET_TOO_FAR', lagHours };
  const market = fairTwoWayMarket(closing.homeOdds, closing.awayOdds);
  if (!market) return { status: 'CLOSING_MARKET_INCOMPLETE', lagHours };
  const closingProbability = forecast.side === 'AWAY' ? market.away : market.home;
  return {
    status: 'EVALUATED',
    lagHours,
    openingProbability: forecast.marketProbability,
    closingProbability,
    clv: closingLineValue(forecast.marketProbability, closingProbability)
  };
}

export function summarizeMarketBacktest(rows) {
  const evaluated = rows.filter(r => r?.status === 'EVALUATED');
  if (!evaluated.length) return { sampleSize: 0, meanClv: null, positiveClvRate: null };
  const clvs = evaluated.map(r => r.clv).filter(Number.isFinite);
  return {
    sampleSize: evaluated.length,
    meanClv: clvs.length ? clvs.reduce((a, b) => a + b, 0) / clvs.length : null,
    positiveClvRate: clvs.length ? clvs.filter(x => x > 0).length / clvs.length : null
  };
}
