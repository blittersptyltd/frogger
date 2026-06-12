import { DIRS, HEIGHT, HOMES, HOME_TOLERANCE, WIDTH, levelTimeMax } from "./constants.js?v=20260510-attract-credits";
import { drawSprite } from "./sprites.js?v=20260510-attract-credits";

export function createRenderer(canvas, sheet) {
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  return { canvas, ctx, sheet };
}

export function render(renderer, state, frameData) {
  const { ctx, sheet } = renderer;
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  drawBackground(ctx, sheet, state);
  drawObjects(ctx, sheet, frameData.river);
  drawPassengers(ctx, sheet, frameData.passengers);
  drawSnakes(ctx, sheet, frameData.snakes);
  drawObjects(ctx, sheet, frameData.road);
  drawFrog(ctx, sheet, state);
  drawCollisionOverlay(ctx, state, frameData);
  drawHud(ctx, sheet, state);
  drawOverlay(ctx, sheet, state);
}

function drawBackground(ctx, sheet, state) {
  ctx.fillStyle = "#010648";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = "#010648";
  ctx.fillRect(0, 0, WIDTH, 128);

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 144, WIDTH, 80);

  drawHomeBank(ctx, sheet, state);
  drawSafeStrip(ctx, sheet, 128, 16);
  drawSafeStrip(ctx, sheet, 224, 16);

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 240, WIDTH, 16);
}

function drawHomeBank(ctx, sheet, state) {
  drawGrassBank(ctx, sheet, 24, 24);

  HOMES.forEach((homeX, index) => {
    ctx.drawImage(sheet, 0, 188, 35, 23, homeX - 25, 24, 35, 24);
    ctx.fillStyle = "#010648";
    ctx.fillRect(homeX - 10, 32, 20, 16);
    if (state.bonusFly.homeIndex === index && state.bonusFly.ticksRemaining > 0 && !state.homes[index]) {
      drawSprite(ctx, sheet, 70, homeX - 8, 32);
    }
    if (state.homeHazard.homeIndex === index && state.homeHazard.ticksRemaining > 0 && !state.homes[index]) {
      const id = Math.floor(state.t / 24) % 2 ? 76 : 72;
      ctx.save();
      ctx.beginPath();
      ctx.rect(homeX - 10, 32, 20, 16);
      ctx.clip();
      drawSprite(ctx, sheet, id, homeX - 8, 32);
      ctx.restore();
    }
    if (state.homes[index]) drawHomeFrog(ctx, sheet, homeX);
  });
}

function drawHomeFrog(ctx, sheet, homeX) {
  drawSprite(ctx, sheet, 63, homeX - 6, 34, { width: 12, height: 12, angle: DIRS.up.angle });
}

function drawGrassBank(ctx, sheet, y, h) {
  drawSpeckledRect(ctx, 0, y, WIDTH, h, "#18ce45", [
    "#06125d",
    "#7b3516",
    "#000",
    "#e7783f"
  ]);
}

function drawSafeStrip(ctx, sheet, y, h) {
  for (let x = 0; x < WIDTH; x += 16) {
    ctx.drawImage(sheet, 135, 196, 16, 16, x, y, 16, h);
  }
}

function drawSpeckledRect(ctx, x, y, w, h, base, speckles) {
  ctx.fillStyle = base;
  ctx.fillRect(x, y, w, h);
  for (let py = y; py < y + h; py += 3) {
    for (let px = x; px < x + w; px += 4) {
      const index = Math.abs((px * 7 + py * 11) % speckles.length);
      ctx.fillStyle = speckles[index];
      ctx.fillRect(px + ((py / 3) % 2), py + 1, 1, 1);
    }
  }
}

function drawObjects(ctx, sheet, objects) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, WIDTH, HEIGHT);
  ctx.clip();
  objects.forEach((object) => {
    if (!object.visible) return;
    object.pieces.forEach((piece) => {
      if (piece.visible === false) return;
      drawObjectPiece(ctx, sheet, object, piece);
    });
  });
  ctx.restore();
}

function drawObjectPiece(ctx, sheet, object, piece) {
  drawSprite(ctx, sheet, piece.id, object.x + piece.ox, displayY(object));
}

function drawPassengers(ctx, sheet, passengers) {
  passengers.forEach((passenger) => {
    drawSprite(ctx, sheet, 71, passenger.x, displayY(passenger));
  });
}

function drawSnakes(ctx, sheet, snakes) {
  snakes.forEach((snake) => {
    drawSprite(ctx, sheet, snake.id, snake.x, snake.displayY);
  });
}

function displayY(object) {
  if (object.y >= 152) return object.y - 8;
  if (object.y >= 56 && object.y <= 120) return object.y - 8;
  return object.y;
}

function drawFrog(ctx, sheet, state) {
  const frog = state.frog;
  const homeX = enteringHomeX(frog);
  if (!frog.dying && homeX !== null) {
    drawHomeFrog(ctx, sheet, homeX);
    return;
  }

  const y = displayFrogY(frog);
  if (frog.dying) {
    const sequence = [31, 32, 33, 30];
    const id = sequence[Math.min(3, Math.floor(frog.dying / 16))];
    drawSprite(ctx, sheet, id, frog.x, y, { angle: DIRS[frog.face].angle });
    return;
  }

  const leapSequence = [2, 2, 1, 1, 0, 0, 0, 0];
  const id = frog.leaping ? leapSequence[Math.max(0, Math.min(7, frog.leaping - 2))] : 2;
  if (state.passenger.collected) drawCarriedPassenger(ctx, sheet, frog, y);
  drawSprite(ctx, sheet, id, frog.x, y, { angle: DIRS[frog.face].angle });
}

function drawCarriedPassenger(ctx, sheet, frog, y) {
  const offsets = {
    up: { x: 2, y: -1 },
    down: { x: 2, y: 4 },
    left: { x: -1, y: 2 },
    right: { x: 5, y: 2 }
  };
  const offset = offsets[frog.face] ?? offsets.up;
  drawSprite(ctx, sheet, 71, frog.x + offset.x, y + offset.y, { width: 12, height: 12, angle: DIRS[frog.face].angle });
}

function enteringHomeX(frog) {
  if (!frog.leaping || frog.dir !== "up" || frog.y > 48) return null;
  const frogCenterX = frog.x + 8;
  const homeX = HOMES.find((candidate) => Math.abs(candidate - frogCenterX) <= HOME_TOLERANCE);
  return homeX ?? null;
}

function drawCollisionOverlay(ctx, state, frameData) {
  if (!state.debugCollision) return;

  ctx.save();
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.85;
  drawRects(ctx, frameData.river.filter((object) => object.support), "#2cecff");
  drawRects(ctx, frameData.road, "#ff3636");
  drawRects(ctx, frameData.snakes, "#f6ff2c");
  ctx.strokeStyle = "#fff45c";
  ctx.strokeRect(state.frog.x + 0.5, displayFrogY(state.frog) + 0.5, 15, 15);
  ctx.restore();
}

function drawRects(ctx, objects, color) {
  ctx.strokeStyle = color;
  objects.forEach((object) => {
    ctx.strokeRect(object.x + 0.5, displayY(object) + 0.5, object.width - 1, object.height - 1);
  });
}

function displayFrogY(frog) {
  return frog.y >= 136 ? frog.y - 8 : frog.y > 40 ? frog.y - 8 : frog.y;
}

function drawHud(ctx, sheet, state) {
  ctx.fillStyle = "#010648";
  ctx.fillRect(0, 0, WIDTH, 16);
  drawText(ctx, sheet, "1-UP", 18, 0, "grey");
  drawText(ctx, sheet, "HI-SCORE", 80, 0, "grey");
  drawText(ctx, sheet, `L${state.level}`, 198, 0, "grey");
  drawText(ctx, sheet, String(state.score).padStart(5, "0"), 18, 8, "red");
  drawText(ctx, sheet, String(state.high).padStart(5, "0"), 98, 8, "red");
  drawText(ctx, sheet, "TIME", 190, 247, "yellow");
  ctx.fillStyle = "#13d530";
  ctx.fillRect(80, 247, Math.ceil(108 * state.timeRemaining / levelTimeMax(state.level)), 6);
  for (let i = 0; i < Math.max(0, state.lives - 1); i += 1) {
    drawSprite(ctx, sheet, 63, 2 + i * 9, 242, { width: 8, height: 10, angle: DIRS.up.angle });
  }
}

function drawText(ctx, sheet, text, x, y, color) {
  const rows = {
    grey: 250,
    yellow: 278,
    red: 306
  };
  let cx = x;
  for (const char of text) {
    if (char === " ") {
      cx += 9;
      continue;
    }
    const pos = glyphPosition(char);
    if (pos) ctx.drawImage(sheet, pos.x, rows[color] + pos.row * 9, 9, 9, cx, y, 9, 9);
    cx += 9;
  }
}

function glyphPosition(char) {
  const rows = [
    "0123456789ABCDEFG",
    "HIJKLMNOPQRSTUVWX",
    "YZ-@"
  ];
  for (let row = 0; row < rows.length; row += 1) {
    const col = rows[row].indexOf(char);
    if (col !== -1) return { x: col * 9, row };
  }
  return null;
}

function drawOverlay(ctx, sheet, state) {
  if (state.mode === "attract") {
    drawOverlayBand(ctx, 86, 96);
    drawOverlayBand(ctx, 126, 64);
    drawOverlayBand(ctx, 150, 84);
    drawText(ctx, sheet, "FROGGER", 88, 96, "yellow");
    drawText(ctx, sheet, state.credits > 0 ? "PRESS START" : "INSERT COIN", state.credits > 0 ? 74 : 78, 136, "red");
    drawText(ctx, sheet, "5 COIN", 92, 160, "grey");
    drawText(ctx, sheet, `CREDIT ${String(state.credits).padStart(2, "0")}`, 80, 176, "grey");
    return;
  }
  if (state.mode === "demo") {
    drawOverlayBand(ctx, 126, 64);
    drawText(ctx, sheet, "DEMO", 102, 136, "yellow");
    if (state.credits > 0) drawText(ctx, sheet, "PRESS START", 74, 152, "red");
    return;
  }
  if (state.mode === "levelclear") {
    drawText(ctx, sheet, `LEVEL ${state.level + 1}`, 86, 136, "yellow");
    if (state.levelClearBonus) drawText(ctx, sheet, `BONUS ${state.levelClearBonus}`, 80, 152, "red");
    return;
  }
  if (state.mode === "gameover") {
    drawOverlayBand(ctx, 126, 84);
    drawText(ctx, sheet, "GAME OVER", 80, 136, "red");
    drawText(ctx, sheet, state.credits > 0 ? "PRESS START" : "INSERT COIN", state.credits > 0 ? 74 : 78, 152, "yellow");
    drawText(ctx, sheet, `CREDIT ${String(state.credits).padStart(2, "0")}`, 80, 168, "grey");
    return;
  }
  if (state.mode === "playing" && state.readyTicks) {
    drawText(ctx, sheet, "READY", 98, 136, "yellow");
  }
}

function drawOverlayBand(ctx, y, h) {
  ctx.fillStyle = "#000";
  ctx.fillRect(52, y - 4, 136, h);
}
