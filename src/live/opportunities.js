import { forecastNBA } from '../pipeline/forecast.js';
import { normalizeOddsEvents, bestAvailableTwoWay } from './normalizeOdds.js';

export function scoreLiveNBAEvents(events, ratings = {}) {
  const rows = normalizeOddsEvents(events), byEvent = new Map();
  for (const row of rows) { if (!byEvent.has(row.eventId)) byEvent.set(row.eventId, []); byEvent.get(row.eventId).push(row); }

  return events.map(event => {
    const market = bestAvailableTwoWay(byEvent.get(event.eventId) || [], event.homeTeam, event.awayTeam);
    if (!market.home || !market.away) return { eventId: event.eventId, homeTeam: event.homeTeam, awayTeam: event.awayTeam, status: 'NO_BET', action: 'NO_BET', reasons: ['MARKET_INCOMPLETE'], stakeFraction: 0 };
    const homeRating = ratings[event.homeTeam], awayRating = ratings[event.awayTeam];
    if (![homeRating, awayRating].every(Number.isFinite)) return { eventId: event.eventId, homeTeam: event.homeTeam, awayTeam: event.awayTeam, status: 'NO_BET', action: 'NO_BET', reasons: ['MODEL_STATE_UNAVAILABLE'], stakeFraction: 0 };
    const forecast = forecastNBA({ homeRating, awayRating, homeOdds: market.home.decimalOdds, awayOdds: market.away.decimalOdds });
    return { eventId: event.eventId, homeTeam: event.homeTeam, awayTeam: event.awayTeam, commenceTime: event.commenceTime, sportsbook: market.home.sportsbook, marketHomeOdds: market.home.decimalOdds, marketAwayOdds: market.away.decimalOdds, ...forecast };
  });
}
