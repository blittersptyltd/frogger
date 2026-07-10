import assert from "node:assert/strict";
import test from "node:test";

const storage = new Map();

globalThis.localStorage = {
  getItem(key) {
    return storage.get(key) ?? null;
  },
  setItem(key, value) {
    storage.set(key, String(value));
  },
  clear() {
    storage.clear();
  }
};

const { createGame, getFrameData, insertCoin, requestMove, startGame, updateGame } = await import("../src/game.js");
const { ATTRACT_DEMO_RESET_TICKS, BONUS_FLY_DURATION, BONUS_FLY_SCORE, CROCODILE_DURATION, CROCODILE_SPAWN_TICKS, GAME_OVER_TICKS, LEVEL_CLEAR_TICKS, LEVEL_CLEAR_TIME_BONUS_DIVISOR, PASSENGER_SCORE, PASSENGER_SPAWN_TICKS, READY_TICKS, TIME_MAX, bonusFlySpawnTicks, crocodileSpawnTicks, levelSpeed, levelTimeMax, passengerSpawnTicks, snakeCount } = await import("../src/constants.js");
const { riverObjects, roadObjects } = await import("../src/lanes.js");

function drainDeath(state) {
  for (let i = 0; i < 64; i += 1) updateGame(state);
}

function startPaidGame(state) {
  insertCoin(state);
  assert.equal(startGame(state), true);
}

test("game boots into attract mode with no credits", () => {
  const state = createGame();

  assert.equal(state.mode, "attract");
  assert.equal(state.motionScale, 1);
  assert.equal(state.credits, 0);
  assert.equal(startGame(state), false);
  assert.equal(state.mode, "attract");
});

test("game normalizes invalid motion scales to classic speed", () => {
  assert.equal(createGame({ motionScale: 0.75 }).motionScale, 0.75);
  assert.equal(createGame({ motionScale: 0 }).motionScale, 1);
  assert.equal(createGame({ motionScale: -1 }).motionScale, 1);
  assert.equal(createGame({ motionScale: Number.NaN }).motionScale, 1);
});

test("mobile pacing uses the same scaled timeline for road and river objects", () => {
  const state = createGame({ motionScale: 0.75 });
  state.t = 80;

  const frameData = getFrameData(state);

  assert.deepEqual(frameData.road, roadObjects(60, 1));
  assert.deepEqual(frameData.river, riverObjects(60, 1));
});

test("coin adds credit and start consumes one credit", () => {
  const state = createGame();

  insertCoin(state);
  insertCoin(state);

  assert.equal(state.credits, 2);
  assert.deepEqual(state.soundEvent, { type: "coin" });
  assert.equal(startGame(state), true);
  assert.equal(state.mode, "playing");
  assert.equal(state.credits, 1);
});

test("attract mode starts a non-scoring demo loop", () => {
  const state = createGame();

  for (let i = 0; i < 240; i += 1) updateGame(state);

  assert.equal(state.mode, "demo");
  assert.equal(state.score, 0);
  assert.equal(state.readyTicks, 0);

  for (let i = 0; i < 49; i += 1) updateGame(state);

  assert.equal(state.mode, "demo");
  assert.equal(state.frog.leaping > 0 || state.demoMoveIndex > 0, true);
  assert.equal(state.score, 0);
});

test("demo returns to attract without changing credits or high score", () => {
  const state = createGame();
  state.high = 500;
  insertCoin(state);

  for (let i = 0; i < 240; i += 1) updateGame(state);
  for (let i = 0; i < ATTRACT_DEMO_RESET_TICKS + 1; i += 1) updateGame(state);

  assert.equal(state.mode, "attract");
  assert.equal(state.credits, 1);
  assert.equal(state.high, 500);
});

test("new game starts the frog at the tutorial coordinates", () => {
  const state = createGame();
  startPaidGame(state);

  assert.equal(state.frog.x, 120);
  assert.equal(state.frog.y, 232);
  assert.equal(state.frog.face, "up");
  assert.equal(state.mode, "playing");
  assert.equal(state.timeRemaining, TIME_MAX);
  assert.equal(state.readyTicks, READY_TICKS);
});

test("timer counts down while playing and timeout starts death", () => {
  const state = createGame();
  startPaidGame(state);
  state.readyTicks = 0;
  state.timeRemaining = 2;

  updateGame(state);
  assert.equal(state.timeRemaining, 1);
  assert.equal(state.frog.dying, 0);

  updateGame(state);
  assert.equal(state.timeRemaining, 0);
  assert.equal(state.frog.dying, 1);
});

test("ready state ignores input and pauses timer countdown", () => {
  const state = createGame();
  startPaidGame(state);
  requestMove(state, "up");
  updateGame(state);

  assert.equal(state.frog.y, 232);
  assert.equal(state.frog.leaping, 0);
  assert.equal(state.timeRemaining, TIME_MAX);
  assert.equal(state.readyTicks, READY_TICKS - 1);
});

test("difficulty increases lane speed and shortens the timer by level", () => {
  assert.equal(levelSpeed(1), 1);
  assert.equal(levelSpeed(2), 1.12);
  assert.equal(levelSpeed(20), 2);
  assert.equal(levelTimeMax(1), TIME_MAX);
  assert.equal(levelTimeMax(2), TIME_MAX - 90);
  assert.equal(levelTimeMax(20), 900);
  assert.equal(bonusFlySpawnTicks(1), 300);
  assert.equal(bonusFlySpawnTicks(20), 180);
  assert.equal(passengerSpawnTicks(1), 540);
  assert.equal(passengerSpawnTicks(20), 300);
  assert.equal(crocodileSpawnTicks(1), 420);
  assert.equal(crocodileSpawnTicks(20), 210);
  assert.equal(snakeCount(1), 0);
  assert.equal(snakeCount(2), 0);
  assert.equal(snakeCount(3), 1);
  assert.equal(snakeCount(5), 3);
});

test("frog completes one 16px leap after eight ticks", () => {
  const state = createGame();
  startPaidGame(state);
  state.readyTicks = 0;
  requestMove(state, "up");

  for (let i = 0; i < 8; i += 1) updateGame(state);

  assert.equal(state.frog.x, 120);
  assert.equal(state.frog.y, 216);
  assert.equal(state.frog.leaping, 0);
  assert.equal(state.score, 10);
});

test("input is ignored while a leap is in progress", () => {
  const state = createGame();
  startPaidGame(state);
  state.readyTicks = 0;
  requestMove(state, "up");
  requestMove(state, "left");

  for (let i = 0; i < 8; i += 1) updateGame(state);

  assert.equal(state.frog.x, 120);
  assert.equal(state.frog.y, 216);
  assert.equal(state.frog.face, "up");
});

test("death animation decrements a life and resets the frog", () => {
  const state = createGame();
  startPaidGame(state);
  state.readyTicks = 0;
  state.frog.x = -16;
  updateGame(state);

  assert.equal(state.frog.dying, 1);
  drainDeath(state);

  assert.equal(state.lives, 3);
  assert.equal(state.frog.x, 120);
  assert.equal(state.frog.y, 232);
  assert.equal(state.frog.dying, 0);
  assert.equal(state.readyTicks, READY_TICKS);
});

test("frog dies when touching a road vehicle", () => {
  const state = createGame();
  startPaidGame(state);
  state.readyTicks = 0;
  state.frog.x = 0;
  state.frog.y = 152;

  updateGame(state);

  assert.equal(state.frog.dying, 1);
});

test("frog dies in unsupported river water", () => {
  const state = createGame();
  startPaidGame(state);
  state.readyTicks = 0;
  state.frog.x = 60;
  state.frog.y = 104;

  updateGame(state);

  assert.equal(state.frog.dying, 1);
});

test("frog rides supported river objects by the lane delta", () => {
  const state = createGame();
  startPaidGame(state);
  state.readyTicks = 0;
  state.frog.x = 90;
  state.frog.y = 104;

  updateGame(state);

  assert.equal(state.frog.dying, 0);
  assert.equal(state.frog.x, 91);
});

test("mobile river carry uses the reduced motion scale", () => {
  const state = createGame({ motionScale: 0.75 });
  startPaidGame(state);
  state.readyTicks = 0;
  state.frog.x = 90;
  state.frog.y = 104;

  updateGame(state);

  assert.equal(state.frog.dying, 0);
  assert.equal(state.frog.x, 90.75);
});

test("valid home landing fills a home and restarts the frog", () => {
  const state = createGame();
  startPaidGame(state);
  state.readyTicks = 0;
  state.timeRemaining = 100;
  state.frog.x = 120;
  state.frog.y = 56;
  requestMove(state, "up");

  for (let i = 0; i < 8; i += 1) updateGame(state);

  assert.equal(state.homes[2], true);
  assert.equal(state.frog.x, 120);
  assert.equal(state.frog.y, 232);
  assert.equal(state.score, 20);
  assert.equal(state.timeRemaining, TIME_MAX);
  assert.equal(state.readyTicks, READY_TICKS);
  assert.deepEqual(state.soundEvent, { type: "home" });
});

test("home landing uses the frog center so visible slot alignment works", () => {
  const state = createGame();
  startPaidGame(state);
  state.readyTicks = 0;
  state.frog.x = 24;
  state.frog.y = 56;
  requestMove(state, "up");

  for (let i = 0; i < 8; i += 1) updateGame(state);

  assert.equal(state.homes[0], true);
  assert.equal(state.score, 20);
  assert.equal(state.frog.x, 120);
  assert.equal(state.frog.y, 232);
});

test("bonus fly spawns only in empty homes", () => {
  const state = createGame();
  startPaidGame(state);
  state.readyTicks = 0;
  state.level = 2;
  state.homes = [true, false, true, false, false];
  state.bonusFly.nextSpawnTicks = 1;

  updateGame(state);

  assert.equal(state.bonusFly.homeIndex, 1);
  assert.equal(state.bonusFly.ticksRemaining, BONUS_FLY_DURATION);
  assert.equal(state.homes[state.bonusFly.homeIndex], false);
});

test("bonus fly does not spawn on level one", () => {
  const state = createGame();
  startPaidGame(state);
  state.readyTicks = 0;
  state.level = 1;
  state.bonusFly.nextSpawnTicks = 1;

  updateGame(state);

  assert.equal(state.bonusFly.homeIndex, null);
  assert.equal(state.bonusFly.ticksRemaining, 0);
});

test("landing on a bonus fly home awards the bonus and clears the fly", () => {
  const state = createGame();
  startPaidGame(state);
  state.readyTicks = 0;
  state.level = 2;
  state.bonusFly.homeIndex = 2;
  state.bonusFly.ticksRemaining = 100;
  state.frog.x = 120;
  state.frog.y = 56;
  requestMove(state, "up");

  for (let i = 0; i < 8; i += 1) updateGame(state);

  assert.equal(state.homes[2], true);
  assert.equal(state.score, 20 + BONUS_FLY_SCORE);
  assert.equal(state.bonusFly.homeIndex, null);
  assert.equal(state.bonusFly.ticksRemaining, 0);
  assert.deepEqual(state.soundEvent, { type: "bonus_home" });
});

test("bonus fly clears on death", () => {
  const state = createGame();
  startPaidGame(state);
  state.readyTicks = 0;
  state.bonusFly.homeIndex = 2;
  state.bonusFly.ticksRemaining = 100;
  state.frog.x = -16;

  updateGame(state);

  assert.equal(state.frog.dying, 1);
  assert.equal(state.bonusFly.homeIndex, null);
});

test("passenger frog spawns on a river log after its timer", () => {
  const state = createGame();
  startPaidGame(state);
  state.readyTicks = 0;
  state.passenger.nextSpawnTicks = 1;

  updateGame(state);
  const frameData = getFrameData(state);

  assert.equal(state.passenger.active, true);
  assert.equal(state.passenger.collected, false);
  assert.equal(state.passenger.nextSpawnTicks, PASSENGER_SPAWN_TICKS);
  assert.ok(frameData.passengers.length >= 1);
  assert.equal(frameData.passengers[0].y, 88);
  assert.equal(frameData.passengers[0].width, 16);
});

test("frog collects the passenger by landing on its log position", () => {
  const state = createGame();
  startPaidGame(state);
  state.readyTicks = 0;
  state.passenger.active = true;
  state.passenger.nextSpawnTicks = PASSENGER_SPAWN_TICKS;
  state.frog.x = 176;
  state.frog.y = 88;

  updateGame(state);

  assert.equal(state.frog.dying, 0);
  assert.equal(state.passenger.active, false);
  assert.equal(state.passenger.collected, true);
  assert.deepEqual(state.soundEvent, { type: "pickup" });
});

test("carried passenger awards a home bonus and clears on landing", () => {
  const state = createGame();
  startPaidGame(state);
  state.readyTicks = 0;
  state.passenger.collected = true;
  state.frog.x = 120;
  state.frog.y = 56;
  requestMove(state, "up");

  for (let i = 0; i < 8; i += 1) updateGame(state);

  assert.equal(state.homes[2], true);
  assert.equal(state.score, 20 + PASSENGER_SCORE);
  assert.equal(state.passenger.active, false);
  assert.equal(state.passenger.collected, false);
  assert.deepEqual(state.soundEvent, { type: "passenger_home" });
});

test("passenger clears on death", () => {
  const state = createGame();
  startPaidGame(state);
  state.readyTicks = 0;
  state.passenger.collected = true;
  state.frog.x = -16;

  updateGame(state);

  assert.equal(state.frog.dying, 1);
  assert.equal(state.passenger.collected, false);
});

test("crocodile home hazard spawns only in empty non-bonus homes", () => {
  const state = createGame();
  startPaidGame(state);
  state.readyTicks = 0;
  state.level = 3;
  state.homes = [true, false, true, false, false];
  state.bonusFly.homeIndex = 4;
  state.bonusFly.ticksRemaining = 100;
  state.homeHazard.nextSpawnTicks = 1;

  updateGame(state);

  assert.ok([1, 3].includes(state.homeHazard.homeIndex));
  assert.notEqual(state.homeHazard.homeIndex, state.bonusFly.homeIndex);
  assert.equal(state.homes[state.homeHazard.homeIndex], false);
  assert.equal(state.homeHazard.ticksRemaining, CROCODILE_DURATION);
  assert.equal(state.homeHazard.nextSpawnTicks, crocodileSpawnTicks(3));
});

test("early levels do not spawn home crocodile hazards", () => {
  const state = createGame();
  startPaidGame(state);
  state.readyTicks = 0;
  state.level = 1;
  state.homeHazard.nextSpawnTicks = 1;

  updateGame(state);

  assert.equal(state.homeHazard.homeIndex, null);
  assert.equal(state.homeHazard.ticksRemaining, 0);
});

test("landing in a crocodile home starts death and does not fill the home", () => {
  const state = createGame();
  startPaidGame(state);
  state.readyTicks = 0;
  state.level = 3;
  state.homeHazard.homeIndex = 2;
  state.homeHazard.ticksRemaining = 100;
  state.frog.x = 120;
  state.frog.y = 56;
  requestMove(state, "up");

  for (let i = 0; i < 8; i += 1) updateGame(state);

  assert.equal(state.frog.dying, 1);
  assert.equal(state.homes[2], false);
  assert.equal(state.homeHazard.homeIndex, null);
});

test("crocodile hazard clears on level clear", () => {
  const state = createGame();
  startPaidGame(state);
  state.readyTicks = 0;
  state.homes = [true, true, false, true, true];
  state.homeHazard.homeIndex = 0;
  state.homeHazard.ticksRemaining = 100;
  state.frog.x = 120;
  state.frog.y = 56;
  requestMove(state, "up");

  for (let i = 0; i < 8; i += 1) updateGame(state);

  assert.equal(state.mode, "levelclear");
  assert.equal(state.homeHazard.homeIndex, null);
});

test("snake frame data exposes a moving collision rectangle", () => {
  const state = createGame();
  startPaidGame(state);
  state.readyTicks = 0;
  state.level = 3;
  state.t = 64;

  const frameData = getFrameData(state);

  assert.ok(frameData.snakes.length >= 1);
  assert.equal(frameData.snakes[0].y, 136);
  assert.equal(frameData.snakes[0].displayY, 128);
  assert.equal(frameData.snakes[0].width, 32);
});

test("snake moves right to left", () => {
  const state = createGame();
  startPaidGame(state);
  state.readyTicks = 0;
  state.level = 3;
  state.t = 64;
  const x0 = getFrameData(state).snakes[0].x;

  state.t = 65;
  const x1 = getFrameData(state).snakes[0].x;

  assert.ok(x1 < x0);
});

test("mobile pacing reduces snake movement to 75 percent", () => {
  const state = createGame({ motionScale: 0.75 });
  state.level = 3;
  state.t = 64;
  const x0 = getFrameData(state).snakes[0].x;

  state.t = 65;
  const x1 = getFrameData(state).snakes[0].x;

  const classicStep = 0.75 + (state.level - 1) * 0.04;
  assert.ok(Math.abs((x0 - x1) - classicStep * 0.75) < 1e-9);
});

test("touching the snake kills the frog", () => {
  const state = createGame();
  startPaidGame(state);
  state.readyTicks = 0;
  state.level = 3;
  state.t = 64;
  const snake = getFrameData(state).snakes[0];
  state.frog.x = snake.x + 8;
  state.frog.y = 136;

  updateGame(state);

  assert.equal(state.frog.dying, 1);
});

test("snake does not affect the frog when not overlapping", () => {
  const state = createGame();
  startPaidGame(state);
  state.readyTicks = 0;
  state.level = 3;
  state.t = 64;
  state.frog.x = 120;
  state.frog.y = 232;

  updateGame(state);

  assert.equal(state.frog.dying, 0);
});

test("landing outside the visible home well starts death", () => {
  const state = createGame();
  startPaidGame(state);
  state.readyTicks = 0;
  state.frog.x = 8;
  state.frog.y = 56;
  requestMove(state, "up");

  for (let i = 0; i < 8; i += 1) updateGame(state);

  assert.equal(state.frog.dying, 1);
});

test("invalid home landing starts death", () => {
  const state = createGame();
  startPaidGame(state);
  state.readyTicks = 0;
  state.frog.x = 136;
  state.frog.y = 56;
  requestMove(state, "up");

  for (let i = 0; i < 8; i += 1) updateGame(state);

  assert.equal(state.frog.dying, 1);
});

test("landing in an occupied home starts death", () => {
  const state = createGame();
  startPaidGame(state);
  state.readyTicks = 0;
  state.homes[2] = true;
  state.frog.x = 120;
  state.frog.y = 56;
  requestMove(state, "up");

  for (let i = 0; i < 8; i += 1) updateGame(state);

  assert.equal(state.frog.dying, 1);
});

test("filling all homes starts a level-clear pause with all homes visible", () => {
  const state = createGame();
  startPaidGame(state);
  state.readyTicks = 0;
  state.timeRemaining = 100;
  state.homes = [true, true, false, true, true];
  state.frog.x = 120;
  state.frog.y = 56;
  requestMove(state, "up");

  for (let i = 0; i < 8; i += 1) updateGame(state);

  assert.equal(state.mode, "levelclear");
  assert.equal(state.level, 1);
  assert.equal(state.levelClearTicks, LEVEL_CLEAR_TICKS);
  assert.deepEqual(state.homes, [true, true, true, true, true]);
  assert.equal(state.frog.x, 120);
  assert.equal(state.frog.y, 232);
  assert.equal(state.timeRemaining, 92);
  assert.equal(state.levelClearBonus, Math.floor(92 / LEVEL_CLEAR_TIME_BONUS_DIVISOR) * 10);
  assert.equal(state.score, 20 + state.levelClearBonus);
});

test("level clear advances after the pause and starts the next level ready state", () => {
  const state = createGame();
  startPaidGame(state);
  state.readyTicks = 0;
  state.homes = [true, true, false, true, true];
  state.frog.x = 120;
  state.frog.y = 56;
  requestMove(state, "up");

  for (let i = 0; i < 8; i += 1) updateGame(state);
  requestMove(state, "left");

  assert.equal(state.frog.x, 120);
  assert.equal(state.mode, "levelclear");

  for (let i = 0; i < LEVEL_CLEAR_TICKS; i += 1) updateGame(state);

  assert.equal(state.mode, "playing");
  assert.equal(state.level, 2);
  assert.equal(state.t, 0);
  assert.deepEqual(state.homes, [false, false, false, false, false]);
  assert.equal(state.timeRemaining, levelTimeMax(2));
  assert.equal(state.readyTicks, READY_TICKS);
  assert.equal(state.levelClearBonus, 0);
  assert.equal(state.bonusFly.nextSpawnTicks, bonusFlySpawnTicks(2));
  assert.equal(state.homeHazard.nextSpawnTicks, crocodileSpawnTicks(2));
  assert.equal(state.passenger.nextSpawnTicks, passengerSpawnTicks(2));
});

test("later levels add more snake hazards", () => {
  const state = createGame();
  startPaidGame(state);
  state.readyTicks = 0;
  state.t = 64;

  assert.equal(getFrameData(state).snakes.length, 0);

  state.level = 3;
  assert.equal(getFrameData(state).snakes.length, 1);

  state.level = 5;
  assert.ok(getFrameData(state).snakes.length >= 3);
});

test("dipping turtles do not support the frog before they disappear", () => {
  const state = createGame();
  startPaidGame(state);
  state.readyTicks = 0;
  state.t = 47;
  state.frog.x = 42;
  state.frog.y = 72;

  updateGame(state);

  assert.equal(state.frog.dying, 1);
});

test("underwater turtles do not support the frog", () => {
  const state = createGame();
  startPaidGame(state);
  state.readyTicks = 0;
  state.t = 79;
  state.frog.x = 8;
  state.frog.y = 72;

  updateGame(state);

  assert.equal(state.frog.dying, 1);
});

test("visible sinking turtles still support and carry the frog", () => {
  const state = createGame();
  startPaidGame(state);
  state.readyTicks = 0;
  state.t = 127;
  state.frog.x = 8;
  state.frog.y = 72;

  updateGame(state);

  assert.equal(state.frog.dying, 0);
  assert.equal(state.frog.x, 7.5);
});

test("game over stores the high score after the final life", () => {
  localStorage.clear();
  const state = createGame();
  startPaidGame(state);
  state.readyTicks = 0;
  state.score = 230;
  state.lives = 1;
  state.frog.x = -16;

  updateGame(state);
  drainDeath(state);

  assert.equal(state.mode, "gameover");
  assert.equal(state.gameOverTicks, GAME_OVER_TICKS);
  assert.equal(state.high, 230);
  assert.equal(localStorage.getItem("frogger-high"), "230");
});

test("game over returns to attract mode after the pause", () => {
  const state = createGame();
  startPaidGame(state);
  state.readyTicks = 0;
  state.lives = 1;
  state.frog.x = -16;

  updateGame(state);
  drainDeath(state);

  assert.equal(state.mode, "gameover");

  for (let i = 0; i < GAME_OVER_TICKS; i += 1) updateGame(state);

  assert.equal(state.mode, "attract");
});

test("game over does not overwrite a higher stored high score", () => {
  localStorage.clear();
  localStorage.setItem("frogger-high", "500");
  const state = createGame();
  startPaidGame(state);
  state.readyTicks = 0;
  state.score = 120;
  state.lives = 1;
  state.frog.x = -16;

  updateGame(state);
  drainDeath(state);

  assert.equal(state.mode, "gameover");
  assert.equal(state.high, 500);
  assert.equal(localStorage.getItem("frogger-high"), "500");
});

test("starting after game over resets play state and keeps the high score", () => {
  const state = createGame();
  startPaidGame(state);
  state.mode = "gameover";
  state.score = 230;
  state.high = 500;
  state.lives = 0;

  startPaidGame(state);

  assert.equal(state.mode, "playing");
  assert.equal(state.score, 0);
  assert.equal(state.high, 500);
  assert.equal(state.lives, 4);
  assert.equal(state.frog.x, 120);
  assert.equal(state.frog.y, 232);
});
