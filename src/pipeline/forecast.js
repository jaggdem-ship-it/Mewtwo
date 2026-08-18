import { ensembleNBAProbability } from '../models/ensemble.js';
import { decision, impliedProbability, removeVig } from '../quant/core.js';

export function buildTwoWayMarket(homeOdds, awayOdds) {
  const raw = [impliedProbability(homeOdds), impliedProbability(awayOdds)];
  const fair = removeVig(raw);
  return { home: fair[0], away: fair[1], rawHome: raw[0], rawAway: raw[1] };
}

export function forecastNBA({ row = null, homeRating = 1500, awayRating = 1500, homeOdds, awayOdds, homeForm = 0, awayForm = 0, uncertainty = 0.03, dataCompleteness = 1, logisticModel = null } = {}) {
  if (![homeOdds, awayOdds].every(Number.isFinite) || homeOdds <= 1 || awayOdds <= 1) return { side: null, status: 'NO_BET', action: 'NO_BET', reasons: ['INVALID_MARKET'], stakeFraction: 0 };
  const modelRow = row ?? { homeRating, awayRating, homeForm, awayForm, homePointDiff: 0, awayPointDiff: 0, homePace: 0, awayPace: 0, restDifference: 0 };
  const model = ensembleNBAProbability({ row: modelRow, logisticModel });
  const market = buildTwoWayMarket(homeOdds, awayOdds);
  const home = decision({ modelProbability: model.probability, marketProbability: market.home, decimalOdds: homeOdds, uncertainty, dataCompleteness, modelDisagreement: model.disagreement });
  const away = decision({ modelProbability: 1 - model.probability, marketProbability: market.away, decimalOdds: awayOdds, uncertainty, dataCompleteness, modelDisagreement: model.disagreement });
  const candidates = [
    { side: 'HOME', probability: model.probability, marketProbability: market.home, odds: homeOdds, result: home },
    { side: 'AWAY', probability: 1 - model.probability, marketProbability: market.away, odds: awayOdds, result: away }
  ].sort((a, b) => b.result.ev - a.result.ev);
  const best = candidates[0];
  return { side: best.side, modelProbability: best.probability, marketProbability: best.marketProbability, edge: best.result.edge, ev: best.result.ev, action: best.result.action, status: best.result.action === 'BET' ? 'QUALIFIED' : 'NO_BET', reasons: best.result.reasons, stakeFraction: best.result.stakeFraction, market, disagreement: model.disagreement, components: model.components, selectedOdds: best.odds };
}
