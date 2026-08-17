import { baselineNBAProbability } from '../ensemble.js';
import { fitPlattScaler, applyCalibration } from './calibration.js';
import { brierScore, logLoss, calibrationBuckets } from '../../backtest/metrics.js';
import { buildTrainingRows } from './training.js';

export function fitAndEvaluateNBA(games, { minimumRows = 30, calibrationWindow = 100 } = {}) {
  const rows = buildTrainingRows(games);
  if (rows.length <= minimumRows) return { status: 'INSUFFICIENT_SAMPLE', sampleSize: 0, raw: null, calibrated: null };

  const rawPredictions = [];
  const outcomes = [];
  for (let i = minimumRows; i < rows.length; i++) {
    rawPredictions.push(baselineNBAProbability(rows[i]));
    outcomes.push(rows[i].outcome);
  }

  const split = Math.max(1, rawPredictions.length - Math.min(calibrationWindow, Math.floor(rawPredictions.length / 2)));
  const calibration = fitPlattScaler(rawPredictions.slice(0, split), outcomes.slice(0, split));
  const calibratedPredictions = rawPredictions.slice(split).map(p => applyCalibration(p, calibration));
  const calibratedOutcomes = outcomes.slice(split);

  return {
    status: calibratedPredictions.length >= 20 ? 'EVALUATED' : 'INSUFFICIENT_SAMPLE',
    sampleSize: calibratedPredictions.length,
    calibration,
    raw: {
      sampleSize: rawPredictions.length,
      brier: brierScore(rawPredictions, outcomes),
      logLoss: logLoss(rawPredictions, outcomes)
    },
    calibrated: {
      sampleSize: calibratedPredictions.length,
      brier: calibratedPredictions.length ? brierScore(calibratedPredictions, calibratedOutcomes) : null,
      logLoss: calibratedPredictions.length ? logLoss(calibratedPredictions, calibratedOutcomes) : null,
      buckets: calibratedPredictions.length ? calibrationBuckets(calibratedPredictions, calibratedOutcomes) : []
    }
  };
}
