export function normalizeOddsEvents(events) {
  const rows = [];
  for (const event of events) {
    for (const bookmaker of event.bookmakers || []) {
      for (const market of bookmaker.markets || []) {
        for (const outcome of market.outcomes || []) {
          rows.push({
            eventId: event.eventId,
            sport: event.sport,
            homeTeam: event.homeTeam,
            awayTeam: event.awayTeam,
            commenceTime: event.commenceTime,
            sportsbook: bookmaker.sportsbook,
            observedAt: bookmaker.lastUpdate,
            marketType: market.key,
            side: outcome.name,
            point: outcome.point ?? null,
            decimalOdds: Number(outcome.price)
          });
        }
      }
    }
  }
  return rows.filter(row => Number.isFinite(row.decimalOdds) && row.decimalOdds > 1);
}

export function bestAvailableTwoWay(rows, homeTeam, awayTeam) {
  const h2h = rows.filter(r => r.marketType === 'h2h' && (r.side === homeTeam || r.side === awayTeam));
  const best = new Map();
  for (const row of h2h) {
    const current = best.get(row.side);
    if (!current || row.decimalOdds > current.decimalOdds) best.set(row.side, row);
  }
  return { home: best.get(homeTeam) ?? null, away: best.get(awayTeam) ?? null };
}
