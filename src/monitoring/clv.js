export function closingLineValue(openingProbability, closingProbability) {
  if (![openingProbability, closingProbability].every(Number.isFinite)) throw new Error('Probabilities must be finite');
  return openingProbability - closingProbability;
}

export function evaluateForecast(entry) {
  if (entry.outcome === undefined) return { settled: false };
  return {
    settled: true,
    won: entry.outcome === 1,
    brierContribution: (entry.modelProbability - entry.outcome) ** 2,
    logLossContribution: -(entry.outcome * Math.log(Math.min(.999999999999999, Math.max(1e-15, entry.modelProbability))) + (1 - entry.outcome) * Math.log(Math.min(.999999999999999, Math.max(1e-15, 1 - entry.modelProbability)))),
    clv: entry.closingProbability == null ? null : closingLineValue(entry.marketProbability, entry.closingProbability)
  };
}
