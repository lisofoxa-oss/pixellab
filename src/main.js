// ─── State ──────────────────────────────────────────────
const state = {
  sourceFile: null,
  originalData: null, // ImageData of original
  currentData: null,  // ImageData after filters
  width: 0,
  height: 0,
  format: 'png',
  quality: 92,
  resizeWidth: 0,
  resizeHeight: 0,
  keepAspect: true,
  filter: 'none',
  filterParams: { blur: 2, brightness: 100, contrast: 100, saturate: 100 },
};

const canvas = document.getElementById('preview');
const ctx = canvas.getContext('2d');
let currentTool = 'convert';

// ─── DOM refs ───────────────────────────────────────────
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('file-input');
const toolbar = document.getElementById('toolbar');
const editor = document.getElementById('editor');
const controlsPanel = document.getElementById('controls-panel');
const fileInfo = document.getElementById('file-info');
const fileSize = document.getElementById('file-size');
const btnDownload = document.getElementById('btn-download');
const btnReset = document.getElementById('btn-reset');
const paletteOutput = document.getElementById('palette-output');
const paletteGrid = document.getElementById('palette-grid');
const paletteCopy = document.getElementById('palette-copy');

// ─── File handling ──────────────────────────────────────
dropzone.addEventListener('click', () => fileInput.click());
dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('dragover'); });
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
dropzone.addEventListener('drop', e => { e.preventDefault(); dropzone.classList.remove('dragover'); loadFile(e.dataTransfer.files[0]); });
fileInput.addEventListener('change', () => { if (fileInput.files[0]) loadFile(fileInput.files[0]); });

function loadFile(file) {
  if (!file || !file.type.match(/image\/(png|jpeg|webp|bmp|gif)/)) { showToast('Unsupported format'); return; }
  state.sourceFile = file;
  const img = new Image();
  img.onload = () => {
    state.width = img.naturalWidth;
    state.height = img.naturalHeight;
    canvas.width = state.width;
    canvas.height = state.height;
    ctx.drawImage(img, 0, 0);
    state.originalData = ctx.getImageData(0, 0, state.width, state.height);
    state.currentData = null;
    state.resizeWidth = state.width;
    state.resizeHeight = state.height;
    showEditor();
    renderCurrentTool();
    extractPalette();
  };
  img.src = URL.createObjectURL(file);
}

function showEditor() {
  dropzone.classList.add('has-image');
  dropzone.querySelector('.dropzone-title').textContent = state.sourceFile.name;
  dropzone.querySelector('.dropzone-sub').textContent = `${state.width} × ${state.height}`;
  toolbar.style.display = 'flex';
  editor.style.display = 'block';
  fileInfo.textContent = `${state.sourceFile.name} · ${state.width}×${state.height}`;
  fileSize.textContent = formatBytes(state.sourceFile.size);
}

function formatBytes(b) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}

// ─── Tool switching ────────────────────────────────────
document.querySelectorAll('[data-tool]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentTool = btn.dataset.tool;
    renderCurrentTool();
  });
});

function renderCurrentTool() {
  resetCanvas();
  switch (currentTool) {
    case 'convert': renderConvert(); break;
    case 'compress': renderCompress(); break;
    case 'resize': renderResize(); break;
    case 'filters': renderFilters(); break;
    case 'palette': showPalette(); break;
  }
}

function resetCanvas() {
  if (state.originalData) {
    canvas.width = state.width;
    canvas.height = state.height;
    ctx.putImageData(state.originalData, 0, 0);
    state.currentData = null;
  }
  paletteOutput.style.display = 'none';
}

// ─── Convert ────────────────────────────────────────────
function renderConvert() {
  const fmt = state.format;
  controlsPanel.innerHTML = `
    <div class="control-group">
      <div class="control-label">Format</div>
      <div class="format-btns">
        ${['png','jpeg','webp','bmp'].map(f =>
          `<div class="format-btn ${f === fmt ? 'active' : ''}" data-fmt="${f}">${f.toUpperCase()}</div>`
        ).join('')}
      </div>
    </div>
    <div class="control-group">
      <div class="control-label">Info</div>
      <div style="font-size:12px;color:var(--text-dim);line-height:1.8">
        <div>Original: ${state.width}×${state.height}</div>
        <div>Size: ${formatBytes(state.sourceFile.size)}</div>
      </div>
    </div>
  `;
  controlsPanel.querySelectorAll('.format-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      controlsPanel.querySelectorAll('.format-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.format = btn.dataset.fmt;
      showToast(`Format: ${state.format.toUpperCase()}`);
    });
  });
}

// ─── Compress ───────────────────────────────────────────
function renderCompress() {
  controlsPanel.innerHTML = `
    <div class="control-group">
      <div class="control-label">
        Quality <span id="quality-val">${state.quality}%</span>
      </div>
      <input type="range" id="quality-slider" min="1" max="100" value="${state.quality}" />
    </div>
    <div class="control-group">
      <div class="control-label">Estimated size</div>
      <div id="est-size" style="font-size:12px;color:var(--text-dim)"></div>
    </div>
  `;
  const slider = controlsPanel.querySelector('#quality-slider');
  const val = controlsPanel.querySelector('#quality-val');
  const est = controlsPanel.querySelector('#est-size');
  slider.addEventListener('input', () => {
    state.quality = parseInt(slider.value);
    val.textContent = state.quality + '%';
    estimateSize();
  });
  estimateSize();

  async function estimateSize() {
    const blob = await toBlob(canvas, 'image/jpeg', state.quality / 100);
    est.textContent = `~${formatBytes(blob.size)} at ${state.quality}% quality`;
  }
}

// ─── Resize ─────────────────────────────────────────────
function renderResize() {
  controlsPanel.innerHTML = `
    <div class="control-group">
      <div class="control-label">Width <span id="rw-val">${state.resizeWidth}</span></div>
      <input type="range" id="rw-slider" min="1" max="${Math.min(state.width * 2, 4000)}" value="${state.resizeWidth}" />
    </div>
    <div class="control-group">
      <div class="control-label">Height <span id="rh-val">${state.resizeHeight}</span></div>
      <input type="range" id="rh-slider" min="1" max="${Math.min(state.height * 2, 4000)}" value="${state.resizeHeight}" />
    </div>
    <div class="control-group">
      <label style="display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text-dim)">
        <input type="checkbox" id="keep-aspect" ${state.keepAspect ? 'checked' : ''} /> Keep aspect ratio
      </label>
    </div>
    <div class="control-group">
      <div class="btn-row">
        <button class="btn btn-sm btn-secondary" data-preset="0.25">¼</button>
        <button class="btn btn-sm btn-secondary" data-preset="0.5">½</button>
        <button class="btn btn-sm btn-secondary" data-preset="0.75">¾</button>
        <button class="btn btn-sm btn-secondary" data-preset="2">2×</button>
        <button class="btn btn-sm btn-secondary" data-reset>Original</button>
      </div>
    </div>
  `;

  const rw = controlsPanel.querySelector('#rw-slider');
  const rh = controlsPanel.querySelector('#rh-slider');
  const rwv = controlsPanel.querySelector('#rw-val');
  const rhv = controlsPanel.querySelector('#rh-val');
  const aspect = controlsPanel.querySelector('#keep-aspect');

  function applyResize() {
    rwv.textContent = state.resizeWidth;
    rhv.textContent = state.resizeHeight;
    const temp = document.createElement('canvas');
    temp.width = state.resizeWidth;
    temp.height = state.resizeHeight;
    const tctx = temp.getContext('2d');
    tctx.drawImage(canvas, 0, 0, state.resizeWidth, state.resizeHeight);
    canvas.width = state.resizeWidth;
    canvas.height = state.resizeHeight;
    ctx.drawImage(temp, 0, 0);
  }

  rw.addEventListener('input', () => {
    state.resizeWidth = parseInt(rw.value);
    if (state.keepAspect) {
      state.resizeHeight = Math.round(state.resizeWidth * state.height / state.width);
      rh.value = state.resizeHeight;
    }
    applyResize();
  });

  rh.addEventListener('input', () => {
    state.resizeHeight = parseInt(rh.value);
    if (state.keepAspect) {
      state.resizeWidth = Math.round(state.resizeHeight * state.width / state.height);
      rw.value = state.resizeWidth;
    }
    applyResize();
  });

  aspect.addEventListener('change', () => { state.keepAspect = aspect.checked; });

  controlsPanel.querySelectorAll('[data-preset]').forEach(btn => {
    btn.addEventListener('click', () => {
      const factor = parseFloat(btn.dataset.preset);
      state.resizeWidth = Math.round(state.width * factor);
      state.resizeHeight = Math.round(state.height * factor);
      rw.value = state.resizeWidth;
      rh.value = state.resizeHeight;
      applyResize();
    });
  });

  controlsPanel.querySelector('[data-reset]').addEventListener('click', () => {
    state.resizeWidth = state.width;
    state.resizeHeight = state.height;
    rw.value = state.resizeWidth;
    rh.value = state.resizeHeight;
    rw.max = Math.min(state.width * 2, 4000);
    rh.max = Math.min(state.height * 2, 4000);
    applyResize();
  });
}

// ─── Filters ────────────────────────────────────────────
function renderFilters() {
  const current = state.filter;
  controlsPanel.innerHTML = `
    <div class="control-group">
      <div class="control-label">Filter</div>
      <div class="filter-grid">
        ${['none','grayscale','sepia','invert','blur','brightness','contrast','saturate'].map(f =>
          `<div class="filter-btn ${f === current ? 'active' : ''}" data-filter="${f}">${f}</div>`
        ).join('')}
      </div>
    </div>
    <div id="filter-params">
      <div class="control-group">
        <div class="control-label">Intensity <span id="fp-val">${state.filterParams.blur}</span></div>
        <input type="range" id="fp-slider" min="0" max="20" value="${state.filterParams.blur}" />
      </div>
    </div>
  `;

  controlsPanel.querySelectorAll('[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      controlsPanel.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.filter = btn.dataset.filter;
      updateFilterParams();
      applyFilter();
    });
  });

  const fpSlider = controlsPanel.querySelector('#fp-slider');
  const fpVal = controlsPanel.querySelector('#fp-val');

  fpSlider.addEventListener('input', () => {
    updateFilterParams();
    applyFilter();
  });

  updateFilterParams();
  applyFilter();
}

function updateFilterParams() {
  const fp = state.filterParams;
  const slider = document.getElementById('fp-slider');
  const val = document.getElementById('fp-val');
  if (!slider) return;

  switch (state.filter) {
    case 'blur': fp.blur = parseInt(slider.value); slider.max = 20; slider.value = Math.min(fp.blur, 20); val.textContent = fp.blur; break;
    case 'brightness': fp.brightness = parseInt(slider.value); slider.max = 200; slider.value = fp.brightness; val.textContent = fp.brightness + '%'; break;
    case 'contrast': fp.contrast = parseInt(slider.value); slider.max = 200; slider.value = fp.contrast; val.textContent = fp.contrast + '%'; break;
    case 'saturate': fp.saturate = parseInt(slider.value); slider.max = 300; slider.value = fp.saturate; val.textContent = fp.saturate + '%'; break;
    default: slider.max = 10; slider.value = parseInt(slider.value) || 5; val.textContent = slider.value; break;
  }
  if (state.filter === 'none') slider.disabled = true;
  else slider.disabled = false;
}

function applyFilter() {
  if (!state.originalData) return;
  const imgData = new ImageData(
    new Uint8ClampedArray(state.originalData.data),
    state.width,
    state.height
  );
  const d = imgData.data;

  if (state.filter === 'none') {
    ctx.putImageData(state.originalData, 0, 0);
    state.currentData = null;
    return;
  }

  const slider = document.getElementById('fp-slider');
  const intensity = slider ? parseFloat(slider.value) : 5;

  switch (state.filter) {
    case 'grayscale':
      for (let i = 0; i < d.length; i += 4) {
        const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        d[i] = d[i + 1] = d[i + 2] = gray;
      }
      break;
    case 'sepia':
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        d[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
        d[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
        d[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
      }
      break;
    case 'invert':
      for (let i = 0; i < d.length; i += 4) {
        d[i] = 255 - d[i];
        d[i + 1] = 255 - d[i + 1];
        d[i + 2] = 255 - d[i + 2];
      }
      break;
    case 'brightness':
      for (let i = 0; i < d.length; i += 4) {
        d[i] = Math.min(255, d[i] * intensity / 100);
        d[i + 1] = Math.min(255, d[i + 1] * intensity / 100);
        d[i + 2] = Math.min(255, d[i + 2] * intensity / 100);
      }
      break;
    case 'contrast':
      for (let i = 0; i < d.length; i += 4) {
        const factor = (259 * (intensity + 255)) / (255 * (259 - intensity));
        d[i] = Math.min(255, Math.max(0, factor * (d[i] - 128) + 128));
        d[i + 1] = Math.min(255, Math.max(0, factor * (d[i + 1] - 128) + 128));
        d[i + 2] = Math.min(255, Math.max(0, factor * (d[i + 2] - 128) + 128));
      }
      break;
    case 'saturate':
      for (let i = 0; i < d.length; i += 4) {
        const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        const f = intensity / 100;
        d[i] = Math.min(255, Math.max(0, gray + (d[i] - gray) * f));
        d[i + 1] = Math.min(255, Math.max(0, gray + (d[i + 1] - gray) * f));
        d[i + 2] = Math.min(255, Math.max(0, gray + (d[i + 2] - gray) * f));
      }
      break;
    case 'blur':
      const radius = Math.min(10, Math.round(intensity));
      if (radius > 0) {
        const w = state.width, h = state.height;
        const src = state.originalData.data;
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            let r = 0, g = 0, b = 0, count = 0;
            for (let dy = -radius; dy <= radius; dy++) {
              for (let dx = -radius; dx <= radius; dx++) {
                const px = Math.min(w - 1, Math.max(0, x + dx));
                const py = Math.min(h - 1, Math.max(0, y + dy));
                const idx = (py * w + px) * 4;
                r += src[idx]; g += src[idx + 1]; b += src[idx + 2]; count++;
              }
            }
            const idx = (y * w + x) * 4;
            d[idx] = r / count; d[idx + 1] = g / count; d[idx + 2] = b / count;
          }
        }
        state.filterParams.blur = intensity;
      }
      break;
  }

  ctx.putImageData(imgData, 0, 0);
  state.currentData = imgData;
}

// ─── Palette ────────────────────────────────────────────
function extractPalette() {
  if (!state.originalData) return;
  const w = state.width, h = state.height;
  const pixelData = state.originalData.data;
  const colors = [];
  const step = Math.max(1, Math.floor(Math.sqrt((w * h) / 2000)));
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const idx = (y * w + x) * 4;
      colors.push({ r: pixelData[idx], g: pixelData[idx + 1], b: pixelData[idx + 2] });
    }
  }
  // Quantize and count
  const buckets = {};
  const q = 32;
  for (const c of colors) {
    const key = `${Math.round(c.r / q) * q},${Math.round(c.g / q) * q},${Math.round(c.b / q) * q}`;
    buckets[key] = (buckets[key] || 0) + 1;
  }
  const sorted = Object.entries(buckets)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 16)
    .map(([key]) => {
      const [r, g, b] = key.split(',').map(Number);
      const hex = '#' + [r, g, b].map(v => Math.min(255, v + 16).toString(16).padStart(2, '0')).join('');
      return { r: Math.min(255, r + 16), g: Math.min(255, g + 16), b: Math.min(255, b + 16), hex };
    });
  state.palette = sorted;
}

function showPalette() {
  controlsPanel.innerHTML = '';
  if (!state.palette || state.palette.length === 0) extractPalette();
  paletteOutput.style.display = 'block';
  paletteGrid.innerHTML = state.palette.map(c =>
    `<div class="palette-swatch" data-hex="${c.hex}">
      <div class="color-block" style="background:${c.hex}"></div>
      <div class="color-hex">${c.hex}</div>
    </div>`
  ).join('');
  paletteGrid.querySelectorAll('.palette-swatch').forEach(el => {
    el.addEventListener('click', () => {
      navigator.clipboard.writeText(el.dataset.hex);
      showToast(`Copied ${el.dataset.hex}`);
    });
  });
}

paletteCopy.addEventListener('click', () => {
  if (!state.palette) return;
  const css = state.palette.map((c, i) => `  --color-${i + 1}: ${c.hex};`).join('\n');
  navigator.clipboard.writeText(`:root {\n${css}\n}`);
  showToast('CSS variables copied!');
});

// ─── Download ───────────────────────────────────────────
btnDownload.addEventListener('click', async () => {
  const mimeTypes = { png: 'image/png', jpeg: 'image/jpeg', webp: 'image/webp', bmp: 'image/bmp' };
  const ext = state.format === 'jpeg' ? 'jpg' : state.format;
  const mime = mimeTypes[state.format] || 'image/png';
  const quality = state.format === 'png' ? undefined : state.quality / 100;
  const blob = await toBlob(canvas, mime, quality);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const name = state.sourceFile.name.replace(/\.[^.]+$/, '');
  a.href = url;
  a.download = `${name}-pixellab.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
  showToast(`Downloaded ${formatBytes(blob.size)}`);
});

function toBlob(c, mime, quality) {
  return new Promise(resolve => c.toBlob(b => resolve(b), mime, quality));
}

// ─── Reset ──────────────────────────────────────────────
btnReset.addEventListener('click', () => {
  if (!state.originalData) return;
  state.currentData = null;
  state.filter = 'none';
  state.resizeWidth = state.width;
  state.resizeHeight = state.height;
  canvas.width = state.width;
  canvas.height = state.height;
  ctx.putImageData(state.originalData, 0, 0);
  renderCurrentTool();
  showToast('Reset to original');
});

// ─── Toast ──────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2000);
}
