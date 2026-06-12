import {
  ADVANCED_TUTORIAL_IDS,
  COMPOSITE_PREVIEWS,
  FROGGER_ATLAS,
  FROGGER_SHEET_URL,
  REQUIRED_TUTORIAL_IDS
} from "./assets/frogger-atlas.js?v=20260510-attract-credits";

const canvas = document.querySelector("#atlas-preview");
const ctx = canvas.getContext("2d");
const sheet = new Image();
const SCALE = 4;
const CELL_W = 178;
const CELL_H = 94;

ctx.imageSmoothingEnabled = false;

sheet.src = FROGGER_SHEET_URL;
sheet.addEventListener("load", render);
sheet.addEventListener("error", () => {
  ctx.fillStyle = "#fff";
  ctx.font = "16px monospace";
  ctx.fillText(`Failed to load ${FROGGER_SHEET_URL}`, 24, 36);
});

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawTitle("Required Tutorial Sprite IDs", 24, 34);

  REQUIRED_TUTORIAL_IDS.forEach((id, index) => {
    const col = index % 5;
    const row = Math.floor(index / 5);
    drawCell(id, 24 + col * CELL_W, 54 + row * CELL_H);
  });

  const compositesY = 54 + Math.ceil(REQUIRED_TUTORIAL_IDS.length / 5) * CELL_H + 34;
  drawTitle("Advanced Gameplay Sprites", 24, compositesY);
  ADVANCED_TUTORIAL_IDS.forEach((id, index) => {
    const col = index % 5;
    const row = Math.floor(index / 5);
    drawCell(id, 24 + col * CELL_W, compositesY + 20 + row * CELL_H);
  });

  const compositeY = compositesY + Math.ceil(ADVANCED_TUTORIAL_IDS.length / 5) * CELL_H + 48;
  drawTitle("Composite Checks", 24, compositeY);
  COMPOSITE_PREVIEWS.forEach((preview, index) => {
    drawComposite(preview, 24, compositeY + 22 + index * 62);
  });
}

function drawTitle(text, x, y) {
  ctx.fillStyle = "#f3f3f5";
  ctx.font = "18px monospace";
  ctx.fillText(text, x, y);
}

function drawCell(id, x, y) {
  const sprite = FROGGER_ATLAS[id];
  drawPanel(x, y, CELL_W - 12, CELL_H - 12);
  ctx.fillStyle = "#f3f3f5";
  ctx.font = "13px monospace";
  ctx.fillText(fitText(`#${id} ${sprite.name}`, 23), x + 8, y + 17);
  ctx.fillStyle = "#a8a8b2";
  ctx.font = "10px monospace";
  ctx.fillText(sprite.role, x + 8, y + 32);
  const scale = sprite.size[0] > 16 ? 2 : SCALE;
  drawSprite(id, x + 8, y + 39, scale);
  ctx.strokeStyle = "#42e66b";
  ctx.strokeRect(x + 8.5, y + 39.5, sprite.size[0] * scale, sprite.size[1] * scale);
}

function fitText(text, maxChars) {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars - 3)}...`;
}

function drawComposite(preview, x, y) {
  drawPanel(x, y, 960, 52);
  ctx.fillStyle = "#f3f3f5";
  ctx.font = "13px monospace";
  ctx.fillText(preview.name, x + 8, y + 17);
  ctx.fillStyle = "#a8a8b2";
  ctx.font = "10px monospace";
  ctx.fillText(preview.description, x + 8, y + 34);

  let px = x + 260;
  preview.ids.forEach((id) => {
    const sprite = FROGGER_ATLAS[id];
    drawSprite(id, px, y + 8, 2);
    px += sprite.size[0] * 2;
  });
}

function drawPanel(x, y, w, h) {
  ctx.fillStyle = "#111119";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "#33333d";
  ctx.strokeRect(x + 0.5, y + 0.5, w, h);
}

function drawSprite(id, x, y, scale = 1) {
  const sprite = FROGGER_ATLAS[id];
  const [sx, sy, sw, sh] = sprite.source;
  const [dw, dh] = sprite.size;
  const [renderW, renderH, offsetX, offsetY] = sprite.render ?? fitSprite(sw, sh, dw, dh);
  const fittedW = renderW * scale;
  const fittedH = renderH * scale;
  const dx = Math.round(x + offsetX * scale);
  const dy = Math.round(y + offsetY * scale);
  ctx.drawImage(sheet, sx, sy, sw, sh, dx, dy, fittedW, fittedH);
}

function fitSprite(sw, sh, tileW, tileH) {
  const fit = Math.min(tileW / sw, tileH / sh);
  const drawW = Math.round(sw * fit);
  const drawH = Math.round(sh * fit);
  return [
    drawW,
    drawH,
    Math.round((tileW - drawW) / 2),
    Math.round((tileH - drawH) / 2)
  ];
}
