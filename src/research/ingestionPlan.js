import { SOURCE_REGISTRY } from '../providers/sourceRegistry.js';

export function buildNBAIngestionPlan({ seasons = [], includePlayoffs = false, includeOdds = true } = {}) {
  const seasonTypes = includePlayoffs ? ['REG', 'PST'] : ['REG'];
  return seasons.flatMap(season => seasonTypes.map(seasonType => ({
    sport: 'NBA',
    season,
    seasonType,
    gameSource: SOURCE_REGISTRY.nbaHistorical.primary,
    oddsSource: includeOdds ? SOURCE_REGISTRY.historicalOdds.primary : null,
    required: ['schedule', 'game_summary'],
    optional: ['injuries', 'player_statistics', 'play_by_play']
  })));
}

export function summarizeIngestion(results = []) {
  const total = results.length;
  const successful = results.filter(r => r.status === 'ok').length;
  const failed = results.filter(r => r.status === 'error').length;
  return {
    total,
    successful,
    failed,
    successRate: total ? successful / total : 0,
    readyForModeling: total > 0 && failed === 0
  };
}
