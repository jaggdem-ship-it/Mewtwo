function sigmoid(x) { return 1 / (1 + Math.exp(-Math.max(-30, Math.min(30, x)))); }
function dot(weights, features) { return weights.reduce((sum, w, i) => sum + w * (features[i] ?? 0), 0); }

export function fitLogistic(rows, { learningRate = 0.02, iterations = 800, l2 = 0.01 } = {}) {
  if (!rows.length) throw new Error('At least one training row is required');
  const featureCount = rows[0].features.length;
  let weights = Array(featureCount + 1).fill(0);
  for (let iteration = 0; iteration < iterations; iteration++) {
    const gradient = Array(featureCount + 1).fill(0);
    for (const row of rows) {
      const x = [1, ...row.features];
      const prediction = sigmoid(dot(weights, x));
      const error = prediction - row.outcome;
      for (let i = 0; i < weights.length; i++) gradient[i] += error * x[i];
    }
    for (let i = 0; i < weights.length; i++) {
      const penalty = i === 0 ? 0 : l2 * weights[i];
      weights[i] -= learningRate * ((gradient[i] / rows.length) + penalty);
    }
  }
  return Object.freeze({ method: 'regularized-logistic', weights });
}

export function predictLogistic(model, features) {
  if (!model?.weights) throw new Error('Logistic model is required');
  return sigmoid(dot(model.weights, [1, ...features]));
}

export function nbaFeatureVector(row) {
  return [
    (row.homeRating - row.awayRating) / 400,
    row.homeForm - row.awayForm,
    (row.homePointDiff - row.awayPointDiff) / 20,
    (row.homePace - row.awayPace) / 10,
    (row.restDifference ?? 0) / 2
  ];
}
