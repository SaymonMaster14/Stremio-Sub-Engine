import path from 'node:path';

function bool(name, fallback = false) {
  const value = process.env[name];
  if (value == null) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

function num(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) ? value : fallback;
}

export function loadConfig() {
  const port = num('PORT', 7000);
  const host = process.env.HOST || '0.0.0.0';
  return {
    host,
    port,
    baseUrl: (process.env.BASE_URL || `http://127.0.0.1:${port}`).replace(/\/$/, ''),
    cacheDir: path.resolve(process.env.CACHE_DIR || '.cache'),
    cacheTtlSeconds: num('CACHE_TTL_SECONDS', 86400),
    maxResults: Math.max(1, Math.min(20, num('MAX_RESULTS', 8))),
    minConfidence: Math.max(0, Math.min(1, num('MIN_CONFIDENCE', 0.55))),
    opensubtitles: {
      apiKey: process.env.OPENSUBTITLES_API_KEY || '',
      token: process.env.OPENSUBTITLES_TOKEN || '',
      userAgent: process.env.OPENSUBTITLES_USER_AGENT || 'StremioSubEngine v0.1.0',
      apiBase: (process.env.OPENSUBTITLES_API_BASE || 'https://api.opensubtitles.com/api/v1').replace(/\/$/, '')
    },
    translator: {
      provider: (process.env.TRANSLATOR || 'none').toLowerCase(),
      libreTranslateUrl: (process.env.LIBRETRANSLATE_URL || 'http://127.0.0.1:5000').replace(/\/$/, ''),
      libreTranslateApiKey: process.env.LIBRETRANSLATE_API_KEY || '',
      ollamaUrl: (process.env.OLLAMA_URL || 'http://127.0.0.1:11434').replace(/\/$/, ''),
      ollamaModel: process.env.OLLAMA_MODEL || 'qwen3:4b',
      concurrency: Math.max(1, Math.min(16, num('TRANSLATION_CONCURRENCY', 4)))
    },
    media: {
      enabled: bool('ENABLE_MEDIA_ACCESS', false),
      allowPrivateStreams: bool('ALLOW_PRIVATE_STREAMS', true),
      syncEngine: (process.env.SYNC_ENGINE || 'ffsubsync').toLowerCase(),
      ffsubsyncCommand: process.env.FFSUBSYNC_COMMAND || 'ffsubsync',
      alassCommand: process.env.ALASS_COMMAND || 'alass-cli',
      syncTimeoutMs: num('SYNC_TIMEOUT_MS', 180000),
      asrEnabled: bool('ENABLE_ASR', false),
      pythonCommand: process.env.PYTHON_COMMAND || 'python3',
      asrScript: path.resolve(process.env.ASR_SCRIPT || 'tools/asr_faster_whisper.py'),
      asrModel: process.env.ASR_MODEL || 'small',
      asrDevice: process.env.ASR_DEVICE || 'auto',
      asrComputeType: process.env.ASR_COMPUTE_TYPE || 'auto',
      asrTimeoutMs: num('ASR_TIMEOUT_MS', 900000)
    }
  };
}
