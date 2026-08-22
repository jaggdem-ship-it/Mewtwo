export function createSupabaseStore({ url, serviceKey }) {
  if (!url || !serviceKey) throw new Error('Supabase URL and service key are required');
  const base = url.replace(/\/$/, '');
  const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };

  async function request(table, rows, { onConflict = null } = {}) {
    const url = new URL(`${base}/rest/v1/${table}`);
    if (onConflict) url.searchParams.set('on_conflict', onConflict);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
        Prefer: onConflict ? 'resolution=merge-duplicates,return=minimal' : 'return=minimal'
      },
      body: JSON.stringify(rows)
    });
    if (!response.ok) throw new Error(`Supabase ${table} write ${response.status}: ${await response.text()}`);
  }

  return {
    insertEvents: rows => request('events', rows, { onConflict: 'event_id' }),
    insertOddsSnapshots: rows => request('odds_snapshots', rows),
    insertFeatureSnapshots: rows => request('feature_snapshots', rows),
    insertForecasts: rows => request('forecast_ledger', rows, { onConflict: 'event_id,snapshot_at,model_version' }),
    upsertTeams: rows => request('teams', rows, { onConflict: 'team_id' }),
    upsertPlayers: rows => request('players', rows, { onConflict: 'player_id' }),
    upsertGameResults: rows => request('game_results', rows, { onConflict: 'event_id' }),
    insertAvailabilitySnapshots: rows => request('availability_snapshots', rows),
    insertIngestionRun: rows => request('ingestion_runs', rows),
    upsertModelVersions: rows => request('model_versions', rows, { onConflict: 'model_version' })
  };
}
