export function buildPlayerImpactMap(players = []) {
  const impact = new Map();
  for (const player of players) {
    if (!player?.playerId) continue;
    const minutes = Number(player.minutes ?? 0);
    const netRating = Number(player.netRating ?? 0);
    const usage = Number(player.usageRate ?? 0);
    const availability = player.available === false ? 0 : 1;
    const sampleWeight = Math.min(1, Math.max(0, minutes / 1200));
    impact.set(String(player.playerId), {
      playerId: String(player.playerId),
      teamId: player.teamId,
      availability,
      impact: (netRating / 100) * (0.5 + 0.5 * sampleWeight) * (0.75 + 0.25 * Math.min(1, usage / 30))
    });
  }
  return impact;
}

export function teamAvailabilityAdjustment(players = []) {
  return players.reduce((sum, player) => {
    const impact = Number(player.impact ?? 0);
    const availability = player.available === false ? 0 : 1;
    return sum + impact * (availability - 1);
  }, 0);
}

export function matchupAvailability({ homePlayers = [], awayPlayers = [] } = {}) {
  return {
    homeAdjustment: teamAvailabilityAdjustment(homePlayers),
    awayAdjustment: teamAvailabilityAdjustment(awayPlayers),
    netAdjustment: teamAvailabilityAdjustment(homePlayers) - teamAvailabilityAdjustment(awayPlayers)
  };
}
