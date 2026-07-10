import assert from "node:assert/strict";
import test from "node:test";

import { directionFromSwipe } from "../src/input.js";

test("swipes resolve to their strongest axis", () => {
  const origin = { x: 100, y: 100 };

  assert.equal(directionFromSwipe(origin, { x: 150, y: 108 }), "right");
  assert.equal(directionFromSwipe(origin, { x: 40, y: 92 }), "left");
  assert.equal(directionFromSwipe(origin, { x: 106, y: 45 }), "up");
  assert.equal(directionFromSwipe(origin, { x: 94, y: 162 }), "down");
});

test("short gestures and invalid inputs are ignored", () => {
  assert.equal(directionFromSwipe({ x: 0, y: 0 }, { x: 10, y: 5 }, 24), null);
  assert.equal(directionFromSwipe(null, { x: 50, y: 0 }), null);
  assert.equal(directionFromSwipe({ x: 0, y: 0 }, { x: 50, y: 0 }, -1), null);
});

test("diagonal ties favor vertical movement", () => {
  assert.equal(directionFromSwipe({ x: 0, y: 0 }, { x: 30, y: -30 }, 24), "up");
});
