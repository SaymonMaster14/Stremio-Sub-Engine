function normalizeNewlines(text) {
  return String(text).replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
}

function parseTimecode(value) {
  const m = value.trim().match(/(?:(\d{1,2}):)?(\d{2}):(\d{2})[,.](\d{3})/);
  if (!m) return null;
  return (((Number(m[1] || 0) * 60 + Number(m[2])) * 60 + Number(m[3])) * 1000) + Number(m[4]);
}

function formatTimecode(ms) {
  const clamped = Math.max(0, Math.round(ms));
  const h = Math.floor(clamped / 3600000);
  const m = Math.floor((clamped % 3600000) / 60000);
  const s = Math.floor((clamped % 60000) / 1000);
  const milli = clamped % 1000;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(milli).padStart(3, '0')}`;
}

export function parseSubtitle(text) {
  const normalized = normalizeNewlines(text).replace(/^WEBVTT[^\n]*\n+/, '');
  const blocks = normalized.split(/\n{2,}/).map((x) => x.trim()).filter(Boolean);
  const cues = [];
  for (const block of blocks) {
    const lines = block.split('\n');
    const timelineIndex = lines.findIndex((line) => line.includes('-->'));
    if (timelineIndex < 0) continue;
    const [rawStart, rawEnd] = lines[timelineIndex].split('-->').map((x) => x.trim());
    const start = parseTimecode(rawStart);
    const end = parseTimecode(rawEnd.split(/\s+/)[0]);
    if (start == null || end == null) continue;
    const body = lines.slice(timelineIndex + 1).join('\n').trim();
    if (!body) continue;
    cues.push({ start, end, text: body });
  }
  return cues;
}

export function renderSrt(cues) {
  return cues.map((cue, index) => `${index + 1}\n${formatTimecode(cue.start)} --> ${formatTimecode(cue.end)}\n${cue.text.trim()}\n`).join('\n');
}

export function normalizeToSrt(text) {
  const cues = parseSubtitle(text);
  if (!cues.length) throw new Error('No subtitle cues could be parsed');
  return renderSrt(cues);
}
