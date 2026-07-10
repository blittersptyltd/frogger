import assert from "node:assert/strict";
import test from "node:test";

import { MOBILE_MOTION_SCALE, motionScaleForWindow } from "../src/pacing.js";

test("touch-first devices receive the mobile motion scale", () => {
  const targetWindow = {
    matchMedia(query) {
      assert.equal(query, "(hover: none) and (pointer: coarse)");
      return { matches: true };
    }
  };

  assert.equal(motionScaleForWindow(targetWindow), MOBILE_MOTION_SCALE);
  assert.equal(MOBILE_MOTION_SCALE, 0.75);
});

test("pointer-first and incomplete environments keep classic motion", () => {
  assert.equal(motionScaleForWindow({ matchMedia: () => ({ matches: false }) }), 1);
  assert.equal(motionScaleForWindow({}), 1);
  assert.equal(motionScaleForWindow(null), 1);
});
