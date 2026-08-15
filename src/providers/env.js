export function requireEnv(name) {
  const value = globalThis?.process?.env?.[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function providerConfig() {
  return {
    oddsApiKey: requireEnv('EDGEPREDICT_ODDS_API_KEY'),
    sportsApiKey: requireEnv('EDGEPREDICT_SPORTS_API_KEY')
  };
}
