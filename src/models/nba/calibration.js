function clampProbability(p) {
  return Math.min(0.999999, Math.max(0.000001, p));
}

export function fitPlattScaler(predictions, outcomes, { learningRate = 0.05, iterations = 2000 } = {}) {
  if (predictions.length !== outcomes.length || predictions.length < 20) throw new Error('At least 20 matching predictions/outcomes are required');
  let a = 1;
  let b = 0;
  for (let iteration = 0; iteration < iterations; iteration++) {
    let gradA = 0;
    let gradB = 0;
    for (let i = 0; i < predictions.length; i++) {
      const p = clampProbability(predictions[i]);
      const logit = Math.log(p / (1 - p));
      const q = 1 / (1 + Math.exp(-(a * logit + b)));
      const error = q - outcomes[i];
      gradA += error * logit;
      gradB += error;
    }
    a -= learningRate * gradA / predictions.length;
    b -= learningRate * gradB / predictions.length;
  }
  return Object.freeze({ method: 'platt-logit', a, b });
}

export function applyCalibration(probability, calibration) {
  if (!calibration) return clampProbability(probability);
  const p = clampProbability(probability);
  const logit = Math.log(p / (1 - p));
  return 1 / (1 + Math.exp(-(calibration.a * logit + calibration.b)));
}
