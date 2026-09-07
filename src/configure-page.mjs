export function configurePage(origin) {
  const parsedOrigin = new URL(origin);
  const safeOrigin = origin.replace(/</g, '&lt;');
  const stremioHost = JSON.stringify(parsedOrigin.host);
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Stremio Sub Engine</title>
<style>body{font-family:system-ui,sans-serif;max-width:720px;margin:40px auto;padding:0 18px;background:#111;color:#eee}label{display:block;margin:16px 0 6px}select,input{width:100%;box-sizing:border-box;padding:10px;background:#1d1d1d;color:#fff;border:1px solid #444;border-radius:8px}.check{display:flex;gap:10px;align-items:center}.check input{width:auto}button{margin-top:22px;padding:12px 18px;border:0;border-radius:8px;font-weight:700;cursor:pointer}.muted{color:#aaa;font-size:.92rem}code{word-break:break-all}</style></head>
<body><h1>Stremio Sub Engine</h1><p>Configure subtitle resolution. Translation and full media sync still depend on the server capabilities shown at <code>${safeOrigin}/health</code>.</p>
<label>Target language</label><select id="lang"><option value="por" selected>Português</option><option value="eng">English</option><option value="spa">Español</option><option value="fra">Français</option><option value="deu">Deutsch</option><option value="ita">Italiano</option></select>
<label>Minimum confidence (0-1)</label><input id="confidence" type="number" min="0" max="1" step="0.05" value="0.55">
<label class="check"><input id="translate" type="checkbox" checked>Translate synchronized fallback subtitles when target language is unavailable</label>
<label class="check"><input id="sync" type="checkbox" checked>Synchronize against stream audio when the Stremio client exposes an accessible stream URL</label>
<label class="check"><input id="asr" type="checkbox" checked>Use ASR as last resort when server media access is enabled</label>
<button id="install">Install in Stremio</button><p class="muted">No provider secrets are stored in this URL. API keys and model backends live on the self-hosted server.</p>
<script>
const enc=o=>btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
document.getElementById('install').onclick=()=>{const p={targetLang:document.getElementById('lang').value,fallbackLangs:['eng','spa'],translate:document.getElementById('translate').checked,sync:document.getElementById('sync').checked,asr:document.getElementById('asr').checked,minConfidence:Number(document.getElementById('confidence').value)};const token=enc(p);location.href='stremio://'+${stremioHost}+'/'+token+'/manifest.json';};
</script></body></html>`;
}
