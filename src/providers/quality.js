export function assessSourceQuality({ source, sourceTimestamp, observedAt, requiredAt, fields = [], requiredFields = [] } = {}) {
  const reasons = [];
  const sourceTime = new Date(sourceTimestamp).getTime();
  const observedTime = new Date(observedAt).getTime();
  const requiredTime = new Date(requiredAt).getTime();
  if (!source || !Number.isFinite(sourceTime)) reasons.push('SOURCE_TIMESTAMP_MISSING');
  if (Number.isFinite(requiredTime) && Number.isFinite(sourceTime) && sourceTime > requiredTime) reasons.push('FUTURE_DATA');
  if (Number.isFinite(observedTime) && Number.isFinite(sourceTime) && observedTime < sourceTime) reasons.push('OBSERVATION_BEFORE_SOURCE');
  const missing = requiredFields.filter(field => !fields.includes(field));
  if (missing.length) reasons.push(`MISSING_FIELDS:${missing.join(',')}`);
  return {
    usable: reasons.length === 0,
    completeness: requiredFields.length ? 1 - missing.length / requiredFields.length : 1,
    reasons
  };
}
