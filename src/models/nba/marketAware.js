import { baselineNBAProbability } from '../ensemble.js';
import { expectedValue, edge, cappedFractionalKelly } from '../../quant/core.js';

export function scoreMarketAwareNBA({ features, homeOdds, awayOdds, uncertainty = 0.04, dataCompleteness = 1, modelDisagreement = 0.04 }) {
  if (!features) return { action: 'NO_BET', reasons: ['INSUFFICIENT_HISTORY'], stakeFraction: 0 };
  const modelProbability = baselineNBAProbability({
    homeRating: 1500 + features.home.netEfficiency * 10,
    awayRating: 1500 + features.away.netEfficiency * 10,
    recentHomeForm: features.home.winRate,
    recentAwayForm: features.away.winRate
  });
  const marketProbability = 1 / homeOdds;
  const e = edge(modelProbability, marketProbability);
  const ev = expectedValue(modelProbability, homeOdds);
  const reasons = [];
  if (e < 0.03) reasons.push('EDGE_BELOW_THRESHOLD');
  if (ev < 0.02) reasons.push('EV_BELOW_THRESHOLD');
  if (uncertainty > 0.08) reasons.push('UNCERTAINTY_TOO_HIGH');
  if (dataCompleteness < 0.9) reasons.push('DATA_INCOMPLETE');
  if (modelDisagreement > 0.12) reasons.push('MODEL_DISAGREEMENT_TOO_HIGH');
  return {
    side: 'HOME',
    modelProbability,
    marketProbability,
    edge: e,
    ev,
    action: reasons.length ? 'NO_BET' : 'BET',
    reasons,
    stakeFraction: reasons.length ? 0 : cappedFractionalKelly(modelProbability, homeOdds)
  };
}
