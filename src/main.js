// Legacy entrypoint replaced by module implementation below.
(() => {
  const canvas = document.querySelector("#game");
  const ctx = canvas.getContext("2d");
  const startButton = document.querySelector("#start");
  const muteButton = document.querySelector("#mute");

  const W = 224;
  const H = 256;
  const TILE = 16;
  const START_X = 120;
  const START_Y = 232;
  const HOME_X = [24, 72, 120, 168, 216];
  const HOME_Y = 24;
  const ROWS = {
    homes: 24,
    riverTop: 40,
    riverBottom: 120,
    roadTop: 136,
    start: 232
  };

  const sheet = new Image();
  sheet.src = "public/images/11067.png";

  ctx.imageSmoothingEnabled = false;

  const sprites = {
    frog0: [0, 0, 18, 18],
    frog1: [18, 0, 18, 18],
    frog2: [36, 0, 18, 18],
    frogDeath0: [0, 36, 18, 18],
    frogDeath1: [18, 36, 18, 18],
    frogDeath2: [36, 36, 18, 18],
    frogDeath3: [54, 36, 18, 18],
    yellowCar: [18, 116, 18, 16],
    dozer: [0, 116, 18, 16],
    truckCab: [74, 116, 31, 16],
    purpleCar: [18, 136, 18, 16],
    raceCar: [36, 116, 18, 16],
    turtle0: [0, 154, 18, 14],
    turtle1: [18, 154, 18, 14],
    turtle2: [36, 154, 18, 14],
    logShort: [56, 134, 48, 16],
    logLong: [106, 134, 48, 16],
    homeFrog: [90, 0, 18, 18]
  };

  const state = {
    mode: "ready",
    score: 0,
    high: Number(localStorage.getItem("frogger-high") || 0),
    lives: 4,
    time: 120,
    level: 1,
    done: [false, false, false, false, false],
    frog: null,
    tick: 0,
    last: 0,
    muted: false,
    audio: null,
    lanes: []
  };

  const CONTROL = {
    ArrowLeft: "left",
    ArrowRight: "right",
    ArrowUp: "up",
    ArrowDown: "down",
    KeyA: "left",
    KeyD: "right",
    KeyW: "up",
    KeyS: "down"
  };

  function resetFrog() {
    state.frog = {
      x: START_X,
      y: START_Y,
      fromX: START_X,
      fromY: START_Y,
      toX: START_X,
      toY: START_Y,
      dir: "up",
      leap: 0,
      dying: 0
    };
    state.time = 120;
  }

  function resetLevel() {
    state.done = [false, false, false, false, false];
    resetFrog();
  }

  function newGame() {
    state.mode = "playing";
    state.score = 0;
    state.lives = 4;
    state.level = 1;
    state.tick = 0;
    buildLanes();
    resetLevel();
  }

  function buildLanes() {
    const levelBoost = Math.min(0.6, (state.level - 1) * 0.06);
    state.lanes = [
      riverLane(56, 0.50 + levelBoost, [0, 70, 140, 210], 64, "mediumLog"),
      riverLane(72, -0.50 - levelBoost, [0, 50, 100, 150, 200], 32, "turtle2"),
      riverLane(88, 1.25 + levelBoost, [0, 128], 112, "longLog"),
      riverLane(104, 1.00 + levelBoost, [0, 80, 160], 48, "shortLog"),
      riverLane(120, -1.00 - levelBoost, [0, 64, 128, 192], 48, "turtle3"),
      roadLane(152, -0.50 - levelBoost, [0, 100], 32, "truckCab"),
      roadLane(168, 2.00 + levelBoost, [0], 16, "raceCar"),
      roadLane(184, -1.00 - levelBoost, [0, 75, 150], 16, "purpleCar"),
      roadLane(200, 1.00 + levelBoost, [0, 50, 150], 16, "dozer"),
      roadLane(216, -1.00 - levelBoost, [0, 128], 16, "yellowCar")
    ];
  }

  function riverLane(y, speed, starts, width, kind) {
    return { section: "river", y, speed, starts, width, kind };
  }

  function roadLane(y, speed, starts, width, kind) {
    return { section: "road", y, speed, starts, width, kind };
  }

  function wrappedX(base, speed, tick, width) {
    const span = W + width + 32;
    let x = base + speed * tick;
    x = ((x + width + 16) % span + span) % span;
    return x - width - 16;
  }

  function laneItems(lane) {
    return lane.starts.map((start) => ({
      x: wrappedX(start, lane.speed, state.tick, lane.width),
      y: lane.y,
      w: lane.width,
      h: 16,
      lane
    }));
  }

  function rectsTouch(a, b, inset = 2) {
    return a.x + inset < b.x + b.w - inset &&
      a.x + a.w - inset > b.x + inset &&
      a.y + inset < b.y + b.h - inset &&
      a.y + a.h - inset > b.y + inset;
  }

  function frogRect() {
    return { x: state.frog.x, y: state.frog.y, w: 16, h: 16 };
  }

  function jump(dir) {
    if (state.mode !== "playing" || state.frog.leap || state.frog.dying) return;
    const f = state.frog;
    f.fromX = f.x;
    f.fromY = f.y;
    f.toX = f.x;
    f.toY = f.y;
    f.dir = dir;
    if (dir === "left") f.toX -= TILE;
    if (dir === "right") f.toX += TILE;
    if (dir === "up") f.toY -= TILE;
    if (dir === "down") f.toY += TILE;
    f.leap = 1;
    state.score += 10;
    beep(520, 0.045);
  }

  function startDeath() {
    if (state.frog.dying) return;
    state.frog.dying = 1;
    beep(150, 0.28);
  }

  function update() {
    if (state.mode !== "playing") return;
    state.tick += 1;
    state.time -= 1 / 60;
    if (state.time <= 0) startDeath();

    const f = state.frog;
    if (f.dying) {
      f.dying += 1;
      if (f.dying >= 64) {
        state.lives -= 1;
        if (state.lives <= 0) {
          finishGame();
        } else {
          resetFrog();
        }
      }
      return;
    }

    if (f.leap) {
      const p = Math.min(1, f.leap / 8);
      f.x = Math.round(f.fromX + (f.toX - f.fromX) * p);
      f.y = Math.round(f.fromY + (f.toY - f.fromY) * p);
      f.leap += 1;
      if (f.leap > 8) {
        f.x = f.toX;
        f.y = f.toY;
        f.leap = 0;
        checkLanding();
      }
      return;
    }

    checkHazards();
  }

  function checkLanding() {
    const f = state.frog;
    if (f.x < 0 || f.x > W - 16 || f.y > H - 16) {
      startDeath();
      return;
    }

    if (f.y <= HOME_Y) {
      let landed = false;
      HOME_X.forEach((homeX, i) => {
        if (!state.done[i] && Math.abs(homeX - f.x) <= 8) {
          state.done[i] = true;
          state.score += 50 + Math.floor(state.time);
          landed = true;
        }
      });
      if (!landed) {
        startDeath();
        return;
      }
      if (state.done.every(Boolean)) {
        state.level += 1;
        state.score += 1000;
        buildLanes();
        resetLevel();
      } else {
        resetFrog();
      }
      return;
    }

    checkHazards();
  }

  function checkHazards() {
    const f = state.frog;
    if (f.x < 0 || f.x > W - 16) {
      startDeath();
      return;
    }

    const frog = frogRect();
    if (f.y >= ROWS.roadTop && f.y <= 216) {
      for (const lane of state.lanes.filter((l) => l.section === "road")) {
        if (Math.abs(lane.y - f.y) < 10) {
          for (const item of laneItems(lane)) {
            if (rectsTouch(frog, item, 3)) {
              startDeath();
              return;
            }
          }
        }
      }
    } else if (f.y >= ROWS.riverTop && f.y <= ROWS.riverBottom) {
      let support = null;
      for (const lane of state.lanes.filter((l) => l.section === "river")) {
        if (Math.abs(lane.y - f.y) < 10) {
          for (const item of laneItems(lane)) {
            if (rectsTouch(frog, item, 1)) support = item;
          }
        }
      }
      if (!support) {
        startDeath();
      } else {
        f.x += support.lane.speed;
      }
    }
  }

  function finishGame() {
    state.high = Math.max(state.high, state.score);
    localStorage.setItem("frogger-high", String(state.high));
    state.mode = "gameover";
  }

  function drawSprite(name, x, y, flipX = false, dw = 16, dh = 16) {
    const s = sprites[name];
    if (!s || !sheet.complete) return;
    ctx.save();
    if (flipX) {
      ctx.translate(Math.round(x) + dw, Math.round(y));
      ctx.scale(-1, 1);
      ctx.drawImage(sheet, s[0], s[1], s[2], s[3], 0, 0, dw, dh);
    } else {
      ctx.drawImage(sheet, s[0], s[1], s[2], s[3], Math.round(x), Math.round(y), dw, dh);
    }
    ctx.restore();
  }

  function drawBackground() {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "#003fd2";
    ctx.fillRect(0, 32, W, 96);

    ctx.fillStyle = "#1a0808";
    ctx.fillRect(0, 136, W, 80);

    ctx.fillStyle = "#052706";
    ctx.fillRect(0, 16, W, 16);
    ctx.fillRect(0, 120, W, 16);
    ctx.fillRect(0, 216, W, 24);

    ctx.fillStyle = "#29c949";
    for (let x = 0; x < W; x += 16) {
      ctx.fillRect(x, 16, 8, 4);
      ctx.fillRect(x + 8, 124, 8, 4);
      ctx.fillRect(x, 220, 8, 4);
    }

    ctx.fillStyle = "#000";
    for (const x of HOME_X) {
      ctx.fillRect(x - 10, 16, 20, 16);
    }
    ctx.fillStyle = "#32d352";
    for (let i = 0; i < HOME_X.length; i++) {
      ctx.fillRect(HOME_X[i] - 16, 16, 5, 16);
      ctx.fillRect(HOME_X[i] + 11, 16, 5, 16);
      if (state.done[i]) drawSprite("homeFrog", HOME_X[i] - 8, 24);
    }

    ctx.strokeStyle = "#f5f5f5";
    ctx.setLineDash([6, 10]);
    for (const y of [152, 168, 184, 200]) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  function drawLog(x, y, w, kind) {
    if (w <= 64) {
      drawSprite("logShort", x, y, false, w, 16);
      return;
    }
    for (let px = 0; px < w; px += 48) {
      drawSprite("logLong", x + px, y, false, Math.min(48, w - px), 16);
    }
  }

  function drawTurtles(x, y, w) {
    const frame = ["turtle0", "turtle1", "turtle2"][Math.floor(state.tick / 32) % 3];
    for (let px = 0; px < w; px += 16) drawSprite(frame, x + px, y + 1);
  }

  function drawVehiclesAndRiver() {
    for (const lane of state.lanes) {
      for (const item of laneItems(lane)) {
        if (lane.section === "river") {
          if (lane.kind.includes("Log")) drawLog(item.x, item.y, item.w, lane.kind);
          else drawTurtles(item.x, item.y, item.w);
        } else {
          const flip = lane.speed < 0;
          drawSprite(lane.kind, item.x, item.y, flip, item.w, 16);
        }
      }
    }
  }

  function drawFrog() {
    const f = state.frog;
    if (!f) return;
    if (f.dying) {
      const death = ["frogDeath0", "frogDeath1", "frogDeath2", "frogDeath3"][Math.min(3, Math.floor(f.dying / 16))];
      drawSprite(death, f.x, f.y);
      return;
    }
    const frame = f.leap ? ["frog2", "frog1", "frog0", "frog0", "frog2"][Math.min(4, Math.floor(f.leap / 2))] : "frog2";
    ctx.save();
    ctx.translate(Math.round(f.x + 8), Math.round(f.y + 8));
    ctx.rotate(dirAngle(f.dir));
    drawSpriteAt(frame, -8, -8);
    ctx.restore();
  }

  function drawSpriteAt(name, x, y) {
    const s = sprites[name];
    if (!s || !sheet.complete) return;
    ctx.drawImage(sheet, s[0], s[1], s[2], s[3], Math.round(x), Math.round(y), 16, 16);
  }

  function dirAngle(dir) {
    if (dir === "right") return Math.PI / 2;
    if (dir === "down") return Math.PI;
    if (dir === "left") return -Math.PI / 2;
    return 0;
  }

  function drawHud() {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, 16);
    ctx.fillRect(0, 240, W, 16);
    ctx.fillStyle = "#f3f3f3";
    ctx.font = "8px monospace";
    ctx.fillText(String(state.score).padStart(5, "0"), 2, 9);
    ctx.fillText(`HI ${String(state.high).padStart(5, "0")}`, 72, 9);
    ctx.fillText(`L${state.level}`, 184, 9);
    ctx.fillStyle = "#f3d33b";
    ctx.fillRect(2, 244, Math.max(0, Math.floor(state.time / 120 * 80)), 5);
    for (let i = 0; i < state.lives - 1; i++) drawSprite("frog2", 154 + i * 16, 240);
  }

  function drawOverlay() {
    if (state.mode === "playing") return;
    ctx.fillStyle = "rgba(0, 0, 0, 0.72)";
    ctx.fillRect(0, 88, W, 64);
    ctx.fillStyle = "#31e65f";
    ctx.font = "16px monospace";
    ctx.textAlign = "center";
    ctx.fillText("FROGGER", W / 2, 111);
    ctx.fillStyle = "#fff";
    ctx.font = "8px monospace";
    ctx.fillText(state.mode === "gameover" ? "GAME OVER" : "PRESS START OR ENTER", W / 2, 130);
    ctx.textAlign = "left";
  }

  function render() {
    drawBackground();
    drawVehiclesAndRiver();
    drawFrog();
    drawHud();
    drawOverlay();
  }

  function loop(now) {
    if (!state.last) state.last = now;
    const step = 1000 / 60;
    let elapsed = now - state.last;
    while (elapsed >= step) {
      update();
      elapsed -= step;
      state.last += step;
    }
    render();
    requestAnimationFrame(loop);
  }

  function beep(freq, seconds) {
    if (state.muted) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    if (!state.audio) state.audio = new AudioContext();
    const audio = state.audio;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "square";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.06, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + seconds);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + seconds);
  }

  window.addEventListener("keydown", (event) => {
    if (event.code === "Enter" || event.code === "Space") {
      newGame();
      event.preventDefault();
      return;
    }
    const dir = CONTROL[event.code];
    if (dir) {
      jump(dir);
      event.preventDefault();
    }
  });

  startButton.addEventListener("click", newGame);
  muteButton.addEventListener("click", () => {
    state.muted = !state.muted;
    muteButton.setAttribute("aria-pressed", String(state.muted));
    muteButton.textContent = state.muted ? "Muted" : "Sound";
  });
  document.querySelectorAll("[data-dir]").forEach((button) => {
    button.addEventListener("pointerdown", (event) => {
      jump(button.dataset.dir);
      event.preventDefault();
    });
  });

  sheet.addEventListener("load", () => {
    resetFrog();
    buildLanes();
    requestAnimationFrame(loop);
  });

  sheet.addEventListener("error", () => {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#fff";
    ctx.font = "8px monospace";
    ctx.fillText("Missing public/images/11067.png", 10, 128);
  });
})();
