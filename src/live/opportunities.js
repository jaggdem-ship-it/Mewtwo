import { forecastNBA } from '../pipeline/forecast.js';
import { normalizeOddsEvents, bestAvailableTwoWay } from './normalizeOdds.js';

export function scoreLiveNBAEvents(events, ratings = {}) {
  const rows = normalizeOddsEvents(events);
  const byEvent = new Map();
  for (const row of rows) {
    if (!byEvent.has(row.eventId)) byEvent.set(row.eventId, []);
    byEvent.get(row.eventId).push(row);
  }

  return events.map(event => {
    const market = bestAvailableTwoWay(byEvent.get(event.eventId) || [], event.homeTeam, event.awayTeam);
    if (!market.home || !market.away) return { eventId: event.eventId, status: 'NO_BET', reasons: ['MARKET_INCOMPLETE'] };

    const homeRating = ratings[event.homeTeam] ?? 1500;
    const awayRating = ratings[event.awayTeam] ?? 1500;
    return {
      eventId: event.eventId,
      homeTeam: event.homeTeam,
      awayTeam: event.awayTeam,
      commenceTime: event.commenceTime,
      sportsbook: market.home.sportsbook,
      ...forecastNBA({ homeRating, awayRating, homeOdds: market.home.decimalOdds, awayOdds: market.away.decimalOdds })
    };
  });
}
