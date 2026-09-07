export function buildManifest(configured = false) {
  return {
    id: 'community.stremio-sub-engine',
    version: '0.1.0',
    name: configured ? 'Stremio Sub Engine' : 'Stremio Sub Engine (configure)',
    description: 'Resolve the correct subtitle for the selected release, translate it, and optionally synchronize/transcribe against the actual stream.',
    resources: ['subtitles'],
    types: ['movie', 'series'],
    idPrefixes: ['tt'],
    behaviorHints: {
      configurable: true,
      configurationRequired: !configured
    }
  };
}
