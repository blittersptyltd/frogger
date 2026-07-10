import assert from "node:assert/strict";
import test from "node:test";

const {
  createAudioController,
  midiToFrequency,
  musicModeForState,
  musicPatternForMode,
  musicStepDurationForMode,
  playSoundEvent,
  unlockAudio,
  updateMusic,
  soundDurationForEvent,
  soundNoteForEvent
} = await import("../src/audio.js");

class FakeAudioContext {
  constructor() {
    this.currentTime = 0;
    this.destination = {};
    this.state = "suspended";
    this.resumeCalls = 0;
    this.startedOscillators = 0;
  }

  createOscillator() {
    return {
      frequency: { setValueAtTime() {} },
      connect() {},
      start: () => { this.startedOscillators += 1; },
      stop() {}
    };
  }

  createGain() {
    return {
      gain: {
        setValueAtTime() {},
        exponentialRampToValueAtTime() {}
      },
      connect() {}
    };
  }

  resume() {
    this.resumeCalls += 1;
    this.state = "running";
    return Promise.resolve();
  }
}

test("music does not create an audio context before user interaction", () => {
  const audio = createAudioController();
  updateMusic(audio, { mode: "attract" });
  assert.equal(audio.context, null);
});

test("audio unlock creates, primes, and resumes the context during a user gesture", async () => {
  const originalWindow = globalThis.window;
  globalThis.window = { AudioContext: FakeAudioContext };

  try {
    const audio = createAudioController();
    assert.equal(await unlockAudio(audio), true);
    assert.equal(audio.context.state, "running");
    assert.equal(audio.context.resumeCalls, 1);
    assert.equal(audio.context.startedOscillators, 1);
  } finally {
    globalThis.window = originalWindow;
  }
});

test("sound can be scheduled while a created context is finishing its resume", () => {
  const audio = createAudioController();
  audio.context = new FakeAudioContext();

  playSoundEvent(audio, { type: "coin" });

  assert.equal(audio.context.state, "suspended");
  assert.equal(audio.context.startedOscillators, 3);
});

test("leap sound alternates between low and high tutorial notes", () => {
  assert.equal(soundNoteForEvent({ type: "leap", step: 1 }), 61);
  assert.equal(soundNoteForEvent({ type: "leap", step: 2 }), 74);
  assert.equal(soundNoteForEvent({ type: "leap", step: 7 }), 67);
  assert.equal(soundNoteForEvent({ type: "leap", step: 8 }), 80);
});

test("death sound descends every two ticks", () => {
  assert.equal(soundNoteForEvent({ type: "dying", step: 1 }), 84);
  assert.equal(soundNoteForEvent({ type: "dying", step: 2 }), 83);
  assert.equal(soundNoteForEvent({ type: "dying", step: 3 }), 83);
  assert.equal(soundNoteForEvent({ type: "dying", step: 64 }), 52);
});

test("home sound is a distinct longer high tone", () => {
  assert.equal(soundNoteForEvent({ type: "home" }), 96);
  assert.equal(soundDurationForEvent({ type: "home" }), 0.14);
  assert.notEqual(soundNoteForEvent({ type: "home" }), soundNoteForEvent({ type: "leap", step: 8 }));
});

test("advanced bonus sounds use distinct tones", () => {
  assert.equal(soundNoteForEvent({ type: "pickup" }), 91);
  assert.equal(soundDurationForEvent({ type: "pickup" }), 0.08);
  assert.equal(soundNoteForEvent({ type: "bonus_home" }), 100);
  assert.equal(soundDurationForEvent({ type: "bonus_home" }), 0.16);
  assert.equal(soundNoteForEvent({ type: "passenger_home" }), 103);
  assert.equal(soundDurationForEvent({ type: "passenger_home" }), 0.18);
});

test("coin sound is short and distinct", () => {
  assert.equal(soundNoteForEvent({ type: "coin" }), 88);
  assert.equal(soundDurationForEvent({ type: "coin" }), 0.09);
});

test("unknown or missing sound events are silent", () => {
  assert.equal(soundNoteForEvent(null), null);
  assert.equal(soundNoteForEvent({ type: "bonus", step: 1 }), null);
});

test("midi note conversion uses A4 as 440 Hz", () => {
  assert.equal(midiToFrequency(69), 440);
  assert.equal(Math.round(midiToFrequency(81)), 880);
});

test("music mode follows game state", () => {
  assert.equal(musicModeForState({ mode: "attract" }), "attract");
  assert.equal(musicModeForState({ mode: "demo" }), "playing");
  assert.equal(musicModeForState({ mode: "ready" }), null);
  assert.equal(musicModeForState({ mode: "playing", readyTicks: 20 }), "ready");
  assert.equal(musicModeForState({ mode: "playing", readyTicks: 0 }), "playing");
  assert.equal(musicModeForState({ mode: "levelclear" }), "levelclear");
  assert.equal(musicModeForState({ mode: "gameover" }), "gameover");
});

test("music patterns provide sparse arcade loops", () => {
  assert.ok(musicPatternForMode("ready").includes(84));
  assert.ok(musicPatternForMode("playing").some((note) => note === null));
  assert.ok(musicPatternForMode("levelclear")[0] > musicPatternForMode("gameover")[0]);
  assert.deepEqual(musicPatternForMode("unknown"), []);
});

test("music step durations keep gameplay quieter than stingers", () => {
  assert.equal(musicStepDurationForMode("playing"), 0.16);
  assert.equal(musicStepDurationForMode("gameover"), 0.22);
  assert.equal(musicStepDurationForMode("ready"), 0.12);
});
