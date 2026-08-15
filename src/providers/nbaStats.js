import { getJson, requireLiveTimestamp } from './http.js';

// NBA.com publishes official player/team statistics through its Stats platform.
// Keep the transport configurable because endpoint access, headers and licensing
// can vary by deployment. No credentials are stored in the repository.
export class NBAStatsProvider {
  constructor({ baseUrl = 'https://stats.nba.com/stats', headers = {} } = {}) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.headers = {
      'User-Agent': 'Mozilla/5.0 EdgePredict/1.0',
      Referer: 'https://www.nba.com/',
      ...headers
    };
  }

  async fetchTeamDashboard({ season = '2025-26', seasonType = 'Regular Season' } = {}) {
    const url = new URL(`${this.baseUrl}/leaguedashteamstats`);
    url.searchParams.set('Conference', '');
    url.searchParams.set('DateFrom', '');
    url.searchParams.set('DateTo', '');
    url.searchParams.set('Division', '');
    url.searchParams.set('GameScope', '');
    url.searchParams.set('GameSegment', '');
    url.searchParams.set('Height', '');
    url.searchParams.set('LastNGames', '0');
    url.searchParams.set('LeagueID', '00');
    url.searchParams.set('Location', '');
    url.searchParams.set('MeasureType', 'Advanced');
    url.searchParams.set('Month', '0');
    url.searchParams.set('OpponentTeamID', '0');
    url.searchParams.set('Outcome', '');
    url.searchParams.set('PORound', '0');
    url.searchParams.set('PaceAdjust', 'N');
    url.searchParams.set('PerMode', 'PerGame');
    url.searchParams.set('Period', '0');
    url.searchParams.set('PlayerExperience', '');
    url.searchParams.set('PlayerPosition', '');
    url.searchParams.set('PlusMinus', 'N');
    url.searchParams.set('Rank', 'N');
    url.searchParams.set('Season', season);
    url.searchParams.set('SeasonSegment', '');
    url.searchParams.set('SeasonType', seasonType);
    url.searchParams.set('ShotClockRange', '');
    url.searchParams.set('StarterBench', '');
    url.searchParams.set('TeamID', '0');
    url.searchParams.set('VsConference', '');
    url.searchParams.set('VsDivision', '');
    url.searchParams.set('Weight', '');
    const payload = await getJson(url.toString(), { headers: this.headers });
    return normalizeStatsPayload(payload);
  }
}

export function normalizeStatsPayload(payload) {
  const result = payload?.resultSets?.[0];
  if (!result?.headers || !result?.rowSet) throw new Error('Unexpected NBA stats response');
  return result.rowSet.map(row => Object.fromEntries(result.headers.map((header, i) => [header, row[i]])));
}

export function timestampedStats(rows, source = 'NBA.com Stats') {
  return { source, sourceTimestamp: requireLiveTimestamp(new Date().toISOString()), rows };
}
