import { homeAdjustedProbability } from './elo.js';
import { predictLogistic, nbaFeatureVector } from './nba/logistic.js';

function clamp(p) { return Math.min(0.999, Math.max(0.001, p)); }

export function weightedEnsemble(models, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  if (models.length !== weights.length || total <= 0) throw new Error('Invalid ensemble configuration');
  const probability = models.reduce((sum, p, i) => sum + clamp(p) * weights[i], 0) / total;
  const mean = probability;
  const variance = models.reduce((sum, p, i) => sum + weights[i] * (p - mean) ** 2, 0) / total;
  return { probability: clamp(probability), disagreement: Math.sqrt(variance) };
}

export function baselineNBAProbability({ homeRating, awayRating, homeAdvantage = 65, recentHomeForm = 0, recentAwayForm = 0 }) {
  const formAdjustment = (recentHomeForm - recentAwayForm) * 12;
  return clamp(homeAdjustedProbability(homeRating + formAdjustment, awayRating, homeAdvantage));
}

export function ensembleNBAProbability({ row, logisticModel = null, weights = [0.65, 0.35] } = {}) {
  if (!row) throw new Error('NBA training/pregame row is required');
  const elo = baselineNBAProbability(row);
  const models = [elo];
  if (logisticModel) models.push(predictLogistic(logisticModel, nbaFeatureVector(row)));
  const effectiveWeights = logisticModel ? weights : [1];
  return { ...weightedEnsemble(models, effectiveWeights), components: models };
}
