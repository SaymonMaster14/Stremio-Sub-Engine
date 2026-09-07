#!/usr/bin/env python3
import argparse
from faster_whisper import WhisperModel


def ts(seconds: float) -> str:
    total = max(0, int(round(seconds * 1000)))
    h, rem = divmod(total, 3600000)
    m, rem = divmod(rem, 60000)
    s, ms = divmod(rem, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--input', required=True)
    p.add_argument('--output', required=True)
    p.add_argument('--model', default='small')
    p.add_argument('--device', default='auto')
    p.add_argument('--compute-type', default='auto')
    p.add_argument('--language', default=None)
    args = p.parse_args()

    model = WhisperModel(args.model, device=args.device, compute_type=args.compute_type)
    segments, _ = model.transcribe(args.input, language=args.language, vad_filter=True, beam_size=5)
    with open(args.output, 'w', encoding='utf-8') as f:
        for i, segment in enumerate(segments, 1):
            text = segment.text.strip()
            if not text:
                continue
            f.write(f"{i}\n{ts(segment.start)} --> {ts(segment.end)}\n{text}\n\n")


if __name__ == '__main__':
    main()
