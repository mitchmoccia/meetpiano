import { pitchName, rollLandingY } from './song-score.js';

const PIXELS_PER_BEAT = 86;

export function createRollView(canvas) {
  let pixelsPerBeat = PIXELS_PER_BEAT;

  function sync(cursor, notes, centers) {
    const width = canvas.clientWidth || 640;
    const height = canvas.clientHeight || 220;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) {
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const hitY = height - 8;
    ctx.fillStyle = '#fff7df';
    ctx.fillRect(0, hitY - 10, width, 10);
    ctx.strokeStyle = '#de4936';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, hitY);
    ctx.lineTo(width, hitY);
    ctx.stroke();
    if (!centers?.map?.size) return;
    const white = centers.whiteWidth || 28;
    for (const note of notes) {
      const center = centers.map.get(note.pitch);
      if (!Number.isFinite(center)) continue;
      const bottom = rollLandingY(note.beat, cursor, hitY, pixelsPerBeat);
      const noteHeight = Math.max(10, note.dur * pixelsPerBeat - 6);
      const top = bottom - noteHeight;
      if (bottom < -8 || top > height + 8) continue;
      const narrow = centers.black.has(note.pitch);
      const w = narrow ? white * 0.55 : white * 0.72;
      const x = center - w / 2;
      ctx.globalAlpha = note.status === 'hit' && cursor > note.beat + 0.2 ? 0.35 : 1;
      ctx.fillStyle = note.hand === 'lh' ? '#f1aec0' : '#ffdc63';
      if (note.status === 'missed') ctx.fillStyle = '#e7e1d4';
      roundRect(ctx, x, top, w, noteHeight, 6);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#29251f';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      if (noteHeight > 18) {
        ctx.fillStyle = '#29251f';
        ctx.font = '700 12px "DM Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(pitchName(note.pitch), center, Math.min(bottom - 6, top + 16));
      }
    }
  }

  return { sync, pixelsPerBeat };
}

export function measureKeyCenters(piano) {
  const base = piano.getBoundingClientRect();
  const map = new Map();
  const black = new Set();
  let whiteWidth = 28;
  piano.querySelectorAll('.piano-key').forEach((key) => {
    const rect = key.getBoundingClientRect();
    const pitch = Number(key.dataset.note);
    map.set(pitch, rect.left - base.left + rect.width / 2);
    if (key.classList.contains('black-key')) black.add(pitch);
    if (key.classList.contains('white-key')) whiteWidth = rect.width;
  });
  return { map, black, whiteWidth };
}

function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}
