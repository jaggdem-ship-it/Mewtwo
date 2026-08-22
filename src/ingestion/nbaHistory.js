import { ingestNBASeason } from './nbaSeasonRunner.js';

/** Ingest multiple seasons sequentially so provider quotas and failures are isolated per season. */
export async function ingestNBAHistory({ provider, seasons, seasonType = 'REG', onSeasonComplete = async () => {}, ...options } = {}) {
  if (!Array.isArray(seasons) || !seasons.length) throw new Error('At least one season is required');
  const reports = [];
  const seenEventIds = options.seenEventIds ?? new Set();

  for (const seasonYear of [...seasons].map(Number).sort((a, b) => a - b)) {
    const report = await ingestNBASeason({
      provider,
      seasonYear,
      seasonType,
      ...options,
      seenEventIds,
      onBatch: async (batch, context) => {
        for (const game of batch) seenEventIds.add(game.eventId);
        if (options.onBatch) await options.onBatch(batch, context);
      }
    });
    reports.push(report);
    await onSeasonComplete(report);
  }

  return {
    seasons: reports,
    scheduled: reports.reduce((n, r) => n + r.scheduled, 0),
    fetched: reports.reduce((n, r) => n + r.fetched, 0),
    accepted: reports.reduce((n, r) => n + r.accepted, 0),
    rejected: reports.reduce((n, r) => n + r.rejected, 0)
  };
}
