import { normalizeAndValidateHistoricalGames } from '../providers/historical.js';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function mapWithConcurrency(items, worker, concurrency = 4) {
  const results = new Array(items.length);
  let cursor = 0;
  async function run() {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length || 1) }, run));
  return results;
}

async function withRetry(fn, { retries = 3, baseDelayMs = 500 } = {}) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === retries) break;
      await sleep(baseDelayMs * (2 ** attempt));
    }
  }
  throw lastError;
}

/**
 * Fetches one NBA season from the authoritative schedule -> game-summary path.
 * Persistence is injected so this runner is usable with Supabase, files, or tests.
 * The runner is resumable: callers can pass already-seen event IDs and the
 * persistence layer should upsert by event_id rather than blindly inserting.
 */
export async function ingestNBASeason({
  provider,
  seasonYear,
  seasonType = 'REG',
  concurrency = 4,
  retries = 3,
  seenEventIds = new Set(),
  onBatch = async () => {},
  batchSize = 50,
  continueOnError = true
} = {}) {
  if (!provider?.fetchSchedule || !provider?.fetchGameSummary) throw new Error('A compatible NBA provider is required');
  if (!Number.isInteger(Number(seasonYear))) throw new Error('seasonYear must be an integer');

  const schedule = await withRetry(() => provider.fetchSchedule({ seasonYear, seasonType }), { retries });
  const scheduledGames = schedule?.games ?? [];
  const candidates = scheduledGames
    .map(game => ({ id: game.id ?? game.sport_event?.id, game }))
    .filter(item => item.id && !seenEventIds.has(String(item.id)));

  const errors = [];
  const normalized = [];
  const results = await mapWithConcurrency(candidates, async ({ id }) => {
    try {
      const summary = await withRetry(() => provider.fetchGameSummary(id), { retries });
      return { ok: true, game: summary, id };
    } catch (error) {
      errors.push({ eventId: String(id), seasonYear, reason: error.message });
      if (!continueOnError) throw error;
      return { ok: false, id };
    }
  }, concurrency);

  for (const result of results) {
    if (!result?.ok) continue;
    normalized.push(result.game);
  }

  const { games, rejected } = normalizeAndValidateHistoricalGames(normalized);
  const allRejected = [...rejected, ...errors.map(error => ({ raw: error, reason: error.reason }))];
  const batches = [];
  for (let i = 0; i < games.length; i += batchSize) {
    const batch = games.slice(i, i + batchSize);
    await onBatch(batch, { seasonYear, seasonType, batchNumber: batches.length + 1 });
    batches.push(batch.length);
  }

  return {
    seasonYear: Number(seasonYear),
    seasonType,
    scheduled: scheduledGames.length,
    fetched: normalized.length,
    accepted: games.length,
    rejected: allRejected.length,
    batches: batches.length,
    errors: allRejected
  };
}

export { mapWithConcurrency, withRetry };
