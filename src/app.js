import { CONTROL_MAP } from "./constants.js?v=20260510-attract-credits";
import { createAudioController, playSoundEvent, setMuted, unlockAudio, updateMusic } from "./audio.js?v=20260710-mobile-unlock";
import { createGame, getFrameData, insertCoin, requestMove, startGame, updateGame } from "./game.js?v=20260510-attract-credits";
import { directionFromSwipe } from "./input.js?v=20260710-mobile";
import { createRenderer, render } from "./renderer.js?v=20260510-attract-credits";
import { loadSpriteSheet } from "./sprites.js?v=20260510-attract-credits";

const canvas = document.querySelector("#game");
const playButton = document.querySelector("#play");
const muteButton = document.querySelector("#mute");
const soundLabel = document.querySelector("#sound-label");
const controlStatus = document.querySelector("#control-status");
const gestureHint = document.querySelector("#swipe-hint");
const audio = createAudioController();
const state = createGame();
state.debugCollision = new URLSearchParams(window.location.search).has("collision");

let renderer = null;
let last = 0;
let accumulator = 0;
const STEP = 1000 / 60;

loadSpriteSheet()
  .then((sheet) => {
    renderer = createRenderer(canvas, sheet);
    wireControls();
    requestAnimationFrame(loop);
  })
  .catch((error) => {
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.font = "8px monospace";
    ctx.fillText(error.message, 8, 128);
  });

function wireControls() {
  playButton.addEventListener("click", beginPlay);
  muteButton.addEventListener("click", () => {
    const shouldMute = !audio.muted;
    setMuted(audio, shouldMute);
    soundLabel.textContent = audio.muted ? "OFF" : "ON";
    muteButton.setAttribute("aria-pressed", String(audio.muted));
    controlStatus.textContent = audio.muted ? "Sound muted" : "Sound on";
    if (!shouldMute) {
      void unlockAudio(audio).then((ready) => {
        controlStatus.textContent = ready ? "Sound on" : "Sound unavailable";
        if (ready) updateMusic(audio, state);
      });
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.code === "KeyC") {
      state.debugCollision = !state.debugCollision;
      event.preventDefault();
      return;
    }

    if (event.code === "Digit5") {
      insertCoin(state);
      event.preventDefault();
      return;
    }

    if (event.code === "Enter" || event.code === "Space") {
      beginPlay();
      event.preventDefault();
      return;
    }

    const dir = CONTROL_MAP[event.code];
    if (dir) {
      move(dir);
      event.preventDefault();
    }
  });

  document.querySelectorAll("[data-dir]").forEach((button) => {
    button.addEventListener("pointerdown", (event) => {
      move(button.dataset.dir);
      button.classList.add("is-pressed");
      event.preventDefault();
    });
    button.addEventListener("pointerup", () => button.classList.remove("is-pressed"));
    button.addEventListener("pointercancel", () => button.classList.remove("is-pressed"));
    button.addEventListener("pointerleave", () => button.classList.remove("is-pressed"));
    button.addEventListener("click", (event) => {
      if (event.detail === 0) move(button.dataset.dir);
    });
  });

  wireSwipeControls();
}

function beginPlay() {
  const audioReady = unlockAudio(audio);

  if (state.mode === "playing" || state.mode === "levelclear") {
    void audioReady.then(() => updateMusic(audio, state));
    canvas.focus({ preventScroll: true });
    return;
  }

  const insertedCoin = state.credits <= 0;
  if (insertedCoin) insertCoin(state);
  if (!startGame(state)) return;

  if (insertedCoin) playSoundEvent(audio, { type: "coin" });
  updateMusic(audio, state);
  void audioReady.then((ready) => {
    if (!ready) {
      controlStatus.textContent = "Game started; sound unavailable";
      return;
    }
    updateMusic(audio, state);
    controlStatus.textContent = "Game started with sound";
  });
  controlStatus.textContent = "Game started";
  gestureHint.classList.add("is-hidden");
  vibrate(18);
  canvas.focus({ preventScroll: true });
}

function move(direction) {
  const wasLeaping = state.frog.leaping;
  requestMove(state, direction);
  if (!wasLeaping && state.frog.leaping) {
    controlStatus.textContent = `Moved ${direction}`;
    vibrate(8);
  }
}

function wireSwipeControls() {
  let start = null;

  canvas.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary) return;
    start = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
    canvas.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  });

  canvas.addEventListener("pointermove", (event) => {
    if (start?.pointerId === event.pointerId) event.preventDefault();
  });

  canvas.addEventListener("pointerup", (event) => {
    if (start?.pointerId !== event.pointerId) return;

    const bounds = canvas.getBoundingClientRect();
    const threshold = Math.max(20, Math.min(bounds.width, bounds.height) * 0.065);
    const direction = directionFromSwipe(start, { x: event.clientX, y: event.clientY }, threshold);
    start = null;
    canvas.releasePointerCapture?.(event.pointerId);

    if (direction) {
      gestureHint.classList.add("is-hidden");
      move(direction);
    }
    event.preventDefault();
  });

  canvas.addEventListener("pointercancel", () => {
    start = null;
  });
  canvas.addEventListener("contextmenu", (event) => event.preventDefault());
}

function vibrate(duration) {
  if (typeof navigator.vibrate === "function") navigator.vibrate(duration);
}

function loop(now) {
  try {
    if (!last) last = now;
    accumulator += now - last;
    last = now;

    while (accumulator >= STEP) {
      updateGame(state);
      playSoundEvent(audio, state.soundEvent);
      updateMusic(audio, state);
      accumulator -= STEP;
    }

    render(renderer, state, getFrameData(state));
    requestAnimationFrame(loop);
  } catch (error) {
    showFatalError(error);
  }
}

function showFatalError(error) {
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#f33";
  ctx.font = "8px monospace";
  ctx.fillText("Render error", 8, 118);
  ctx.fillText(String(error?.message || error).slice(0, 36), 8, 130);
  throw error;
}
