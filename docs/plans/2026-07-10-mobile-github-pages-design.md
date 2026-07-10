# Mobile Frogger and GitHub Pages Design

Date: 2026-07-10

## Goal

Make the existing Frogger clone feel native and responsive on a phone while preserving its pixel-art presentation, deterministic game loop, desktop keyboard controls, and dependency-free static architecture. Publish the result at the repository's GitHub Pages URL for real-device testing.

## Experience

The game uses a hybrid mobile control scheme. Players can swipe on the game canvas for fast directional movement or use a large four-way pad for precise moves. A single primary Play button handles the arcade coin-and-start sequence in one tap, while sound remains independently controllable. Touch targets are at least 48 pixels, controls provide visible pressed feedback, and supported devices receive subtle vibration feedback.

The phone layout fills the available viewport without document scrolling, respects safe-area insets, and sizes the 240-by-256 canvas as large as the screen and controls allow. Portrait mode stacks the canvas, Play/Sound actions, and direction pad. Landscape mode places the game beside the controls so short screens remain playable. Desktop keeps a centered arcade-cabinet presentation and keyboard controls.

## Architecture and Data Flow

The game model and renderer remain unchanged. `src/app.js` adapts browser input into the existing `requestMove`, `insertCoin`, and `startGame` functions. Pointer events drive the direction pad. A gesture controller records the initial canvas pointer position and converts a sufficiently long, primarily horizontal or vertical swipe into one movement request. The Play action inserts a credit only when needed and immediately starts the game.

Layout and device adaptation remain in `src/styles.css`; no framework or build step is introduced. Semantic labels and live control text make the interface understandable to assistive technology. Pointer cancellation, non-primary pointers, and gestures below the movement threshold are ignored so taps do not cause accidental moves. Vibration is treated as optional progressive enhancement.

## Verification and Deployment

Existing Node tests must continue to pass. Browser verification covers 320-pixel portrait, 390-pixel portrait, phone landscape, and desktop layouts, including Play, swipe, direction-pad, sound, overflow, and minimum touch-target checks. A GitHub Actions Pages workflow deploys the static repository root with the least permissions required. The public page is verified after deployment at `https://blittersptyltd.github.io/frogger/`.
