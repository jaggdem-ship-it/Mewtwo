import { createForecastLedgerEntry } from '../monitoring/ledger.js';

export async function persistLiveSnapshot(store, snapshot, { modelVersion = 'nba-elo-v1' } = {}) {
  const events = snapshot.markets.map(event => ({
    event_id: event.eventId,
    sport: event.sport,
    league: 'NBA',
    home_team: event.homeTeam,
    away_team: event.awayTeam,
    event_start_at: event.commenceTime,
    source: 'the-odds-api',
    source_timestamp: event.commenceTime
  }));
  await store.insertEvents(events);

  const odds = snapshot.markets.flatMap(event => event.bookmakers.flatMap(book =>
    book.markets.flatMap(market => market.outcomes.map(outcome => ({
      event_id: event.eventId,
      snapshot_at: snapshot.fetchedAt,
      sportsbook: book.sportsbook,
      market_type: market.key,
      side: outcome.name,
      point: outcome.point ?? null,
      decimal_odds: Number(outcome.price),
      source_timestamp: book.lastUpdate
    })))
  ));
  if (odds.length) await store.insertOddsSnapshots(odds);

  const forecasts = snapshot.forecasts.filter(f => f.status !== 'NO_BET' || f.edge !== undefined).map(f =>
    createForecastLedgerEntry({
      eventId: f.eventId,
      snapshotAt: snapshot.fetchedAt,
      modelVersion,
      modelProbability: f.modelProbability,
      marketProbability: f.marketProbability,
      decimalOdds: f.side === 'HOME' ? f.market?.homeOdds : null,
      edge: f.edge,
      ev: f.ev,
      action: f.action || f.status,
      reasons: f.reasons || []
    })
  );
  if (forecasts.length) await store.insertForecasts(forecasts.map(f => ({
    event_id: f.eventId,
    snapshot_at: f.snapshotAt,
    model_version: f.modelVersion,
    model_probability: f.modelProbability,
    market_probability: f.marketProbability,
    decimal_odds: f.decimalOdds,
    edge: f.edge,
    ev: f.ev,
    action: f.action,
    reasons: f.reasons
  })));

  return { eventsStored: events.length, oddsStored: odds.length, forecastsStored: forecasts.length };
}
