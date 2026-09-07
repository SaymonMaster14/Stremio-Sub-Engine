import { normalizeToSrt } from './subtitle/format.mjs';
import { translateSubtitle } from './translators/index.mjs';
import { downloadCandidate } from './providers/index.mjs';
import { syncSubtitle } from './sync.mjs';
import { transcribeStream } from './asr.mjs';
import { validateStreamUrl } from './security.mjs';

export class SubtitlePipeline {
  constructor({ config, cache, jobs, providers, translator }) {
    this.config = config;
    this.cache = cache;
    this.jobs = jobs;
    this.providers = providers;
    this.translator = translator;
    this.inflight = new Map();
  }

  async registerCandidate(candidate, prefs, streamUrl) {
    return this.jobs.create({
      kind: 'candidate', candidate, prefs,
      streamUrl: streamUrl || null,
      sync: Boolean(prefs.sync && streamUrl && this.config.media.enabled),
      translate: Boolean(prefs.translate && candidate.language !== prefs.targetLang)
    });
  }

  async registerAsr(prefs, streamUrl) {
    return this.jobs.create({
      kind: 'asr', prefs, streamUrl,
      translate: false,
      sync: false
    });
  }

  async materialize(id) {
    const job = await this.jobs.get(id);
    if (!job) throw Object.assign(new Error('Subtitle job not found or expired'), { statusCode: 404 });
    const key = this.cache.key(job);
    const cached = await this.cache.getText('rendered', key);
    if (cached) return cached;
    if (this.inflight.has(key)) return this.inflight.get(key);
    const promise = this.#materialize(job).then(async (result) => {
      await this.cache.setText('rendered', key, result);
      return result;
    }).finally(() => this.inflight.delete(key));
    this.inflight.set(key, promise);
    return promise;
  }

  async #materialize(job) {
    let subtitle;
    if (job.kind === 'asr') {
      if (!this.config.media.enabled || !this.config.media.asrEnabled) throw new Error('ASR is disabled on this server');
      const streamUrl = validateStreamUrl(job.streamUrl, this.config.media.allowPrivateStreams);
      subtitle = await transcribeStream(this.config.media, streamUrl);
    } else {
      subtitle = await downloadCandidate(this.providers, job.candidate);
      subtitle = normalizeToSrt(subtitle);
      if (job.sync) {
        const streamUrl = validateStreamUrl(job.streamUrl, this.config.media.allowPrivateStreams);
        subtitle = await syncSubtitle(this.config.media, streamUrl, subtitle);
        subtitle = normalizeToSrt(subtitle);
      }
      if (job.translate) {
        subtitle = await translateSubtitle(this.translator, subtitle, job.candidate.language, job.prefs.targetLang);
      }
    }
    return normalizeToSrt(subtitle);
  }
}
