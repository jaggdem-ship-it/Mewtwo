import { buildRollingEfficiency, opponentAdjustedNetRating } from './efficiency.js';
import { buildRestFeatures, matchupRestFeatures } from './rest.js';
import { assertPointInTime } from './pointInTime.js';

export function buildNBAFeatureRow(games, game, { window = 10 } = {}) {
  const snapshotAt = game.snapshotAt || game.date;
  const homeEfficiency = buildRollingEfficiency(games, game.homeTeam, snapshotAt, { window });
  const awayEfficiency = buildRollingEfficiency(games, game.awayTeam, snapshotAt, { window });
  const homeRest = buildRestFeatures(games, game.homeTeam, snapshotAt);
  const awayRest = buildRestFeatures(games, game.awayTeam, snapshotAt);
  const matchup = opponentAdjustedNetRating(homeEfficiency, awayEfficiency);
  const rest = matchupRestFeatures(homeRest, awayRest);

  const features = [
    { name: 'home_offensive_rating', availableAt: snapshotAt },
    { name: 'away_offensive_rating', availableAt: snapshotAt },
    { name: 'home_defensive_rating', availableAt: snapshotAt },
    { name: 'away_defensive_rating', availableAt: snapshotAt },
    { name: 'expected_pace', availableAt: snapshotAt },
    { name: 'rest_differential_hours', availableAt: snapshotAt }
  ];
  assertPointInTime(features, snapshotAt);

  return {
    eventId: game.eventId || game.id,
    snapshotAt,
    homeTeam: game.homeTeam,
    awayTeam: game.awayTeam,
    homeEfficiency,
    awayEfficiency,
    matchup,
    homeRest,
    awayRest,
    rest
  };
}
