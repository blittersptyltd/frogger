# Mobile Pacing Design

Date: 2026-07-10

## Goal

Make Frogger more forgiving on touch-first phones without reducing input responsiveness or changing the original desktop arcade timing.

## Experience

Touch-first devices use a 75% motion pace. Road traffic, river objects, river carry, passengers, and snakes move along the same shared scaled timeline. Frog leaps, touch response, scoring, the countdown timer, sound effects, and music keep their existing timing. Desktop and keyboard-first devices remain at the classic 100% pace. Higher levels retain their existing difficulty ramp on top of each device's baseline.

The adjustment is automatic and adds no settings UI. A coarse primary pointer with no hover indicates the mobile pace. Other input profiles use classic pacing. The browser passes the chosen value into game creation once, so rotating the device cannot change difficulty during a game.

## Architecture and Data Flow

The game state stores a normalized `motionScale`. Values greater than zero are accepted; invalid values fall back to `1`. All moving hazard and support positions derive from a single paced timeline: `t * levelSpeed(level) * motionScale`. Rendering, road collision checks, river support checks, passenger placement, snake placement, and river carry use that same value. Animation frames may continue using the unscaled tick counter so sprites remain lively while their physical motion becomes easier to read.

## Verification and Deployment

Automated tests cover the classic default, invalid-value fallback, 75% road and river positioning, slower snake movement, and scaled river carry. Existing gameplay tests must continue passing at the classic default. Browser verification uses a phone-sized viewport and confirms the touch input profile selects the mobile pace without layout or console regressions. The verified commit deploys through the existing GitHub Pages workflow.
