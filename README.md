# Stremio Sub Engine

A self-hosted Stremio subtitle add-on that treats subtitles as a resolution problem rather than a single-provider lookup:

1. identify the exact video release from `videoHash`, `videoSize`, filename and IMDb/episode identity;
2. rank subtitle candidates by confidence;
3. prefer a correctly timed subtitle in the target language;
4. otherwise use a synchronized subtitle in another language and translate only its text, preserving timestamps;
5. when the Stremio request exposes an accessible `streamUrl`, optionally align against the actual audio with `ffsubsync`/ALASS;
6. if no subtitle exists at all, optionally fall back to `faster-whisper` ASR.

The project intentionally separates **resolution**, **alignment**, and **transformation**. ASR is the last fallback, not the default path.

## What works with Stremio today

Current subtitle requests can include `videoHash`, `videoSize` and `filename`. That is enough for exact OpenSubtitles hash matching and strong release-name matching. Translation works server-side while preserving the matched subtitle's timestamps.

Current Stremio clients do **not universally pass the selected stream URL to subtitle add-ons**. Therefore audio-aware synchronization and ASR cannot be guaranteed by a normal remote add-on today. This repository already implements those code paths and consumes an optional `streamUrl` extra when available.

Full media-aware mode is most useful when this add-on is self-hosted on the same machine/network namespace as a Stremio streaming server, or when the selected stream URL is otherwise reachable from the add-on host.

## Quick start

Requirements for the normal mode:

- Node.js 22+
- an OpenSubtitles REST API key

```bash
cp .env.example .env
# set OPENSUBTITLES_API_KEY in .env
node src/index.mjs
```

Open `http://127.0.0.1:7000/configure`, choose preferences, and press **Install in Stremio**.

No npm dependencies are required at runtime.

## Docker

The default Docker image includes FFmpeg, ffsubsync 0.5.1 and faster-whisper so full media-aware mode can be enabled without changing images:

```bash
cp .env.example .env
docker compose up -d addon
```

For lookup/translation-only deployments, `Dockerfile.lite` omits Python/FFmpeg tooling.

### Free/open-source translation

Two local/self-hostable translation backends are implemented:

- `TRANSLATOR=libretranslate` — LibreTranslate HTTP API.
- `TRANSLATOR=ollama` — an Ollama model using structured JSON batches.

To run LibreTranslate alongside the add-on:

```bash
docker compose --profile translate up -d
```

Set `TRANSLATOR=libretranslate` and, from inside Compose, `LIBRETRANSLATE_URL=http://libretranslate:5000`.

## OpenSubtitles

Configure:

```env
OPENSUBTITLES_API_KEY=...
OPENSUBTITLES_TOKEN=... # optional; useful for authenticated quota
```

The resolver performs bounded searches using exact file hash first, then IMDb/season/episode identity. Results are deduplicated and ranked using:

- OpenSubtitles movie-hash match;
- IMDb identity match;
- release/filename token similarity;
- target-language match;
- trusted-uploader and accessibility metadata.

Only candidates above the configured confidence threshold are returned to Stremio. This avoids auto-selecting a random same-title subtitle just because one exists.

## Translation pipeline

A foreign-language subtitle is only translated when its timing confidence is high enough. The parser converts SRT/WebVTT into cue objects, translates cue text, and renders fresh SRT while leaving cue start/end timestamps unchanged.

Ollama batches cues and requires an equal-length JSON response. LibreTranslate uses bounded concurrency per cue. Generated subtitles are cached on disk.

## Full synchronization

Enable explicit media access:

```env
ENABLE_MEDIA_ACCESS=true
SYNC_ENGINE=ffsubsync
```

When a subtitle request contains `streamUrl`, the materialization pipeline can run:

```text
ffsubsync <streamUrl> -i input.srt -o output.srt \
  --multi-segment-sync --segment-count 6 \
  --skip-intro-outro --parallel-workers 4 \
  --skip-sync-on-low-quality
```

This uses sparse samples across the reference rather than blindly processing the entire movie. `SYNC_ENGINE=alass` is also supported when `alass-cli` is installed.

### Security

Media access is **off by default** because a server that accepts arbitrary stream URLs can become an SSRF primitive. Keep it disabled on public hosts unless stream URL input is trusted and network access is isolated. `ALLOW_PRIVATE_STREAMS=false` rejects obvious loopback/private literal IPs.

## ASR fallback

Enable:

```env
ENABLE_MEDIA_ACCESS=true
ENABLE_ASR=true
ASR_MODEL=small
ASR_DEVICE=auto
ASR_COMPUTE_TYPE=auto
```

If there are no accepted subtitle candidates and an accessible `streamUrl` exists, Stremio receives an ASR fallback subtitle URL. On first fetch, `tools/asr_faster_whisper.py` transcribes the stream and emits SRT. The result is cached.

ASR is deliberately last because it is much more expensive than reusing an existing correctly timed subtitle.

## Stremio endpoints

- `/manifest.json` — unconfigured manifest;
- `/configure` — custom configuration page;
- `/<base64url-prefs>/manifest.json` — configured add-on manifest;
- `/<prefs>/subtitles/{type}/{id}/{extra}.json` — subtitle resolution;
- `/subtitle/{opaque-job-id}.srt` — lazy download/sync/translate/ASR materialization;
- `/health` — enabled provider/capability status without exposing secrets.

The opaque job URL is intentional: selected stream URLs and provider credentials are not embedded in the subtitle URL returned to the player.

## Development

```bash
npm test
npm run check
```

The codebase has zero Node runtime dependencies and uses the built-in Node test runner.

## Architecture

```text
Stremio subtitle request
        |
        v
release identity (IMDb + hash + filename)
        |
        v
provider searches -> dedupe -> confidence ranking
        |
        +-- target language, good timing -------------------+
        |                                                   |
        +-- foreign language, good timing -> translation ---+--> cached SRT
        |                                                   |
        +-- streamUrl available -> audio alignment ---------+
        |                                                   |
        +-- no subtitle -> faster-whisper ASR --------------+
```

## License

MIT.
