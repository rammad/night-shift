# Night Shift (repo: copy-that) — Little TV game
Read .cursor/skills/little-app/SKILL.md before Little changes. SDK 0.39.1 is vendored in vendor/little.mjs.
- src/layout.js: the one desk coordinate system (0..1). Rules and renderer both read it.
- src/minigames.js, src/shift.js, src/drunk.js: pure rules/flow/drunk-hand model. No DOM. Tested by test/game.test.js.
- src/view2d.js: 2D flat-lay renderer (960×540 drawing space, 480×270 pixel buffer, themes). No hands drawn. src/main.js: loop, HUD, input wiring, window.dockGame API.
- src/reach.js: per-hand shoulder-anchored reach boxes → desk space. src/campip.js: camera panel.
- src/input.js: mouse/keyboard, browser camera (MediaPipe), external/TV frames. little-bridge.js owns SDK integration.
Run `npm run check` and `npm test`; then `little manifest validate`.
Keep changes local; do not commit, push, link, or publish unless requested.
