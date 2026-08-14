export function brierScore(predictions, outcomes) {
  if (predictions.length !== outcomes.length || !predictions.length) throw new Error('Invalid evaluation arrays');
  return predictions.reduce((sum, p, i) => sum + (p - outcomes[i]) ** 2, 0) / predictions.length;
}

export function logLoss(predictions, outcomes, epsilon = 1e-15) {
  if (predictions.length !== outcomes.length || !predictions.length) throw new Error('Invalid evaluation arrays');
  return -predictions.reduce((sum, p, i) => {
    const q = Math.min(1 - epsilon, Math.max(epsilon, p));
    return sum + outcomes[i] * Math.log(q) + (1 - outcomes[i]) * Math.log(1 - q);
  }, 0) / predictions.length;
}

export function calibrationBuckets(predictions, outcomes, bucketCount = 10) {
  const buckets = Array.from({ length: bucketCount }, () => ({ count: 0, probabilitySum: 0, outcomeSum: 0 }));
  predictions.forEach((p, i) => {
    const index = Math.min(bucketCount - 1, Math.floor(p * bucketCount));
    buckets[index].count++;
    buckets[index].probabilitySum += p;
    buckets[index].outcomeSum += outcomes[i];
  });
  return buckets.map((b, i) => ({
    bucket: i,
    count: b.count,
    predicted: b.count ? b.probabilitySum / b.count : null,
    observed: b.count ? b.outcomeSum / b.count : null
  }));
}
