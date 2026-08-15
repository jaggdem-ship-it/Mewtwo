import { baselineNBAProbability } from '../models/ensemble.js';
import { decision, impliedProbability, removeVig } from '../quant/core.js';

export function buildTwoWayMarket(homeOdds, awayOdds) {
  const raw = [impliedProbability(homeOdds), impliedProbability(awayOdds)];
  const fair = removeVig(raw);
  return { home: fair[0], away: fair[1] };
}

export function forecastNBA({ homeRating, awayRating, homeOdds, awayOdds, homeForm = 0, awayForm = 0, uncertainty = 0.03, dataCompleteness = 1, modelDisagreement = 0.04 }) {
  const modelProbability = baselineNBAProbability({ homeRating, awayRating, recentHomeForm: homeForm, recentAwayForm: awayForm });
  const market = buildTwoWayMarket(homeOdds, awayOdds);
  const result = decision({ modelProbability, marketProbability: market.home, decimalOdds: homeOdds, uncertainty, dataCompleteness, modelDisagreement });
  return { side: 'HOME', modelProbability, marketProbability: market.home, market, ...result };
}
