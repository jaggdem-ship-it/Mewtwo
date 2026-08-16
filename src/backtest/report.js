import { evaluateNBAWalkForward } from '../models/nba/training.js';

export function buildNBAValidationReport(games) {
  const evaluation = evaluateNBAWalkForward(games);
  return {
    model: 'nba-baseline-elo-form-v1',
    evaluatedAt: new Date().toISOString(),
    sampleSize: evaluation.sampleSize,
    brierScore: evaluation.brier,
    logLoss: evaluation.logLoss,
    calibration: evaluation.calibration,
    status: evaluation.sampleSize >= 100 ? 'EVALUATED' : 'INSUFFICIENT_SAMPLE'
  };
}
