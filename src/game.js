import { ATTRACT_DEMO_RESET_TICKS, BONUS_FLY_DURATION, BONUS_FLY_SCORE, CROCODILE_DURATION, DEMO_MOVES, DIRS, GAME_OVER_TICKS, HEIGHT, HOMES, HOME_TOLERANCE, HOME_Y, LEVEL_CLEAR_TICKS, LEVEL_CLEAR_TIME_BONUS_DIVISOR, PASSENGER_SCORE, READY_TICKS, START_X, START_Y, TILE, WIDTH, bonusFlySpawnTicks, crocodileSpawnTicks, levelSpeed, levelTimeMax, passengerSpawnTicks, snakeCount } from "./constants.js?v=20260510-attract-credits";
import { riverat, riverObjects, roadObjects } from "./lanes.js?v=20260510-attract-credits";

export function createGame({ motionScale = 1 } = {}) {
  return {
    mode: "attract",
    credits: 0,
    score: 0,
    high: Number(localStorage.getItem("frogger-high") || 0),
    lives: 4,
    level: 1,
    t: 0,
    motionScale: normalizeMotionScale(motionScale),
    attractTicks: 0,
    demoMoveIndex: 0,
    gameOverTicks: 0,
    readyTicks: 0,
    levelClearTicks: 0,
    levelClearBonus: 0,
    timeRemaining: levelTimeMax(1),
    homes: [false, false, false, false, false],
    bonusFly: createBonusFly(1),
    homeHazard: createHomeHazard(1),
    passenger: createPassenger(1),
    frog: createFrog(),
    debugCollision: false,
    soundEvent: null
  };
}

export function startGame(state) {
  if (state.credits <= 0) return false;
  state.credits -= 1;
  resetPlayState(state, "playing");
  return true;
}

export function insertCoin(state) {
  state.credits = Math.min(99, state.credits + 1);
  state.soundEvent = { type: "coin" };
}

function startDemo(state) {
  resetPlayState(state, "demo");
  state.readyTicks = 0;
  state.demoMoveIndex = 0;
}

function resetPlayState(state, mode) {
  state.mode = mode;
  state.score = 0;
  state.lives = 4;
  state.level = 1;
  state.t = 0;
  state.readyTicks = READY_TICKS;
  state.levelClearTicks = 0;
  state.levelClearBonus = 0;
  state.timeRemaining = levelTimeMax(state.level);
  state.homes = [false, false, false, false, false];
  state.bonusFly = createBonusFly(state.level);
  state.homeHazard = createHomeHazard(state.level);
  state.passenger = createPassenger(state.level);
  state.frog = createFrog();
  state.gameOverTicks = 0;
}

export function requestMove(state, dir) {
  const frog = state.frog;
  if (state.mode !== "playing" || state.readyTicks || frog.dying || frog.leaping) return;
  if (!DIRS[dir]) return;

  frog.dir = dir;
  frog.face = dir;
  frog.leaping = 1;
  state.score += 10;
  state.soundEvent = { type: "leap", step: 1 };
}

export function updateGame(state) {
  state.soundEvent = null;

  if (state.mode === "attract") {
    updateAttract(state);
    return;
  }

  if (state.mode === "demo") {
    updateDemo(state);
    return;
  }

  if (state.mode === "levelclear") {
    state.levelClearTicks -= 1;
    if (state.levelClearTicks <= 0) startNextLevel(state);
    return;
  }

  if (state.mode === "gameover") {
    state.gameOverTicks -= 1;
    if (state.gameOverTicks <= 0) state.mode = "attract";
    return;
  }

  if (state.mode !== "playing") return;

  updatePlayingFrame(state, { demo: false });
}

function updatePlayingFrame(state, { demo }) {
  state.t += 1;
  const frog = state.frog;

  if (state.readyTicks) {
    state.readyTicks -= 1;
    return;
  }

  if (frog.dying) {
    frog.dying += 1;
    if (!demo) state.soundEvent = { type: "dying", step: frog.dying };
    if (frog.dying > 64) {
      if (demo) {
        state.mode = "attract";
        state.attractTicks = 0;
        state.frog = createFrog();
        return;
      }
      state.lives -= 1;
      if (state.lives <= 0) {
        state.high = Math.max(state.high, state.score);
        localStorage.setItem("frogger-high", String(state.high));
        state.mode = "gameover";
        state.gameOverTicks = GAME_OVER_TICKS;
      } else {
        resetFrog(state);
      }
    }
    return;
  }

  if (demo) {
    clearBonusFly(state);
    clearHomeHazard(state);
    clearPassenger(state);
  } else {
    updateBonusFly(state);
    updateHomeHazard(state);
    updatePassenger(state);
  }

  if (!demo) state.timeRemaining = Math.max(0, state.timeRemaining - 1);
  if (!demo && state.timeRemaining === 0) {
    startDeath(state);
    return;
  }

  if (frog.leaping) {
    const dir = DIRS[frog.dir];
    frog.x += dir.dx * 2;
    frog.y += dir.dy * 2;
    if (!demo) state.soundEvent = { type: "leap", step: frog.leaping };
    frog.leaping += 1;
    if (frog.leaping > 8) {
      frog.leaping = 0;
      frog.x = Math.round((frog.x - (START_X % TILE)) / TILE) * TILE + (START_X % TILE);
      frog.y = Math.round((frog.y - (START_Y % TILE)) / TILE) * TILE + (START_Y % TILE);
      if (!demo) checkLanding(state);
    }
    return;
  }

  if (demo) return;
  checkHazards(state);
}

export function getFrameData(state) {
  const pacedLaneTime = laneTime(state);
  return {
    road: roadObjects(pacedLaneTime, state.level),
    river: riverObjects(pacedLaneTime, state.level),
    passengers: state.passenger.active ? passengerObjects(state) : [],
    snakes: snakeObjects(state)
  };
}

function updateAttract(state) {
  state.t += 1;
  state.attractTicks += 1;
  if (state.attractTicks >= 240) startDemo(state);
}

function updateDemo(state) {
  if (state.t >= ATTRACT_DEMO_RESET_TICKS || state.frog.dying) {
    state.mode = "attract";
    state.attractTicks = 0;
    state.frog = createFrog();
    return;
  }

  if (!state.frog.leaping && state.t % 48 === 0) {
    requestDemoMove(state);
  }

  updatePlayingFrame(state, { demo: true });
}

function requestDemoMove(state) {
  const dir = DEMO_MOVES[state.demoMoveIndex % DEMO_MOVES.length];
  state.demoMoveIndex += 1;
  const frog = state.frog;
  if (!DIRS[dir] || frog.dying || frog.leaping) return;
  frog.dir = dir;
  frog.face = dir;
  frog.leaping = 1;
}

function createFrog() {
  return { x: START_X, y: START_Y, leaping: 0, dir: "up", face: "up", dying: 0 };
}

function createBonusFly(level) {
  return { homeIndex: null, ticksRemaining: 0, nextSpawnTicks: bonusFlySpawnTicks(level) };
}

function createHomeHazard(level) {
  return { homeIndex: null, ticksRemaining: 0, nextSpawnTicks: crocodileSpawnTicks(level) };
}

function updateBonusFly(state) {
  if (state.level < 2) {
    clearBonusFly(state);
    return;
  }

  if (state.bonusFly.homeIndex !== null) {
    state.bonusFly.ticksRemaining -= 1;
    if (state.bonusFly.ticksRemaining <= 0 || state.homes[state.bonusFly.homeIndex]) clearBonusFly(state);
    return;
  }

  state.bonusFly.nextSpawnTicks -= 1;
  if (state.bonusFly.nextSpawnTicks <= 0) spawnBonusFly(state);
}

function spawnBonusFly(state) {
  const openHomes = state.homes
    .map((filled, index) => filled ? null : index)
    .filter((index) => index !== null && !hasHomeHazard(state, index));

  if (!openHomes.length) {
    clearBonusFly(state);
    return;
  }

  const choice = Math.abs(Math.floor(state.t + state.level)) % openHomes.length;
  state.bonusFly.homeIndex = openHomes[choice];
  state.bonusFly.ticksRemaining = BONUS_FLY_DURATION;
  state.bonusFly.nextSpawnTicks = bonusFlySpawnTicks(state.level);
}

function clearBonusFly(state) {
  state.bonusFly.homeIndex = null;
  state.bonusFly.ticksRemaining = 0;
  state.bonusFly.nextSpawnTicks = bonusFlySpawnTicks(state.level);
}

function hasBonusFly(state, homeIndex) {
  return state.bonusFly.homeIndex === homeIndex && state.bonusFly.ticksRemaining > 0;
}

function updateHomeHazard(state) {
  if (state.level < 3) {
    clearHomeHazard(state);
    return;
  }

  if (state.homeHazard.homeIndex !== null) {
    state.homeHazard.ticksRemaining -= 1;
    if (state.homeHazard.ticksRemaining <= 0 || state.homes[state.homeHazard.homeIndex]) clearHomeHazard(state);
    return;
  }

  state.homeHazard.nextSpawnTicks -= 1;
  if (state.homeHazard.nextSpawnTicks <= 0) spawnHomeHazard(state);
}

function spawnHomeHazard(state) {
  const openHomes = state.homes
    .map((filled, index) => filled ? null : index)
    .filter((index) => index !== null && state.bonusFly.homeIndex !== index);

  if (!openHomes.length) {
    clearHomeHazard(state);
    return;
  }

  const choice = Math.abs(Math.floor(state.t + state.level + 2)) % openHomes.length;
  state.homeHazard.homeIndex = openHomes[choice];
  state.homeHazard.ticksRemaining = CROCODILE_DURATION;
  state.homeHazard.nextSpawnTicks = crocodileSpawnTicks(state.level);
}

function clearHomeHazard(state) {
  state.homeHazard.homeIndex = null;
  state.homeHazard.ticksRemaining = 0;
  state.homeHazard.nextSpawnTicks = crocodileSpawnTicks(state.level);
}

function hasHomeHazard(state, homeIndex) {
  return state.homeHazard.homeIndex === homeIndex && state.homeHazard.ticksRemaining > 0;
}

function awardLevelClearBonus(state) {
  state.levelClearBonus = Math.floor(state.timeRemaining / LEVEL_CLEAR_TIME_BONUS_DIVISOR) * 10;
  state.score += state.levelClearBonus;
}

function checkLanding(state, { demo = false } = {}) {
  const frog = state.frog;
  if (frog.x < 0 || frog.x > WIDTH - 16 || frog.y > HEIGHT - 16) {
    startDeath(state);
    return;
  }

  if (frog.y <= HOME_Y) {
    const homeIndex = homeLandingIndex(state, frog);

    if (homeIndex === -1) {
      startDeath(state);
      return;
    }
    if (hasHomeHazard(state, homeIndex)) {
      startDeath(state);
      return;
    }

    state.homes[homeIndex] = true;
    if (!demo) state.score += 10;
    let soundType = "home";
    if (hasBonusFly(state, homeIndex)) {
      if (!demo) state.score += BONUS_FLY_SCORE;
      clearBonusFly(state);
      soundType = "bonus_home";
    }
    if (state.passenger.collected) {
      if (!demo) state.score += PASSENGER_SCORE;
      clearPassenger(state);
      soundType = "passenger_home";
    }
    if (!demo) state.soundEvent = { type: soundType };
    if (state.homes.every(Boolean)) {
      awardLevelClearBonus(state);
      startLevelClear(state);
      return;
    }
    resetFrog(state);
    return;
  }

  checkHazards(state);
}

function homeLandingIndex(state, frog) {
  const frogCenterX = frog.x + 8;
  return HOMES.findIndex((homeX, index) => (
    !state.homes[index] &&
    Math.abs(homeX - frogCenterX) <= HOME_TOLERANCE
  ));
}

function checkHazards(state) {
  const frog = state.frog;
  if (frog.x < 0 || frog.x > WIDTH - 16) {
    startDeath(state);
    return;
  }

  const frogRect = { x: frog.x, y: frog.y, width: 16, height: 16 };
  if (snakeObjects(state).some((object) => touches(frogRect, object, 2))) {
    startDeath(state);
    return;
  }

  if (frog.y >= 136) {
    if (roadObjects(laneTime(state), state.level).some((object) => touches(frogRect, object, 3))) startDeath(state);
    return;
  }

  if (frog.y > 40 && frog.y <= 120) {
    const support = riverObjects(laneTime(state), state.level).find((object) => object.support && touches(frogRect, object, 1));
    if (!support) {
      startDeath(state);
      return;
    }
    frog.x += riverat(frog.y, laneTime(state)) - riverat(frog.y, laneTime(state, -1));
    if (frog.x < 0 || frog.x > WIDTH - 16) startDeath(state);
    if (!frog.dying) checkPassengerPickup(state);
  }
}

function createPassenger(level) {
  return {
    active: false,
    collected: false,
    laneY: 88,
    baseOffset: 128,
    offsetX: 48,
    nextSpawnTicks: passengerSpawnTicks(level)
  };
}

function updatePassenger(state) {
  if (state.passenger.collected) return;
  if (state.passenger.active) return;

  state.passenger.nextSpawnTicks -= 1;
  if (state.passenger.nextSpawnTicks <= 0) {
    state.passenger.active = true;
    state.passenger.nextSpawnTicks = passengerSpawnTicks(state.level);
  }
}

function checkPassengerPickup(state) {
  if (!state.passenger.active || state.passenger.collected || state.frog.leaping) return;
  const frogRect = { x: state.frog.x, y: state.frog.y, width: 16, height: 16 };
  if (passengerObjects(state).some((passenger) => touches(frogRect, passenger, 2))) {
    state.passenger.active = false;
    state.passenger.collected = true;
    state.soundEvent = { type: "pickup" };
  }
}

function clearPassenger(state) {
  state.passenger = createPassenger(state.level);
}

function passengerObjects(state) {
  const passenger = state.passenger;
  const baseX = riverat(passenger.laneY, laneTime(state)) + passenger.baseOffset + passenger.offsetX;
  return [-256, 0, 256].map((shift) => ({
    x: normalizePassengerX(baseX) + shift,
    y: passenger.laneY,
    width: 16,
    height: 16
  })).filter((object) => object.x > -16 && object.x < WIDTH + 16);
}

function normalizePassengerX(x) {
  let nx = x;
  while (nx < -16) nx += 256;
  while (nx >= 256) nx -= 256;
  return nx;
}

function snakeObjects(state) {
  const width = 32;
  const speed = 0.75 + Math.min(0.5, (state.level - 1) * 0.04);
  const base = WIDTH - ((motionTime(state) * speed) % (WIDTH + width));
  const id = [73, 74, 75][Math.floor(state.t / 16) % 3];
  const laneOffsets = Array.from({ length: snakeCount(state.level) }, (_, index) => index * 88);
  return laneOffsets.flatMap((offset) => [-WIDTH, 0, WIDTH].map((shift) => ({
      x: base + offset + shift,
      y: 136,
      displayY: 128,
      width,
      height: 16,
      id,
      kind: "snake"
    }))).filter((object) => object.x > -width && object.x < WIDTH + width);
}

function resetFrog(state) {
  state.frog = createFrog();
  state.timeRemaining = levelTimeMax(state.level);
  state.readyTicks = READY_TICKS;
}

function startLevelClear(state) {
  state.mode = "levelclear";
  state.levelClearTicks = LEVEL_CLEAR_TICKS;
  clearBonusFly(state);
  clearHomeHazard(state);
  clearPassenger(state);
  state.frog = createFrog();
}

function startNextLevel(state) {
  state.mode = "playing";
  state.level += 1;
  state.t = 0;
  state.homes = [false, false, false, false, false];
  state.bonusFly = createBonusFly(state.level);
  state.homeHazard = createHomeHazard(state.level);
  state.passenger = createPassenger(state.level);
  state.levelClearTicks = 0;
  state.levelClearBonus = 0;
  resetFrog(state);
}

function laneTime(state, offset = 0) {
  return motionTime(state, offset) * levelSpeed(state.level);
}

function motionTime(state, offset = 0) {
  return (state.t + offset) * normalizeMotionScale(state.motionScale);
}

function normalizeMotionScale(value) {
  return Number.isFinite(value) && value > 0 ? value : 1;
}

function startDeath(state) {
  if (!state.frog.dying) {
    clearBonusFly(state);
    clearHomeHazard(state);
    clearPassenger(state);
    state.frog.dying = 1;
    state.soundEvent = { type: "dying", step: 1 };
  }
}

function touches(a, b, inset = 0) {
  return a.x + inset < b.x + b.width - inset &&
    a.x + a.width - inset > b.x + inset &&
    a.y + inset < b.y + b.height - inset &&
    a.y + a.height - inset > b.y + inset;
}
