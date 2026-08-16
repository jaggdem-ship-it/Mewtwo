import { getJson } from '../providers/http.js';

export function createSupabaseStore({ url, serviceKey }) {
  if (!url || !serviceKey) throw new Error('Supabase URL and service key are required');
  const base = url.replace(/\/$/, '');
  const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };

  async function insert(table, rows) {
    const response = await fetch(`${base}/rest/v1/${table}`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(rows)
    });
    if (!response.ok) throw new Error(`Supabase insert ${response.status}: ${await response.text()}`);
  }

  return {
    insertEvents: rows => insert('events', rows),
    insertOddsSnapshots: rows => insert('odds_snapshots', rows),
    insertFeatureSnapshots: rows => insert('feature_snapshots', rows),
    insertForecasts: rows => insert('forecast_ledger', rows)
  };
}
