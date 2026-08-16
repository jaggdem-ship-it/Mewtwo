import { NBAStatsProvider, timestampedStats } from '../providers/nbaStats.js';
import { normalizeAdvancedTeamRows } from '../models/nba/advancedFeatures.js';

export async function enrichNBAMarketsWithOfficialStats(markets, { statsProvider = new NBAStatsProvider(), season = '2025-26' } = {}) {
  const raw = await statsProvider.fetchTeamDashboard({ season });
  const snapshot = timestampedStats(raw);
  const teams = normalizeAdvancedTeamRows(raw, { asOf: snapshot.sourceTimestamp });
  const byName = new Map(teams.map(team => [team.teamName, team]));
  return {
    markets: markets.map(event => ({
      ...event,
      officialStats: {
        home: byName.get(event.homeTeam) ?? null,
        away: byName.get(event.awayTeam) ?? null
      }
    })),
    statsSnapshot: snapshot
  };
}
