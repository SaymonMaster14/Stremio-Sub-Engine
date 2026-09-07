import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const execFileAsync = promisify(execFile);

export async function transcribeStream(mediaConfig, streamUrl) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'stremio-sub-asr-'));
  const output = path.join(dir, 'output.srt');
  try {
    await execFileAsync(mediaConfig.pythonCommand, [
      mediaConfig.asrScript,
      '--input', streamUrl,
      '--output', output,
      '--model', mediaConfig.asrModel,
      '--device', mediaConfig.asrDevice,
      '--compute-type', mediaConfig.asrComputeType
    ], {
      timeout: mediaConfig.asrTimeoutMs,
      maxBuffer: 8 * 1024 * 1024
    });
    return await fs.readFile(output, 'utf8');
  } finally {
    await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
