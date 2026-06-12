# Frogger Development Plan

Date: 2026-05-06

## Objective

Rebuild the browser Frogger clone from the tutorial-derived PRD, with the first milestone focused on asset correctness and visual fidelity before gameplay polish.

## Phase 1: Asset Pipeline

1. Inspect `public/images/11067.png` and identify every tutorial sprite ID needed by the PRD.
2. Create `src/assets/frogger-atlas.js` or `public/images/frogger-atlas.json` containing:
   - tutorial sprite ID
   - semantic name
   - source rectangle in `11067.png`
   - output logical size, usually 16x16
   - optional pivot/trim metadata
3. Build a small atlas preview/debug page or canvas mode that draws all required sprite IDs in ID order.
4. Verify visually that IDs `0..8`, `30..33`, `50..52`, `63`, and `86..88` match the tutorial meanings.
5. Decide whether a generated normalized atlas PNG is needed. Prefer a manifest first; generate a normalized atlas only if direct crops remain too fragile.

Exit criteria:

- Every required tutorial sprite ID has a verified crop.
- There is a visual preview that catches bad crops before gameplay work.

## Phase 2: Rendering Architecture

1. Refactor game code into small modules:
   - `main.js`: bootstrapping and browser wiring.
   - `renderer.js`: canvas draw calls and scaling.
   - `sprites.js`: atlas loading and sprite drawing.
   - `lanes.js`: road/river lane generation from tutorial formulas.
   - `game.js`: fixed-step game state.
2. Render to a 224x256 logical canvas.
3. Create a stable background layer for homes, river, safe strips, road, HUD areas, and lane markers.
4. Render moving sprites from lane object lists.
5. Clip all playfield rendering to the logical playfield.

Exit criteria:

- Static screenshot shows a coherent playfield with correct moving objects and no crop artifacts.

## Phase 3: Tutorial Lane Model

1. Implement `t` as the single source of truth for lane animation.
2. Implement road object generation:
   - trucks at Y 152 using `-t / 2` and `-t / 2 + 116`.
   - race car at Y 168 using `2 * t`.
   - purple cars at Y 184 using `-t`, `-t + 75`, `-t + 150`.
   - dozers at Y 200 using `t`, `t + 50`, `t + 150`.
   - yellow cars at Y 216 using `-t`, `-t + 128`.
3. Implement `riverat(y, tt)` exactly from the PRD.
4. Implement river object generation from the PRD repeat intervals and log/turtle lengths.
5. Return render rectangles and collision rectangles from the same object generation functions.

Exit criteria:

- A debug overlay can show collision rectangles aligned with visible sprites.
- Lane speeds visually match the tutorial formulas.

## Phase 4: Frog State and Controls

1. Implement `frog_start()` equivalent with `(120, 232)`.
2. Implement keyboard controls for arrows.
3. Start a move only when alive and stationary.
4. Move 2px per tick for 8 ticks.
5. Animate alive frog frames with `[2, 1, 0, 0, 2][leaping / 2]`.
6. Apply facing rotation or draw direction-specific transforms.

Exit criteria:

- Frog moves exactly one 16px grid cell per completed leap.
- Input during a leap is ignored.
- Facing direction matches movement.

## Phase 5: Collision, Death, and Homes

1. Implement road collision for `frogy >= 136`.
2. Implement edge death.
3. Implement river support checks for `frogy > 40` while not leaping.
4. Carry frog by `riverat(frogy, t) - riverat(frogy, t - 1)`.
5. Implement 64-tick death animation with frames `[31, 32, 33, 30]`.
6. Implement homes:
   - five home slots.
   - tolerance based on `abs(homeX - frogx) < 4`.
   - done flags and home frog sprite.
   - level restart after all homes are filled.
7. Implement lives and restart/game-over behavior.

Exit criteria:

- Frog dies on vehicles, unsupported river water, and invalid bank landings.
- Frog rides logs/turtles at the correct lane speed.
- All five homes can be filled.

## Phase 6: Sound

1. Add Web Audio sound module.
2. Implement leap notes from `leaping`.
3. Implement death descending note from `dying`.
4. Use square waves and optional odd-harmonic layering.
5. Add a mute toggle.

Exit criteria:

- Leap and death sounds are state-driven and stop when idle.
- Mute works immediately.

## Phase 7: Verification

1. Add lightweight automated checks for pure functions:
   - `riverat()`.
   - road object generation.
   - river object generation.
   - leap state progression.
   - home landing tolerance.
2. Use headless Chrome to capture screenshots:
   - ready state.
   - active gameplay.
   - mobile-sized viewport.
3. Inspect screenshots for:
   - correct sprite crops.
   - no overlapping UI.
   - no off-playfield sprite leakage.
4. Run syntax checks before handoff.

Exit criteria:

- Test commands and screenshot paths are documented in the final handoff.
- The clone is visually playable before gameplay edge cases are tuned.

## Recommended Next Step

Start with Phase 1 only. The prior failure came from treating asset mapping as incidental; this time the atlas manifest and preview should be reviewed before implementing the gameplay modules.
