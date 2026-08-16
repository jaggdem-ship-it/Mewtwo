import { expectedWinProbability } from '../elo.js';

const clamp = p => Math.min(0.995, Math.max(0.005, p));

export function adjustedTeamStrength({ offensiveRating, defensiveRating, pace = 100, home = false, restDays = 2 }) {
  const rest = Math.min(2, Math.max(-2, restDays - 2)) * 1.5;
  const homeAdvantage = home ? 2.2 : 0;
  return offensiveRating - defensiveRating * 0.35 + (pace - 100) * 0.08 + rest + homeAdvantage;
}

export function nbaProbability({ home, away }) {
  const homeStrength = adjustedTeamStrength({ ...home, home: true });
  const awayStrength = adjustedTeamStrength({ ...away, home: false });
  return clamp(expectedWinProbability(1500 + homeStrength * 25, 1500 + awayStrength * 25));
}
