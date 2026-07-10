export function createAudioController() {
  return {
    muted: false,
    context: null,
    sfxNodes: [],
    musicNodes: [],
    musicMode: null,
    musicStep: 0,
    nextMusicTime: 0
  };
}

export function setMuted(audio, muted) {
  audio.muted = muted;
  stopSfx(audio);
  stopMusic(audio);
}

export function unlockAudio(audio) {
  if (audio.muted) return Promise.resolve(false);

  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return Promise.resolve(false);
  if (!audio.context || audio.context.state === "closed") audio.context = new AudioContext();

  primeContext(audio.context);

  if (audio.context.state === "running") return Promise.resolve(true);
  if (typeof audio.context.resume !== "function") return Promise.resolve(false);

  return Promise.resolve(audio.context.resume())
    .then(() => audio.context?.state === "running")
    .catch(() => false);
}

export function playSoundEvent(audio, event) {
  if (!event || audio.muted) {
    stopSfx(audio);
    return;
  }

  if (!ensureContext(audio)) return;

  const note = soundNoteForEvent(event);
  if (note === null) {
    stopSfx(audio);
    return;
  }
  playSquare(audio, midiToFrequency(note), soundDurationForEvent(event));
}

export function updateMusic(audio, state) {
  if (audio.muted || !state) {
    stopMusic(audio);
    return;
  }

  const mode = musicModeForState(state);
  if (!mode) {
    stopMusic(audio);
    return;
  }

  if (!ensureContext(audio)) return;

  if (audio.musicMode !== mode) {
    stopMusic(audio);
    audio.musicMode = mode;
    audio.musicStep = 0;
    audio.nextMusicTime = audio.context.currentTime;
  }

  const pattern = musicPatternForMode(mode);
  const stepSeconds = musicStepDurationForMode(mode);
  const scheduleUntil = audio.context.currentTime + 0.08;

  while (audio.nextMusicTime <= scheduleUntil) {
    const note = pattern[audio.musicStep % pattern.length];
    if (note !== null) playMusicNote(audio, midiToFrequency(note), audio.nextMusicTime, stepSeconds * 0.45);
    audio.musicStep += 1;
    audio.nextMusicTime += stepSeconds;
  }
}

export function soundNoteForEvent(event) {
  if (!event) return null;
  if (event.type === "coin") return 88;
  if (event.type === "passenger_home") return 103;
  if (event.type === "bonus_home") return 100;
  if (event.type === "pickup") return 91;
  if (event.type === "home") return 96;
  if (event.type === "dying") return 84 - Math.floor(event.step / 2);
  if (event.type === "leap") return event.step % 2 ? 60 + event.step : 72 + event.step;
  return null;
}

export function soundDurationForEvent(event) {
  if (!event) return 0;
  if (event.type === "coin") return 0.09;
  if (event.type === "passenger_home") return 0.18;
  if (event.type === "bonus_home") return 0.16;
  if (event.type === "pickup") return 0.08;
  if (event.type === "home") return 0.14;
  return 0.035;
}

function playSquare(audio, freq, seconds) {
  stopSfx(audio);
  const now = audio.context.currentTime;
  [1, 3, 5].forEach((harmonic) => {
    const osc = audio.context.createOscillator();
    const gain = audio.context.createGain();
    osc.type = "square";
    osc.frequency.value = freq * harmonic;
    gain.gain.setValueAtTime(0.04 / harmonic, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + seconds);
    osc.connect(gain);
    gain.connect(audio.context.destination);
    osc.start(now);
    osc.stop(now + seconds);
    audio.sfxNodes.push(osc, gain);
  });
}

function playMusicNote(audio, freq, start, seconds) {
  const osc = audio.context.createOscillator();
  const gain = audio.context.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0.018, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + seconds);
  osc.connect(gain);
  gain.connect(audio.context.destination);
  osc.start(start);
  osc.stop(start + seconds);
  audio.musicNodes.push(osc, gain);
}

function stopSfx(audio) {
  stopNodes(audio.sfxNodes);
  audio.sfxNodes = [];
}

function stopMusic(audio) {
  stopNodes(audio.musicNodes);
  audio.musicNodes = [];
  audio.musicMode = null;
  audio.musicStep = 0;
  audio.nextMusicTime = 0;
}

function stopNodes(nodes) {
  nodes.forEach((node) => {
    try {
      if (typeof node.stop === "function") node.stop();
      if (typeof node.disconnect === "function") node.disconnect();
    } catch {
      // Nodes may already have stopped between animation ticks.
    }
  });
}

function primeContext(context) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const now = context.currentTime;
  oscillator.frequency.setValueAtTime(440, now);
  gain.gain.setValueAtTime(0.0001, now);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.01);
}

export function midiToFrequency(note) {
  return 440 * 2 ** ((note - 69) / 12);
}

export function musicModeForState(state) {
  if (state.mode === "attract") return "attract";
  if (state.mode === "demo") return "playing";
  if (state.mode === "levelclear") return "levelclear";
  if (state.mode === "gameover") return "gameover";
  if (state.mode === "playing" && state.readyTicks) return "ready";
  if (state.mode === "playing") return "playing";
  return null;
}

export function musicPatternForMode(mode) {
  const patterns = {
    attract: [72, null, 76, null, 79, null, null, null],
    ready: [72, 76, 79, null, 84, null, 79, 76],
    playing: [48, null, 55, null, 60, null, 55, null, 50, null, 57, null, 60, null, 57, null],
    levelclear: [72, 76, 79, 84, 88, null, 84, null],
    gameover: [60, 57, 54, 48, null, null, null, null]
  };
  return patterns[mode] ?? [];
}

export function musicStepDurationForMode(mode) {
  if (mode === "playing") return 0.16;
  if (mode === "gameover") return 0.22;
  return 0.12;
}

function ensureContext(audio) {
  return Boolean(audio.context && audio.context.state !== "closed");
}
