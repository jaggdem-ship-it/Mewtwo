import { refreshLiveNBA } from './refresh.js';
import { scoreLiveNBAEvents } from './opportunities.js';

export async function runLiveNBA({ apiKey, baseUrl, ratings = {}, persistSnapshot }) {
  const snapshot = await refreshLiveNBA({ apiKey, baseUrl });
  const forecasts = scoreLiveNBAEvents(snapshot.markets, ratings);
  const result = { ...snapshot, forecasts };
  if (persistSnapshot) await persistSnapshot(result);
  return result;
}
