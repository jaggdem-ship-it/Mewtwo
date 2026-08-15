import { OddsApiProvider } from '../providers/oddsApi.js';

export async function refreshLiveNBA({ apiKey, baseUrl, onData }) {
  const provider = new OddsApiProvider({ apiKey, baseUrl });
  const markets = await provider.fetchMarkets({ sportKey: 'basketball_nba' });
  const snapshot = { fetchedAt: new Date().toISOString(), markets };
  if (onData) await onData(snapshot);
  return snapshot;
}
