export function expectedWinProbability(ratingA, ratingB, scale = 400) {
  return 1 / (1 + 10 ** ((ratingB - ratingA) / scale));
}

export function updateElo(ratingA, ratingB, actualA, k = 20, scale = 400) {
  const expectedA = expectedWinProbability(ratingA, ratingB, scale);
  return {
    ratingA: ratingA + k * (actualA - expectedA),
    ratingB: ratingB + k * ((1 - actualA) - (1 - expectedA)),
    expectedA
  };
}

export function homeAdjustedProbability(homeRating, awayRating, homeAdvantage = 65) {
  return expectedWinProbability(homeRating + homeAdvantage, awayRating);
}
