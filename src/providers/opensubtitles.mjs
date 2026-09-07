import { fromOpenSubtitlesLanguage, toOpenSubtitlesLanguage } from '../languages.mjs';

function buildHeaders(config) {
  const headers = {
    'Api-Key': config.apiKey,
    'User-Agent': config.userAgent,
    'Content-Type': 'application/json'
  };
  if (config.token) headers.Authorization = `Bearer ${config.token}`;
  return headers;
}

export class OpenSubtitlesProvider {
  constructor(config, cache) {
    this.config = config;
    this.cache = cache;
    this.name = 'opensubtitles';
  }
  get enabled() { return Boolean(this.config.apiKey); }

  async request(pathname, options = {}) {
    if (!this.enabled) throw new Error('OpenSubtitles provider is disabled: OPENSUBTITLES_API_KEY is missing');
    const url = `${this.config.apiBase}${pathname}`;
    const response = await fetch(url, { ...options, headers: { ...buildHeaders(this.config), ...(options.headers || {}) } });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`OpenSubtitles ${response.status}: ${body.slice(0, 300)}`);
    }
    return response.json();
  }

  async search(query) {
    if (!this.enabled) return [];
    const params = new URLSearchParams();
    if (query.languages?.length) params.set('languages', query.languages.map(toOpenSubtitlesLanguage).join(','));
    if (query.imdbNumeric) params.set('imdb_id', String(query.imdbNumeric));
    if (query.videoHash) params.set('moviehash', query.videoHash);
    if (query.videoSize) params.set('moviebytesize', String(query.videoSize));
    if (query.season != null) params.set('season_number', String(query.season));
    if (query.episode != null) params.set('episode_number', String(query.episode));
    if (query.text) params.set('query', query.text);
    params.set('order_by', 'download_count');
    params.set('order_direction', 'desc');

    const cacheKey = this.cache.key(params.toString());
    let body = await this.cache.getJson('search-opensubtitles', cacheKey);
    if (!body) {
      body = await this.request(`/subtitles?${params.toString()}`);
      await this.cache.setJson('search-opensubtitles', cacheKey, body);
    }

    return (body.data || []).flatMap((entry) => {
      const a = entry.attributes || {};
      const files = Array.isArray(a.files) ? a.files : [];
      return files.map((file) => ({
        provider: this.name,
        providerId: String(file.file_id),
        fileId: file.file_id,
        fileName: file.file_name || '',
        release: a.release || '',
        language: fromOpenSubtitlesLanguage(a.language),
        movieHashMatch: Boolean(a.moviehash_match),
        imdbMatch: query.imdbNumeric ? Number(a.feature_details?.imdb_id) === Number(query.imdbNumeric) : false,
        trusted: Boolean(a.from_trusted),
        hearingImpaired: a.hearing_impaired === true,
        downloadCount: Number(a.download_count || 0),
        fps: a.fps || null,
        subtitleId: a.subtitle_id || entry.id
      }));
    });
  }

  async download(candidate) {
    const body = await this.request('/download', {
      method: 'POST',
      body: JSON.stringify({ file_id: Number(candidate.fileId), sub_format: 'srt' })
    });
    if (!body.link) throw new Error('OpenSubtitles download response did not include a link');
    const response = await fetch(body.link, { redirect: 'follow' });
    if (!response.ok) throw new Error(`Subtitle download failed with HTTP ${response.status}`);
    return await response.text();
  }
}
