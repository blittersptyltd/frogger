import { CONTROL_MAP } from "./constants.js?v=20260510-attract-credits";
import { createAudioController, playSoundEvent, setMuted, updateMusic } from "./audio.js?v=20260510-attract-credits";
import { createGame, getFrameData, insertCoin, requestMove, startGame, updateGame } from "./game.js?v=20260510-attract-credits";
import { createRenderer, render } from "./renderer.js?v=20260510-attract-credits";
import { loadSpriteSheet } from "./sprites.js?v=20260510-attract-credits";

const canvas = document.querySelector("#game");
const startButton = document.querySelector("#start");
const coinButton = document.querySelector("#coin");
const muteButton = document.querySelector("#mute");
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
  startButton.addEventListener("click", () => {
    startGame(state);
    updateMusic(audio, state);
  });
  coinButton.addEventListener("click", () => insertCoin(state));
  muteButton.addEventListener("click", () => {
    setMuted(audio, !audio.muted);
    muteButton.textContent = audio.muted ? "Muted" : "Sound";
    muteButton.setAttribute("aria-pressed", String(audio.muted));
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
      startGame(state);
      updateMusic(audio, state);
      event.preventDefault();
      return;
    }

    const dir = CONTROL_MAP[event.code];
    if (dir) {
      requestMove(state, dir);
      event.preventDefault();
    }
  });

  document.querySelectorAll("[data-dir]").forEach((button) => {
    button.addEventListener("pointerdown", (event) => {
      requestMove(state, button.dataset.dir);
      event.preventDefault();
    });
  });
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
