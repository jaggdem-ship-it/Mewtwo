// Provider-neutral live odds contract.
// Connect a licensed odds feed by implementing fetchMarkets().
export class OddsProvider {
  async fetchMarkets({ sport, league, eventIds = [] } = {}) {
    throw new Error('OddsProvider.fetchMarkets must be implemented by a live provider adapter');
  }
}

export function normalizeMarket(raw) {
  return {
    eventId: raw.eventId,
    sport: raw.sport,
    league: raw.league,
    marketType: raw.marketType,
    side: raw.side,
    decimalOdds: Number(raw.decimalOdds),
    sportsbook: raw.sportsbook,
    observedAt: raw.observedAt,
    sourceTimestamp: raw.sourceTimestamp
  };
}
