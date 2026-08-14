// Provider-neutral live sports data contract.
// The application intentionally keeps provider credentials outside source control.
export class SportsDataProvider {
  async fetchEvents({ sport, league, startAt, endAt } = {}) {
    throw new Error('SportsDataProvider.fetchEvents must be implemented by a live provider adapter');
  }

  async fetchAvailability({ eventId } = {}) {
    throw new Error('SportsDataProvider.fetchAvailability must be implemented by a live provider adapter');
  }
}

export function normalizeEvent(raw) {
  return {
    eventId: raw.eventId,
    sport: raw.sport,
    league: raw.league,
    homeTeam: raw.homeTeam,
    awayTeam: raw.awayTeam,
    startAt: raw.startAt,
    source: raw.source,
    sourceTimestamp: raw.sourceTimestamp
  };
}
