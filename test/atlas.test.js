import assert from "node:assert/strict";
import test from "node:test";

const { ADVANCED_TUTORIAL_IDS, FROGGER_ATLAS } = await import("../src/assets/frogger-atlas.js");

test("death animation frames keep their natural shape inside the same logical box", () => {
  assert.deepEqual(FROGGER_ATLAS[31].size, [16, 16]);
  assert.deepEqual(FROGGER_ATLAS[32].size, [16, 16]);
  assert.deepEqual(FROGGER_ATLAS[33].size, [16, 16]);
  assert.deepEqual(FROGGER_ATLAS[30].size, [16, 16]);
  assert.deepEqual(FROGGER_ATLAS[31].render, [12, 9, 3, 4]);
  assert.deepEqual(FROGGER_ATLAS[32].render, [12, 13, 3, 3]);
  assert.deepEqual(FROGGER_ATLAS[33].render, [9, 12, 4, 3]);
  assert.deepEqual(FROGGER_ATLAS[30].render, [13, 12, 3, 3]);
});

test("advanced gameplay sprites include the bonus fly", () => {
  assert.ok(ADVANCED_TUTORIAL_IDS.includes(70));
  assert.equal(FROGGER_ATLAS[70].name, "bonus_fly");
  assert.deepEqual(FROGGER_ATLAS[70].size, [16, 16]);
});

test("advanced gameplay sprites include the passenger frog", () => {
  assert.ok(ADVANCED_TUTORIAL_IDS.includes(71));
  assert.equal(FROGGER_ATLAS[71].name, "passenger_frog");
  assert.deepEqual(FROGGER_ATLAS[71].size, [16, 16]);
});

test("advanced gameplay sprites include animated home crocodile frames", () => {
  assert.ok(ADVANCED_TUTORIAL_IDS.includes(72));
  assert.ok(ADVANCED_TUTORIAL_IDS.includes(76));
  assert.equal(FROGGER_ATLAS[72].name, "home_crocodile_head_closed");
  assert.equal(FROGGER_ATLAS[76].name, "home_crocodile_head_open");
  assert.deepEqual(FROGGER_ATLAS[72].size, [16, 16]);
  assert.deepEqual(FROGGER_ATLAS[76].size, [16, 16]);
});

test("advanced gameplay sprites include full river crocodile frames", () => {
  assert.ok(ADVANCED_TUTORIAL_IDS.includes(77));
  assert.ok(ADVANCED_TUTORIAL_IDS.includes(78));
  assert.equal(FROGGER_ATLAS[77].name, "river_crocodile_closed");
  assert.equal(FROGGER_ATLAS[78].name, "river_crocodile_open");
  assert.deepEqual(FROGGER_ATLAS[77].size, [48, 16]);
  assert.deepEqual(FROGGER_ATLAS[78].size, [48, 16]);
});

test("advanced gameplay sprites include snake animation frames", () => {
  [73, 74, 75].forEach((id) => {
    assert.ok(ADVANCED_TUTORIAL_IDS.includes(id));
    assert.deepEqual(FROGGER_ATLAS[id].size, [32, 16]);
    assert.equal(FROGGER_ATLAS[id].role, "advanced moving hazard");
  });
});
