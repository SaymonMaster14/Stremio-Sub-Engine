import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const execFileAsync = promisify(execFile);

export async function syncSubtitle(mediaConfig, streamUrl, subtitle) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'stremio-sub-sync-'));
  const input = path.join(dir, 'input.srt');
  const output = path.join(dir, 'output.srt');
  try {
    await fs.writeFile(input, subtitle, 'utf8');
    if (mediaConfig.syncEngine === 'alass') {
      await execFileAsync(mediaConfig.alassCommand, [streamUrl, input, output], {
        timeout: mediaConfig.syncTimeoutMs,
        maxBuffer: 4 * 1024 * 1024
      });
    } else {
      await execFileAsync(mediaConfig.ffsubsyncCommand, [
        streamUrl, '-i', input, '-o', output,
        '--multi-segment-sync', '--segment-count', '6', '--skip-intro-outro', '--parallel-workers', '4',
        '--skip-sync-on-low-quality'
      ], {
        timeout: mediaConfig.syncTimeoutMs,
        maxBuffer: 4 * 1024 * 1024
      });
    }
    return await fs.readFile(output, 'utf8');
  } finally {
    await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
