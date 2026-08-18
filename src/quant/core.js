function validProbability(p) { return Number.isFinite(p) && p >= 0 && p <= 1; }

export function impliedProbability(decimalOdds) {
  if (!Number.isFinite(decimalOdds) || decimalOdds <= 1) throw new Error('Decimal odds must be > 1');
  return 1 / decimalOdds;
}

export function removeVig(probabilities) {
  if (!Array.isArray(probabilities) || probabilities.length < 2 || probabilities.some(p => !validProbability(p))) throw new Error('Invalid probabilities');
  const total = probabilities.reduce((sum, p) => sum + p, 0);
  if (!Number.isFinite(total) || total <= 0) throw new Error('Invalid probabilities');
  return probabilities.map(p => p / total);
}

export function expectedValue(probability, decimalOdds) {
  if (!validProbability(probability)) throw new Error('Probability must be between 0 and 1');
  if (!Number.isFinite(decimalOdds) || decimalOdds <= 1) throw new Error('Decimal odds must be > 1');
  return probability * (decimalOdds - 1) - (1 - probability);
}

export function edge(modelProbability, marketProbability) {
  if (!validProbability(modelProbability) || !validProbability(marketProbability)) throw new Error('Probabilities must be between 0 and 1');
  return modelProbability - marketProbability;
}

export function kellyFraction(probability, decimalOdds) {
  if (!validProbability(probability) || !Number.isFinite(decimalOdds) || decimalOdds <= 1) throw new Error('Invalid Kelly inputs');
  const b = decimalOdds - 1;
  return Math.max(0, (probability * decimalOdds - 1) / b);
}

export function cappedFractionalKelly(probability, decimalOdds, fraction = 0.25, cap = 0.02) {
  if (fraction <= 0 || cap < 0) throw new Error('Invalid risk parameters');
  return Math.min(cap, kellyFraction(probability, decimalOdds) * fraction);
}

export function decision({ modelProbability, marketProbability, decimalOdds, uncertainty = 0, dataCompleteness = 1, modelDisagreement = 0, minEdge = 0.03, minEV = 0.02, maxUncertainty = 0.08, minDataCompleteness = 0.9, maxDisagreement = 0.12 }) {
  if (!validProbability(modelProbability) || !validProbability(marketProbability)) throw new Error('Invalid decision probabilities');
  if (!Number.isFinite(uncertainty) || uncertainty < 0) throw new Error('Invalid uncertainty');
  const e = edge(modelProbability, marketProbability);
  const ev = expectedValue(modelProbability, decimalOdds);
  const reasons = [];
  if (e < minEdge) reasons.push('EDGE_BELOW_THRESHOLD');
  if (ev < minEV) reasons.push('EV_BELOW_THRESHOLD');
  if (uncertainty > maxUncertainty) reasons.push('UNCERTAINTY_TOO_HIGH');
  if (dataCompleteness < minDataCompleteness) reasons.push('DATA_INCOMPLETE');
  if (modelDisagreement > maxDisagreement) reasons.push('MODEL_DISAGREEMENT_TOO_HIGH');
  return { action: reasons.length ? 'NO_BET' : 'BET', edge: e, ev, reasons, stakeFraction: reasons.length ? 0 : cappedFractionalKelly(modelProbability, decimalOdds) };
}
