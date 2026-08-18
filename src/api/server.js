import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { OddsApiProvider } from '../providers/oddsApi.js';
import { scoreLiveNBAEvents } from '../live/opportunities.js';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const CONTENT_TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };

async function serveStatic(pathname, res) {
  const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
  if (relative.includes('..')) return false;
  try {
    const body = await readFile(join(ROOT, relative));
    res.writeHead(200, { 'Content-Type': CONTENT_TYPES[extname(relative)] ?? 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(body); return true;
  } catch { return false; }
}

export function createServer({ oddsProvider = null, ratings = {} } = {}) {
  return http.createServer(async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    try {
      if (req.method === 'GET' && req.url === '/api/health') {
        const configured = Boolean(oddsProvider);
        res.writeHead(configured ? 200 : 503);
        return res.end(JSON.stringify({ status: configured ? 'ok' : 'degraded', live: configured, oddsProvider: configured ? 'configured' : 'missing' }));
      }
      if (req.method === 'GET' && req.url === '/api/forecasts') {
        if (!oddsProvider) { res.writeHead(503); return res.end(JSON.stringify({ error: 'Odds provider is not configured', forecasts: [] })); }
        const markets = await oddsProvider.fetchMarkets({ sportKey: 'basketball_nba' });
        const forecasts = scoreLiveNBAEvents(markets, ratings);
        res.writeHead(200);
        return res.end(JSON.stringify({ fetchedAt: new Date().toISOString(), sourceStatus: 'LIVE DATA CONNECTED', forecasts, diagnostics: { dataCompleteness: forecasts.length ? 1 : 0, modelAgreement: null, calibrationError: null } }));
      }
      if (req.method === 'GET') { if (await serveStatic(req.url, res)) return; }
      res.writeHead(404); res.end(JSON.stringify({ error: 'Not found' }));
    } catch (error) {
      res.writeHead(502); res.end(JSON.stringify({ error: error.message, forecasts: [] }));
    }
  });
}

export function startServer({ port = Number(process.env.PORT || 8787), ratings = {} } = {}) {
  const apiKey = process.env.EDGEPREDICT_ODDS_API_KEY;
  const oddsProvider = apiKey ? new OddsApiProvider({ apiKey, baseUrl: process.env.EDGEPREDICT_ODDS_API_URL }) : null;
  const server = createServer({ oddsProvider, ratings });
  return server.listen(port, () => console.log(`EdgePredict API listening on ${port}`));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) startServer();
