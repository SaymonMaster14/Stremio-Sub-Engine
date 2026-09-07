import { OpenSubtitlesProvider } from './opensubtitles.mjs';
import { rankCandidates } from '../ranking.mjs';

function dedupe(candidates) {
  const map = new Map();
  for (const candidate of candidates) {
    const key = `${candidate.provider}:${candidate.providerId}`;
    if (!map.has(key)) map.set(key, candidate);
  }
  return [...map.values()];
}

export function createProviders(config, cache) {
  return [new OpenSubtitlesProvider(config.opensubtitles, cache)];
}

export async function resolveCandidates({ providers, media, prefs, filename, translatorAvailable, maxResults }) {
  const target = [prefs.targetLang];
  const fallback = prefs.translate && translatorAvailable ? prefs.fallbackLangs : [];
  const searches = [];

  for (const provider of providers.filter((p) => p.enabled)) {
    if (media.videoHash) {
      searches.push(provider.search({ languages: target, videoHash: media.videoHash, videoSize: media.videoSize }));
      if (fallback.length) searches.push(provider.search({ languages: fallback, videoHash: media.videoHash, videoSize: media.videoSize }));
    }
    if (media.identity.imdbNumeric) {
      searches.push(provider.search({
        languages: target,
        imdbNumeric: media.identity.imdbNumeric,
        season: media.identity.season,
        episode: media.identity.episode
      }));
      if (fallback.length) searches.push(provider.search({
        languages: fallback,
        imdbNumeric: media.identity.imdbNumeric,
        season: media.identity.season,
        episode: media.identity.episode
      }));
    } else if (filename) {
      searches.push(provider.search({ languages: target, text: filename }));
      if (fallback.length) searches.push(provider.search({ languages: fallback, text: filename }));
    }
  }

  const settled = await Promise.allSettled(searches);
  const candidates = dedupe(settled.flatMap((item) => item.status === 'fulfilled' ? item.value : []));
  return rankCandidates(candidates, { filename, targetLang: prefs.targetLang }).slice(0, maxResults);
}

export async function downloadCandidate(providers, candidate) {
  const provider = providers.find((p) => p.name === candidate.provider);
  if (!provider) throw new Error(`Provider not available: ${candidate.provider}`);
  return provider.download(candidate);
}
