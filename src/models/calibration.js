export function fitPlattScaling(probabilities, outcomes, { learningRate = 0.05, iterations = 2000 } = {}) {
  if (probabilities.length !== outcomes.length || probabilities.length < 2) throw new Error('Calibration data is insufficient');
  let a = 1;
  let b = 0;
  const eps = 1e-6;
  for (let i = 0; i < iterations; i++) {
    let gradA = 0, gradB = 0;
    probabilities.forEach((p, j) => {
      const x = Math.log(Math.min(1 - eps, Math.max(eps, p)) / Math.min(1 - eps, Math.max(eps, 1 - p)));
      const z = Math.max(-30, Math.min(30, a * x + b));
      const q = 1 / (1 + Math.exp(-z));
      gradA += (q - outcomes[j]) * x;
      gradB += q - outcomes[j];
    });
    a -= learningRate * gradA / probabilities.length;
    b -= learningRate * gradB / probabilities.length;
  }
  return { a, b };
}

export function calibrateProbability(probability, parameters) {
  const eps = 1e-6;
  const p = Math.min(1 - eps, Math.max(eps, probability));
  const x = Math.log(p / (1 - p));
  const z = Math.max(-30, Math.min(30, parameters.a * x + parameters.b));
  return 1 / (1 + Math.exp(-z));
}
