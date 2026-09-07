import http from 'node:http';
import { loadConfig } from './config.mjs';
import { DiskCache, JobStore } from './cache.mjs';
import { createProviders } from './providers/index.mjs';
import { createTranslator } from './translators/index.mjs';
import { SubtitlePipeline } from './pipeline.mjs';
import { createApp } from './app.mjs';

const config = loadConfig();
const cache = new DiskCache(config.cacheDir, config.cacheTtlSeconds);
const jobs = new JobStore(config.cacheDir);
const providers = createProviders(config, cache);
const translator = createTranslator(config.translator);
const pipeline = new SubtitlePipeline({ config, cache, jobs, providers, translator });
const server = http.createServer(createApp({ config, providers, translator, pipeline }));

server.listen(config.port, config.host, () => {
  console.log(`Stremio Sub Engine listening on ${config.host}:${config.port}`);
  console.log(`Manifest: ${config.baseUrl}/manifest.json`);
});
