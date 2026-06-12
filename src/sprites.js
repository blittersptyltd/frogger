import { FROGGER_ATLAS, FROGGER_SHEET_URL } from "./assets/frogger-atlas.js?v=20260510-attract-credits";

export function loadSpriteSheet() {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image), { once: true });
    image.addEventListener("error", () => reject(new Error(`Failed to load ${FROGGER_SHEET_URL}`)), { once: true });
    image.src = FROGGER_SHEET_URL;
  });
}

export function drawSprite(ctx, sheet, id, x, y, options = {}) {
  const sprite = FROGGER_ATLAS[id];
  if (!sprite) return;

  const tileW = options.width ?? sprite.size[0];
  const tileH = options.height ?? sprite.size[1];
  const [sx, sy, sw, sh] = sprite.source;
  const hasCustomSize = options.width !== undefined || options.height !== undefined;
  const [drawW, drawH, offsetX, offsetY] = !hasCustomSize && sprite.render
    ? sprite.render
    : fitSprite(sw, sh, tileW, tileH);

  ctx.save();
  ctx.translate(Math.round(x + tileW / 2), Math.round(y + tileH / 2));
  if (options.angle) ctx.rotate(options.angle);
  if (options.flipX) ctx.scale(-1, 1);
  ctx.drawImage(
    sheet,
    sx,
    sy,
    sw,
    sh,
    Math.round(-tileW / 2 + offsetX),
    Math.round(-tileH / 2 + offsetY),
    drawW,
    drawH
  );
  ctx.restore();
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
