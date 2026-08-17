import { baselineNBAProbability } from '../ensemble.js';
import { matchupAvailability } from './playerImpact.js';

function clamp(p) { return Math.min(0.999, Math.max(0.001, p)); }

export function buildPregameNBAProbability({ homeRating, awayRating, homeForm = 0, awayForm = 0, homePlayers = [], awayPlayers = [], homeAdvantage = 65 } = {}) {
  const availability = matchupAvailability({ homePlayers, awayPlayers });
  const base = baselineNBAProbability({ homeRating, awayRating, recentHomeForm: homeForm, recentAwayForm: awayForm, homeAdvantage });
  const logit = Math.log(base / (1 - base));
  const adjusted = 1 / (1 + Math.exp(-(logit + availability.netAdjustment)));
  return {
    probability: clamp(adjusted),
    baseProbability: base,
    availability,
    adjustmentApplied: availability.netAdjustment
  };
}
