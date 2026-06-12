export const WIDTH = 240;
export const HEIGHT = 256;
export const TILE = 16;
export const TIME_MAX = 1800;
export const MIN_TIME_MAX = 900;
export const READY_TICKS = 90;
export const LEVEL_CLEAR_TICKS = 90;
export const GAME_OVER_TICKS = 180;
export const ATTRACT_DEMO_RESET_TICKS = 720;
export const LEVEL_CLEAR_TIME_BONUS_DIVISOR = 30;
export const BONUS_FLY_SCORE = 200;
export const BONUS_FLY_DURATION = 480;
export const BONUS_FLY_SPAWN_TICKS = 300;
export const BONUS_FLY_MIN_SPAWN_TICKS = 180;
export const PASSENGER_SCORE = 200;
export const PASSENGER_SPAWN_TICKS = 540;
export const PASSENGER_MIN_SPAWN_TICKS = 300;
export const CROCODILE_DURATION = 360;
export const CROCODILE_SPAWN_TICKS = 420;
export const CROCODILE_MIN_SPAWN_TICKS = 210;

export const START_X = 120;
export const START_Y = 232;

export const HOME_Y = 40;
export const HOMES = [32, 80, 128, 176, 224];
export const HOME_TOLERANCE = 6;

export const DIRS = {
  up: { dx: 0, dy: -1, angle: Math.PI },
  right: { dx: 1, dy: 0, angle: -Math.PI / 2 },
  down: { dx: 0, dy: 1, angle: 0 },
  left: { dx: -1, dy: 0, angle: Math.PI / 2 }
};

export const CONTROL_MAP = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
  KeyA: "left",
  KeyD: "right",
  KeyW: "up",
  KeyS: "down"
};

export const DEMO_MOVES = [
  "up", "up", "left", "up", "right", "up", "up", "left",
  "up", "right", "up", "up", "left", "right", "up", "up"
];

export function levelSpeed(level) {
  return Math.min(2, 1 + (level - 1) * 0.12);
}

export function levelTimeMax(level) {
  return Math.max(MIN_TIME_MAX, TIME_MAX - (level - 1) * 90);
}

export function bonusFlySpawnTicks(level) {
  return levelSpawnTicks(BONUS_FLY_SPAWN_TICKS, level, BONUS_FLY_MIN_SPAWN_TICKS, 15);
}

export function passengerSpawnTicks(level) {
  return levelSpawnTicks(PASSENGER_SPAWN_TICKS, level, PASSENGER_MIN_SPAWN_TICKS, 30);
}

export function crocodileSpawnTicks(level) {
  return levelSpawnTicks(CROCODILE_SPAWN_TICKS, level, CROCODILE_MIN_SPAWN_TICKS, 35);
}

export function snakeCount(level) {
  if (level < 3) return 0;
  if (level >= 5) return 3;
  return 1;
}

function levelSpawnTicks(base, level, min, step) {
  return Math.max(min, base - (level - 1) * step);
}
