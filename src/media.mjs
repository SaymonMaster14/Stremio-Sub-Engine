export function parseVideoId(id) {
  const parts = String(id || '').split(':');
  const imdb = /^tt\d+$/.test(parts[0]) ? parts[0] : null;
  const season = parts[1] && /^\d+$/.test(parts[1]) ? Number(parts[1]) : null;
  const episode = parts[2] && /^\d+$/.test(parts[2]) ? Number(parts[2]) : null;
  return { imdb, imdbNumeric: imdb ? Number(imdb.slice(2)) : null, season, episode };
}

export function parseExtraSegment(segment = '') {
  const cleaned = segment.replace(/\.json$/i, '');
  const params = new URLSearchParams(cleaned);
  const videoSize = Number(params.get('videoSize'));
  return {
    videoHash: params.get('videoHash') || undefined,
    videoSize: Number.isFinite(videoSize) && videoSize > 0 ? videoSize : undefined,
    filename: params.get('filename') || undefined,
    streamUrl: params.get('streamUrl') || undefined
  };
}

export function releaseTokens(filename = '') {
  return new Set(String(filename)
    .toLowerCase()
    .replace(/\.[a-z0-9]{2,5}$/i, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((x) => x.length > 1));
}

export function releaseSimilarity(a, b) {
  const aa = releaseTokens(a);
  const bb = releaseTokens(b);
  if (!aa.size || !bb.size) return 0;
  let intersection = 0;
  for (const token of aa) if (bb.has(token)) intersection += 1;
  const union = new Set([...aa, ...bb]).size;
  return union ? intersection / union : 0;
}
