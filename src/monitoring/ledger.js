export function createForecastLedgerEntry({ eventId, snapshotAt, modelVersion, modelProbability, marketProbability, decimalOdds, edge, ev, action, reasons = [], featuresHash = null, oddsSource = null }) {
  if (!eventId || !snapshotAt || !modelVersion) throw new Error('Ledger identity fields are required');
  return Object.freeze({
    eventId, snapshotAt, modelVersion, featuresHash, oddsSource,
    modelProbability, marketProbability, decimalOdds, edge, ev,
    action, reasons: [...reasons], createdAt: new Date().toISOString()
  });
}

export function appendOutcome(ledgerEntry, { outcome, closingProbability = null, closingOdds = null, settledAt }) {
  if (![0, 1].includes(outcome)) throw new Error('Outcome must be 0 or 1');
  return Object.freeze({ ...ledgerEntry, outcome, closingProbability, closingOdds, settledAt });
}
