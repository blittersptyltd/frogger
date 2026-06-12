# Frogger Arcade Clone PRD

Date: 2026-05-06

## Source Material

This PRD is distilled from:

- Frogger Tutorial part 1: https://excamera.com/sphinx/gameduino/tutorials/frogger1.html
- Frogger Tutorial part 2: https://excamera.com/sphinx/gameduino/tutorials/frogger2.html
- Frogger Tutorial part 3: https://excamera.com/sphinx/gameduino/tutorials/frogger3.html

The tutorial targets Arduino/Gameduino. This project targets a browser canvas implementation, but the gameplay coordinates, animation counters, sprite IDs, and lane timing should follow the tutorial unless a browser-specific adaptation is called out.

## Product Goal

Build a playable Frogger arcade clone that feels like the tutorial's finished game: a 224x256 pixel playfield, fixed pixel-grid movement, animated sprites, road collision, river riding, home slots, score/lives state, and simple vintage sound.

The current repo already contains the original packed sprite sheet at `public/images/11067.png`. The implementation must not rely on guessed sprite rectangles in game code. It must first produce a canonical game atlas or manifest that maps tutorial sprite IDs to reliable source rectangles.

## Non-Goals

- Do not add new gameplay modes beyond the tutorial version.
- Do not build a marketing page or menu-heavy shell.
- Do not use a physics engine; Frogger is deterministic lane and sprite overlap logic.
- Do not approximate the visuals with CSS shapes once the source art is available.
- Do not optimize for Arduino/Gameduino memory constraints; preserve behavior, not hardware implementation details.

## Target Platform

- Desktop browser, latest Chrome/Chromium.
- Touch-capable browser as a secondary target.
- Static app is acceptable; no backend is required.
- The game should run from a local static server and render crisply at integer and non-integer CSS scales using `image-rendering: pixelated`.

## Visual Requirements

- The logical playfield is 224x256 pixels.
- The road/river/home/static playfield should be rendered as a stable background layer.
- Moving gameplay objects should be rendered as sprites on top of the background layer.
- Sprites should be based on the tutorial's 16x16 sprite-frame model:
  - Frog leap frames: `0`, `1`, `2`.
  - Yellow car: `3`.
  - Dozer: `4`.
  - Truck: `5` and `6`, drawn as adjacent 16px pieces.
  - Purple car: `7`.
  - Green/white race car: `8`.
  - Death animation: `31`, `32`, `33`, `30`.
  - Turtles: `50`, `51`, `52`.
  - Home frog: `63`.
  - Logs: `86`, `87`, `88`, drawn as left/middle/right pieces.
- The original packed sprite sheet must be converted into a reliable atlas before gameplay work is considered complete.
- Off-screen moving sprites should be clipped or masked at the playfield edges so partial objects do not leak outside the intended game area.

## Game Loop Requirements

- Maintain a monotonically increasing game time counter `t`.
- Most lane animation is derived directly from `t`, not from mutable per-object state.
- Advance the simulation at a stable fixed step. Rendering may interpolate only if it does not change gameplay.
- Keep the playfield coordinate system in logical pixels. CSS scaling must not affect gameplay math.

## Player State

The frog must track:

- `frogx`, `frogy`: logical pixel position.
- `leaping`: `0` when stationary; `1..8` during a leap.
- `frogdir`: direction of the current leap.
- `frogface`: visual facing direction.
- `dying`: `0` when alive; `1..64` during death animation.

The frog starts at:

- `frogx = 120`
- `frogy = 232`
- facing upward
- not leaping
- not dying

## Controls

- Keyboard arrows must move the frog.
- WASD may be supported as a convenience, but arrows are canonical.
- A new move may begin only when the frog is not dying and `leaping == 0`.
- Each move starts the leap counter and awards 10 points.
- During a leap, the frog moves 2 pixels per tick for 8 ticks, producing one 16px grid movement.
- Facing directions:
  - Up: tutorial rotation equivalent `0`.
  - Left: tutorial rotation equivalent `3`.
  - Right: tutorial rotation equivalent `5`.
  - Down: tutorial rotation equivalent `6`.

## Lane Layout

Road lanes:

| Lane | Y | Objects | Formula |
| --- | ---: | --- | --- |
| Trucks | 152 | two truck groups | `-t / 2`, `-t / 2 + 116`; each group draws frames `5` and `6` |
| Race car | 168 | one car | `2 * t`; frame `8` |
| Purple cars | 184 | three cars | `-t`, `-t + 75`, `-t + 150`; frame `7` |
| Dozers | 200 | three dozers | `t`, `t + 50`, `t + 150`; frame `4` |
| Yellow cars | 216 | two cars | `-t`, `-t + 128`; frame `3` |

River lane velocity function:

| Y | Formula |
| ---: | --- |
| 120 | `-t` |
| 104 | `t` |
| 88 | `5 * t / 4` |
| 72 | `-t / 2` |
| 56 | `t / 2` |

River objects:

| Lane | Y | Objects |
| --- | ---: | --- |
| Top logs | 56 | repeat every 70px for `i < 210`; `log(2, riverat(56, t) + i, 56)` |
| Slow turtles | 72 | repeat every 50px for `i < 250`; `turtle(2, riverat(72, t) + i, 72)` |
| Long logs | 88 | repeat every 128px for `i < 256`; `log(5, riverat(88, t) + i, 88)` |
| Short logs | 104 | repeat every 80px for `i < 240`; `log(1, riverat(104, t) + i, 104)` |
| Turtles | 120 | repeat every 64px for `i < 256`; `turtle(3, riverat(120, t) + i, 120)` |

Coordinates should wrap or draw repeated instances so lanes appear continuous across the 224px playfield.

## Collision and Death

- Edge death: if the frog is carried or moved past the screen side limits, start death.
- Road death: when `frogy >= 136`, touching any road vehicle starts death.
- River death: when `frogy > 40` and the frog is not leaping:
  - If touching a turtle or log, the frog is safe.
  - If not touching a turtle or log, the frog drowns.
  - If touching support, move the frog horizontally by `riverat(frogy, t) - riverat(frogy, t - 1)`.
- Death animation runs for 64 ticks.
- At the end of death:
  - decrement lives.
  - if lives remain, restart only the frog.
  - if lives are exhausted, restart game state according to the chosen UX flow.

Browser adaptation: because the Gameduino collision RAM is unavailable, implement collision with deterministic sprite rectangles generated from the same lane/object draw data used by the renderer.

## Riverbank and Homes

- The riverbank/home section is reached when the frog moves above the river.
- Maintain five home X coordinates in `homes[]` and completion flags in `done[]`.
- If the frog lands within the home tolerance and the home is empty, mark it done, draw the home frog sprite, award score, and restart the frog.
- If the frog does not land in a valid empty home, start death.
- When all five homes are complete, start a new level.

The tutorial uses `abs(homes[i] - frogx) < 4` as the home tolerance. The browser implementation should preserve that unless visual atlas alignment proves the asset requires a documented adjustment.

## Scoring and Lives

- Award 10 points when a leap begins.
- Award 10 points when a home is filled, matching the tutorial.
- Track lives and decrement on death.
- The tutorial restarts the game when lives reach zero. The browser implementation may show a game-over overlay before restart if this is documented and does not affect core play.
- High score persistence is optional and should not block the core clone.

## Sound Requirements

- Sound is monophonic in spirit: one active effect based on current state.
- When dying, play a descending note based on `84 - dying / 2`.
- When leaping, alternate octave-separated notes:
  - odd `leaping`: `60 + leaping`
  - even `leaping`: `72 + leaping`
- Use Web Audio square waves. Additive odd harmonics may be used to approximate the tutorial's `squarewave` function.
- Provide a mute control because browsers and users expect it.

## Acceptance Criteria

- The game renders a coherent 224x256 Frogger playfield using the provided sprite sheet.
- Sprite mapping is data-driven and traceable to tutorial sprite IDs.
- The frog starts at `(120, 232)` and moves exactly 16px per completed leap.
- Lane positions and speeds match the tutorial formulas.
- Road collisions kill the frog.
- River water kills the frog when unsupported.
- Supported river contact carries the frog using the lane velocity delta.
- Five homes can be filled; invalid bank landings kill the frog.
- Death animation runs for 64 fixed ticks.
- Turtle animation cycles through frames `50`, `51`, `52` using `(t / 32) % 3`.
- Sound changes for leap and death states.
- A visual verification screenshot is captured for desktop and mobile-scaled layouts.

## Open Questions

- Should game-over immediately reset like the tutorial, or pause on a visible game-over state for browser usability?
- Should we generate a permanent normalized sprite atlas file from `11067.png`, or keep the original sheet plus a JSON manifest of crop rectangles?
- Should touch controls be included in the final UI, or should the clone stay keyboard-first?
