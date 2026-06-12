import assert from "node:assert/strict";
import test from "node:test";

import { riverObjects, riverat, roadObjects } from "../src/lanes.js";

test("riverat matches tutorial lane formulas", () => {
  assert.equal(riverat(120, 10), -10);
  assert.equal(riverat(104, 10), 10);
  assert.equal(riverat(88, 8), 10);
  assert.equal(riverat(72, 10), -5);
  assert.equal(riverat(56, 10), 5);
});

test("road object generator includes the tutorial lanes and widths", () => {
  const objects = roadObjects(0);
  assert.ok(objects.some((object) => object.kind === "truck" && object.y === 152 && object.width === 32));
  assert.ok(objects.some((object) => object.kind === "race-car" && object.y === 168 && object.width === 16));
  assert.ok(objects.some((object) => object.kind === "purple-car" && object.y === 184 && object.width === 16));
  assert.ok(objects.some((object) => object.kind === "dozer" && object.y === 200 && object.width === 16));
  assert.ok(objects.some((object) => object.kind === "yellow-car" && object.y === 216 && object.width === 16));
});

test("later levels increase road traffic density", () => {
  const levelOne = roadObjects(0, 1);
  const levelFive = roadObjects(0, 5);

  assert.ok(levelFive.filter((object) => object.kind === "truck").length > levelOne.filter((object) => object.kind === "truck").length);
  assert.ok(levelFive.filter((object) => object.kind === "race-car").length > levelOne.filter((object) => object.kind === "race-car").length);
  assert.ok(levelFive.filter((object) => object.kind === "yellow-car").length > levelOne.filter((object) => object.kind === "yellow-car").length);
});

test("river object generator includes tutorial log and turtle lengths", () => {
  const objects = riverObjects(0);
  assert.ok(objects.some((object) => object.kind === "log" && object.y === 56 && object.width === 64));
  assert.equal(objects.some((object) => object.kind === "river-crocodile"), false);
  assert.ok(objects.some((object) => object.kind === "turtle" && object.y === 72 && object.width === 32));
  assert.ok(objects.some((object) => object.kind === "log" && object.y === 88 && object.width === 112));
  assert.ok(objects.some((object) => object.kind === "log" && object.y === 104 && object.width === 48));
  assert.ok(objects.some((object) => object.kind === "turtle" && object.y === 120 && object.width === 48));
});

test("river crocodiles animate as support objects replacing logs", () => {
  const closed = riverObjects(0, 3).find((object) => object.kind === "river-crocodile");
  const open = riverObjects(28, 3).find((object) => object.kind === "river-crocodile");

  assert.ok(closed);
  assert.ok(open);
  assert.equal(closed.support, true);
  assert.equal(open.support, true);
  assert.equal(closed.pieces[0].id, 77);
  assert.equal(open.pieces[0].id, 78);
});

test("later levels replace more river logs with crocodiles", () => {
  const levelOne = riverObjects(0, 1);
  const levelThree = riverObjects(0, 3);
  const levelFive = riverObjects(0, 5);

  assert.equal(levelOne.some((object) => object.kind === "river-crocodile"), false);
  assert.ok(levelThree.some((object) => object.kind === "river-crocodile"));
  assert.ok(levelFive.filter((object) => object.kind === "river-crocodile").length > levelThree.filter((object) => object.kind === "river-crocodile").length);
  assert.ok(levelFive.every((object) => object.y !== 56 || object.kind === "river-crocodile"));
});

test("turtle animation uses tutorial frame cycle", () => {
  assert.equal(riverObjects(0).find((object) => object.kind === "turtle").pieces[0].id, 50);
  assert.equal(riverObjects(32).find((object) => object.kind === "turtle").pieces[0].id, 51);
  assert.equal(riverObjects(64).find((object) => object.kind === "turtle").pieces[0].id, 52);
  assert.equal(riverObjects(96).find((object) => object.kind === "turtle").pieces[0].id, 50);
});

test("selected turtle groups submerge and stop supporting the frog", () => {
  const dipping = riverObjects(48).find((object) => object.kind === "turtle" && object.y === 72 && !object.support);
  const nearlyGone = riverObjects(64).find((object) => object.kind === "turtle" && object.y === 72 && !object.support);
  const submerged = riverObjects(80).find((object) => object.kind === "turtle" && object.y === 72 && !object.support);
  const rising = riverObjects(112).find((object) => object.kind === "turtle" && object.y === 72 && !object.support);
  const surfaced = riverObjects(128).find((object) => (
    object.kind === "turtle" &&
    object.y === 72 &&
    object.support &&
    object.pieces[0].id === 52
  ));

  assert.ok(dipping);
  assert.equal(dipping.visible, true);
  assert.equal(dipping.pieces[0].id, 53);
  assert.ok(nearlyGone);
  assert.equal(nearlyGone.visible, true);
  assert.equal(nearlyGone.pieces[0].id, 54);
  assert.ok(submerged);
  assert.equal(submerged.visible, false);
  assert.ok(submerged.pieces.every((piece) => piece.visible === false && piece.support === false));
  assert.ok(rising);
  assert.equal(rising.visible, true);
  assert.equal(rising.pieces[0].id, 53);
  assert.ok(surfaced);
});
