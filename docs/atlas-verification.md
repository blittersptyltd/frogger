# Frogger Atlas Verification

Date: 2026-05-06

## Purpose

Phase 1 creates a data-driven mapping from the tutorial's sprite IDs to crop rectangles in `public/images/11067.png`. The preview page exists so bad crops are visible before gameplay code depends on them.

## Files

- Atlas manifest: `src/assets/frogger-atlas.js`
- Preview page: `atlas.html`
- Preview renderer: `src/atlas-preview.js`
- Preview styles: `src/atlas-preview.css`

## Required IDs Covered

- Alive frog frames: `0`, `1`, `2`
- Road vehicles: `3`, `4`, `5`, `6`, `7`, `8`
- Death frames: `30`, `31`, `32`, `33`
- Turtle frames: `50`, `51`, `52`
- Home frog: `63`
- Log pieces: `86`, `87`, `88`

## Visual Verification Notes

- The preview page renders each required tutorial ID with its semantic name and role.
- Composite checks render the tutorial's expected multi-sprite sequences:
  - frog leap sequence
  - death sequence
  - truck from frames `5` and `6`
  - turtle animation cycle
  - short and long logs from frames `86..88`
- The current mapping is suitable for review and should be treated as the canonical source for the next gameplay pass unless a crop is corrected here first.
- All required sprites are now cropped to alpha bounds and fit into 16x16 logical tiles in the preview. This removes packed-sheet padding while preserving each sprite's aspect ratio.

## Current Crop Assumptions

- Tutorial frame `4` maps to the green/white/red road object at source `[54, 116, 18, 16]`.
- Tutorial frames `5` and `6` map to the two gray truck pieces at `[72, 116, 18, 16]` and `[90, 116, 18, 16]`.
- Tutorial frame `7` maps to the magenta/cyan car at `[0, 116, 18, 16]`.
- Tutorial log frames `86..88` map to the three standalone brown pieces at `y=134`, not the larger decorative log art elsewhere on the sheet.
- Log frames are cropped to their alpha bounds and fit into 16x16 logical tiles. The packed sheet includes padding around each log piece, but the tutorial's tile model expects adjacent log sprites to touch.

## Verification Command

With the static server running:

```sh
google-chrome --headless --disable-gpu --no-sandbox --window-size=1200,1100 --screenshot=/tmp/frogger-atlas-preview.png http://127.0.0.1:4173/atlas.html
```

Manual review screenshot:

- `/tmp/frogger-atlas-preview.png`
