import { brierScore, logLoss } from './metrics.js';

export function walkForward(records, predict, minimumTrainingGames = 20) {
  const ordered = [...records].sort((a, b) => new Date(a.date) - new Date(b.date));
  const predictions = [];
  const outcomes = [];
  for (let i = minimumTrainingGames; i < ordered.length; i++) {
    const training = ordered.slice(0, i);
    const test = ordered[i];
    const probability = predict(training, test);
    predictions.push(probability);
    outcomes.push(test.outcome);
  }
  return {
    sampleSize: predictions.length,
    brier: predictions.length ? brierScore(predictions, outcomes) : null,
    logLoss: predictions.length ? logLoss(predictions, outcomes) : null,
    predictions,
    outcomes
  };
}
