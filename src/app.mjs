import { buildManifest } from './manifest.mjs';
import { configurePage } from './configure-page.mjs';
import { decodePrefs } from './prefs.mjs';
import { parseExtraSegment, parseVideoId } from './media.mjs';
import { resolveCandidates } from './providers/index.mjs';

function json(res, status, body, headers = {}) {
  const payload = JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', ...headers });
  res.end(payload);
}

function text(res, status, body, contentType = 'text/plain; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': contentType, 'Access-Control-Allow-Origin': '*' });
  res.end(body);
}

function parseSubtitlePath(pathname) {
  const parts = pathname.split('/').filter(Boolean);
  let configToken = null;
  let offset = 0;
  if (parts[0] !== 'subtitles') { configToken = parts[0]; offset = 1; }
  if (parts[offset] !== 'subtitles' || parts.length < offset + 3) return null;
  const type = parts[offset + 1];
  const idPart = parts[offset + 2];
  const id = idPart.replace(/\.json$/i, '');
  const extra = parts[offset + 3] ? parseExtraSegment(parts[offset + 3]) : {};
  return { configToken, type, id, extra };
}

export function createApp({ config, providers, translator, pipeline }) {
  return async function app(req, res) {
    try {
      const url = new URL(req.url, config.baseUrl);
      if (req.method === 'OPTIONS') return text(res, 204, '');
      if (url.pathname === '/' || url.pathname === '/configure') return text(res, 200, configurePage(config.baseUrl), 'text/html; charset=utf-8');
      if (url.pathname === '/health') {
        return json(res, 200, {
          ok: true,
          providers: Object.fromEntries(providers.map((p) => [p.name, p.enabled])),
          translator: translator?.name || null,
          mediaAccess: config.media.enabled,
          syncEngine: config.media.enabled ? config.media.syncEngine : null,
          asr: config.media.enabled && config.media.asrEnabled
        });
      }
      if (url.pathname === '/manifest.json') return json(res, 200, buildManifest(false), { 'Cache-Control': 'public, max-age=300' });
      const manifestMatch = url.pathname.match(/^\/([^/]+)\/manifest\.json$/);
      if (manifestMatch) return json(res, 200, buildManifest(true), { 'Cache-Control': 'public, max-age=300' });

      const renderMatch = url.pathname.match(/^\/subtitle\/([0-9a-f-]{36})\.srt$/i);
      if (renderMatch) {
        const subtitle = await pipeline.materialize(renderMatch[1]);
        return text(res, 200, subtitle, 'application/x-subrip; charset=utf-8');
      }

      const route = parseSubtitlePath(url.pathname);
      if (route && ['movie', 'series'].includes(route.type)) {
        const prefs = decodePrefs(route.configToken);
        const identity = parseVideoId(route.id);
        const media = { ...route.extra, identity };
        const translatorAvailable = Boolean(translator);
        const candidates = await resolveCandidates({
          providers,
          media,
          prefs,
          filename: route.extra.filename,
          translatorAvailable,
          maxResults: config.maxResults
        });
        const threshold = Math.max(config.minConfidence, prefs.minConfidence);
        const accepted = candidates.filter((candidate) => candidate.confidence >= threshold);
        const subtitles = [];
        for (const candidate of accepted) {
          const id = await pipeline.registerCandidate(candidate, prefs, route.extra.streamUrl);
          const outputLang = prefs.translate && candidate.language !== prefs.targetLang ? prefs.targetLang : candidate.language;
          const markers = [Math.round(candidate.confidence * 100) + '%', ...(candidate.reasons || []).slice(0, 2)];
          subtitles.push({
            id: `sse-${candidate.providerId}-${markers.join('-')}`,
            lang: outputLang,
            url: `${config.baseUrl}/subtitle/${id}.srt`
          });
        }
        if (!subtitles.length && prefs.asr && config.media.enabled && config.media.asrEnabled && route.extra.streamUrl) {
          const id = await pipeline.registerAsr(prefs, route.extra.streamUrl);
          subtitles.push({ id: 'sse-asr-fallback', lang: prefs.targetLang, url: `${config.baseUrl}/subtitle/${id}.srt` });
        }
        return json(res, 200, { subtitles }, { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=300' });
      }

      return json(res, 404, { error: 'not_found' });
    } catch (error) {
      console.error('[stremio-sub-engine]', error?.message || error);
      return json(res, error?.statusCode || 500, { error: 'subtitle_engine_error', message: error?.message || 'Unknown error' });
    }
  };
}
