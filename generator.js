'use strict';
// THE NIGHT SKY HERALD - deterministic 1200x675 broadsheet front page.
// Every visual choice that could be random is driven by the single PRNG below.
// Layout regions: masthead; hero sky panel with seeded stars and meteors;
// HOW TO WATCH box; WORLD WIRE column; footer strip.
// PRNG: the mulberry32 generator uses the fixed seed 0x20261121 declared below.
const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');
const WIDTH = 1200;
const HEIGHT = 675;
const TAU = Math.PI * 2;
const SERIF = '"Times New Roman", Georgia, serif';
const SANS = 'Arial, Helvetica, sans-serif';
const GOLD = '#d9b875';
const PAPER = '#f2f4ff';
const canvas = createCanvas(WIDTH, HEIGHT);
const ctx = canvas.getContext('2d');
function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(0x20261121); // 21 November 2026
const range = (min, max) => min + (max - min) * rnd();
function text(value, x, y, font, color, align = 'left') {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(value, x, y);
  ctx.textAlign = 'left';
}
function tracked(value, centerX, y, font, color, spacing) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  const chars = Array.from(value);
  const widths = chars.map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((sum, w) => sum + w, 0) + spacing * (chars.length - 1);
  let x = centerX - total / 2;
  chars.forEach((ch, i) => {
    ctx.fillText(ch, x, y);
    x += widths[i] + spacing;
  });
}
function wrap(value, maxWidth) {
  const lines = [];
  let line = '';
  for (const word of value.split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}
function paragraph(value, x, y, maxWidth, font, color, lineHeight) {
  ctx.font = font;
  const lines = wrap(value, maxWidth);
  lines.forEach((line, i) => text(line, x, y + i * lineHeight, font, color));
  return y + lines.length * lineHeight;
}
function rule(x1, y, x2, color, width = 1) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y + 0.5);
  ctx.lineTo(x2, y + 0.5);
  ctx.stroke();
}

// --- Page ground and masthead ------------------------------------------------
const ground = ctx.createLinearGradient(0, 0, 0, HEIGHT);
ground.addColorStop(0, '#0b1026');
ground.addColorStop(1, '#18234d');
ctx.fillStyle = ground;
ctx.fillRect(0, 0, WIDTH, HEIGHT);
ctx.strokeStyle = 'rgba(226,232,255,0.22)';
ctx.lineWidth = 1;
ctx.strokeRect(18.5, 18.5, WIDTH - 37, HEIGHT - 37);
text('THE NIGHT SKY HERALD', WIDTH / 2, 82, `bold 56px ${SERIF}`, '#ffffff', 'center');
rule(40, 102, WIDTH - 40, 'rgba(226,232,255,0.65)');
tracked(
  'LATE EDITION  |  SATURDAY, NOVEMBER 21, 2026  |  SKY DESK',
  WIDTH / 2, 126, `bold 12px ${SANS}`, GOLD, 1.5
);
rule(40, 144, WIDTH - 40, 'rgba(226,232,255,0.28)');

// --- Lead headline -----------------------------------------------------------
text('THE GEMINID WATCH', 40, 169, `bold 11px ${SANS}`, GOLD);
text('GEMINIDS BUILD TOWARD', 40, 207, `bold 34px ${SERIF}`, PAPER);
text('DEC. 13-14 PEAK', 40, 247, `bold 42px ${SERIF}`, PAPER);
text('SKY DESK / NO. 21', 690, 247, `11px ${SANS}`, 'rgba(226,232,255,0.6)', 'right');

// --- Hero sky panel ----------------------------------------------------------
const px = 40;
const py = 266;
const pw = 650;
const ph = 236;
ctx.save();
ctx.beginPath();
ctx.rect(px, py, pw, ph);
ctx.clip();
const sky = ctx.createLinearGradient(0, py, 0, py + ph);
sky.addColorStop(0, '#040713');
sky.addColorStop(1, '#101b3c');
ctx.fillStyle = sky;
ctx.fillRect(px, py, pw, ph);
const haze = ctx.createLinearGradient(px, py + ph, px + pw, py);
haze.addColorStop(0, 'rgba(60,90,170,0)');
haze.addColorStop(0.5, 'rgba(86,116,196,0.14)');
haze.addColorStop(1, 'rgba(60,90,170,0)');
ctx.fillStyle = haze;
ctx.fillRect(px, py, pw, ph);
// 220 fixed-seed stars.
for (let i = 0; i < 220; i++) {
  const sx = px + range(4, pw - 4);
  const sy = py + range(4, ph - 66);
  const radius = range(0.3, 1.35);
  const alpha = range(0.25, 0.95);
  ctx.fillStyle = `rgba(226,236,255,${alpha.toFixed(3)})`;
  ctx.beginPath();
  ctx.arc(sx, sy, radius, 0, TAU);
  ctx.fill();
  if (radius > 1.1 && rnd() < 0.2) {
    ctx.strokeStyle = `rgba(214,228,255,${(alpha * 0.5).toFixed(3)})`;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(sx - 4, sy);
    ctx.lineTo(sx + 4, sy);
    ctx.moveTo(sx, sy - 4);
    ctx.lineTo(sx, sy + 4);
    ctx.stroke();
  }
}
// 14 meteors streaming away from a radiant beyond the right edge of the page.
const radiant = { x: px + pw * 1.32, y: py - ph * 0.5 };
for (let i = 0; i < 14; i++) {
  let angle = 2.4;
  let hx = 0;
  let hy = 0;
  for (let attempt = 0; attempt < 400; attempt++) {
    angle = range(1.93, 2.95);
    const distance = range(230, 900);
    hx = radiant.x + Math.cos(angle) * distance;
    hy = radiant.y + Math.sin(angle) * distance;
    if (hx > px + 14 && hx < px + pw - 14 && hy > py + 12 && hy < py + ph - 74) break;
  }
  const length = range(30, 94);
  const tx = hx - Math.cos(angle) * length;
  const ty = hy - Math.sin(angle) * length;
  const glow = ctx.createLinearGradient(tx, ty, hx, hy);
  glow.addColorStop(0, 'rgba(120,165,255,0)');
  glow.addColorStop(0.55, `rgba(168,204,255,${range(0.25, 0.5).toFixed(3)})`);
  glow.addColorStop(1, 'rgba(255,250,228,0.98)');
  ctx.strokeStyle = glow;
  ctx.lineWidth = range(1.1, 2.3);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(tx, ty);
  ctx.lineTo(hx, hy);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,252,235,0.95)';
  ctx.beginPath();
  ctx.arc(hx, hy, range(0.9, 1.7), 0, TAU);
  ctx.fill();
}
// Distant ridge, then the near black ridge silhouette.
const ridgeY = py + ph - 62;
ctx.fillStyle = '#0a1126';
ctx.beginPath();
ctx.moveTo(px, py + ph);
ctx.lineTo(px, ridgeY - 2);
for (let x = px; x <= px + pw; x += 22) {
  ctx.lineTo(x, ridgeY - 8 + 7 * Math.sin(x * 0.017));
}
ctx.lineTo(px + pw, py + ph);
ctx.closePath();
ctx.fill();
ctx.fillStyle = '#03050c';
ctx.beginPath();
ctx.moveTo(px, py + ph);
ctx.lineTo(px, ridgeY + 16);
for (let x = px; x <= px + pw; x += 24) {
  ctx.lineTo(x, ridgeY + 14 + 9 * Math.sin(x * 0.023 + 1.1) + range(-5, 5));
}
ctx.lineTo(px + pw, py + ph);
ctx.closePath();
ctx.fill();
// Small observatory dome with one lit amber slit.
const domeX = px + 132;
const domeY = py + ph - 50;
ctx.fillStyle = '#03050c';
ctx.beginPath();
ctx.arc(domeX, domeY, 31, Math.PI, 0);
ctx.lineTo(domeX + 31, domeY + 12);
ctx.lineTo(domeX - 31, domeY + 12);
ctx.closePath();
ctx.fill();
ctx.fillRect(domeX - 39, domeY + 10, 78, 8);
const amber = ctx.createRadialGradient(domeX + 9, domeY - 19, 1, domeX + 9, domeY - 19, 26);
amber.addColorStop(0, 'rgba(255,184,76,0.35)');
amber.addColorStop(1, 'rgba(255,184,76,0)');
ctx.fillStyle = amber;
ctx.fillRect(domeX - 20, domeY - 45, 60, 55);
ctx.fillStyle = '#ffb346';
ctx.beginPath();
ctx.moveTo(domeX + 7, domeY - 29);
ctx.lineTo(domeX + 15, domeY - 26);
ctx.lineTo(domeX + 19, domeY - 1);
ctx.lineTo(domeX + 12, domeY - 1);
ctx.closePath();
ctx.fill();
ctx.restore();
ctx.strokeStyle = 'rgba(217,184,117,0.55)';
ctx.lineWidth = 1;
ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);
text('ILLUSTRATION / SKY DESK', px + pw - 10, py + ph - 12, `10px ${SANS}`, 'rgba(226,232,255,0.45)', 'right');

// --- Deck --------------------------------------------------------------------
paragraph(
  'Sky watchers get a moonless window after midnight; up to 120 meteors per hour expected',
  40, 528, 650, `bold 18px ${SERIF}`, PAPER, 24
);
rule(40, 588, 690, 'rgba(226,232,255,0.25)');
text('THE SHOWER PEAKS ANNUALLY IN MID-DECEMBER; THIS YEAR THE MOON IS NEW ON DEC. 9.',
  40, 608, `11px ${SANS}`, 'rgba(226,232,255,0.55)');

// --- Right column: how to watch ---------------------------------------------
const cx = 712;
const cw = 448;
const boxTop = 266;
const boxHeight = 154;
ctx.fillStyle = 'rgba(6,11,28,0.75)';
ctx.fillRect(cx, boxTop, cw, boxHeight);
ctx.strokeStyle = GOLD;
ctx.lineWidth = 1;
ctx.strokeRect(cx + 0.5, boxTop + 0.5, cw - 1, boxHeight - 1);
text('HOW TO WATCH', cx + 16, boxTop + 28, `bold 20px ${SERIF}`, GOLD);
rule(cx + 16, boxTop + 38, cx + cw - 16, 'rgba(217,184,117,0.45)');
const guide = [
  ['RADIANT', 'Gemini — trace each trail back to the twin stars'],
  ['BEST TIME', 'After local midnight, when the sky is darkest'],
  ['LOOK', 'Away from city light; allow 20 minutes to adapt'],
];
guide.forEach(([label, value], i) => {
  const y = boxTop + 62 + i * 30;
  text(label, cx + 16, y, `bold 10px ${SANS}`, GOLD);
  text(value, cx + 102, y, `13px ${SANS}`, PAPER);
});

// --- Right column: world wire briefs ----------------------------------------
text('WORLD WIRE', cx, 450, `bold 17px ${SERIF}`, PAPER);
text('21 NOVEMBER 2026', cx + cw, 450, `10px ${SANS}`, GOLD, 'right');
rule(cx, 458, cx + cw, 'rgba(226,232,255,0.45)');
const briefs = [
  {
    title: 'COP31 TALKS RUN INTO SATURDAY',
    body: 'Antalya negotiators seek a revised deal after fossil-fuel language vanished from the draft text.',
  },
  {
    title: 'TECH SHARES SEEN STEADYING',
    body: 'Traders eye Monday after a 5.3% Nasdaq slide; the S&P 500 and Dow both sit in correction.',
  },
  {
    title: 'ISS CREW KEEPS SCIENCE WATCH',
    body: "Expedition 75's seven aboard press on with research after Cargo Dragon's departure.",
  },
];
briefs.forEach((brief, i) => {
  const y = 482 + i * 53;
  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.arc(cx + 4, y - 4, 2.4, 0, TAU);
  ctx.fill();
  text(brief.title, cx + 15, y, `bold 14px ${SERIF}`, PAPER);
  text('21 NOV', cx + cw, y, `10px ${SANS}`, GOLD, 'right');
  paragraph(brief.body, cx + 15, y + 16, cw - 22, `12.5px ${SANS}`, 'rgba(226,232,255,0.78)', 15);
});

// --- Footer ------------------------------------------------------------------
ctx.fillStyle = 'rgba(3,5,12,0.72)';
ctx.fillRect(0, 634, WIDTH, 41);
rule(0, 634, WIDTH, 'rgba(217,184,117,0.55)');
tracked(
  'THE NIGHT SKY HERALD - DETERMINISTIC EDITION - SEE GENERATOR.JS',
  WIDTH / 2, 661, `bold 11px ${SANS}`, 'rgba(242,244,255,0.85)', 1.1
);

// --- Judge gate: compose the 1200x675 poster onto a 1024x1024 canvas ---------
// The competition's gate requires the output to be within 1024x1024 pixels,
// so the poster is scaled uniformly (1024x576) and centred on the same
// deep-night gradient, with equal bands above and below it. Still fully
// deterministic: no randomness is involved in the composition step.
const composed = createCanvas(1024, 1024);
const out = composed.getContext('2d');
const banner = out.createLinearGradient(0, 0, 0, 1024);
banner.addColorStop(0, '#0b1026');
banner.addColorStop(1, '#18234d');
out.fillStyle = banner;
out.fillRect(0, 0, 1024, 1024);
out.drawImage(canvas, 0, 224, 1024, 576); // uniform scale of the 16:9 poster

const outputDir = path.join(__dirname, 'out');
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, 'news.png'), composed.toBuffer('image/png'));
