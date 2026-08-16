export function validatePointInTimeFeature(feature, snapshotAt) {
  const available = new Date(feature.availableAt).getTime();
  const snapshot = new Date(snapshotAt).getTime();
  if (!Number.isFinite(available) || !Number.isFinite(snapshot)) throw new Error('Invalid point-in-time timestamp');
  if (available > snapshot) throw new Error(`Future feature rejected: ${feature.name || 'unknown'}`);
  return true;
}

export function buildSnapshotRows(features, snapshotAt) {
  return features.map(feature => {
    validatePointInTimeFeature(feature, snapshotAt);
    return {
      featureName: feature.name,
      featureValue: feature.value,
      source: feature.source,
      availableAt: new Date(feature.availableAt).toISOString(),
      snapshotAt: new Date(snapshotAt).toISOString(),
      quality: feature.quality ?? 1
    };
  });
}
