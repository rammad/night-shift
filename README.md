# Night Shift — drunk office worker (Little TV game)

It's 11:47 PM, you're at the bar, and your boss texts. Flip the phone open, get called in, and fumble through the paperwork as fast as you can. You're drunk from the first frame and it creeps up each job: everything you control drifts, overshoots and hiccups, the view sways, and you see double.

Run `npm start` and open http://localhost:5173 (set `PORT` to change it). No install or build step. It's plain 2D canvas: a flat-lay desk drawn at 480×270 and upscaled with hard pixels, plus an RGB split, dither and scanlines. No hands are drawn. You only see what you control.

## Flow
1. **Phone (black screen).** A buzzing flip phone. Raise both hands above your head and hold them there to flip it open. Your hands must be down first. BOSS: *"Need you in the office. Now."* The screen fades to black, then the office desk appears.
2. **Three jobs back to back**, each timed:
   - **STAMP (15s).** The right hand *is* the stamp. Rest it on an ink pad to ink it APPROVED or REJECTED. Each form asks for one and has its target in a different spot. Hold the stamp over the form and keep calm: it thumps down by itself where it is. Re-ink after every impression. A dry stamp does nothing.
   - **COPY (20s).** Grab a sheet off the pile, hold it over the copier glass, and keep it still until the scan light finishes (1.3s). Then grab the next one. Wave a sheet too hard and it flutters away.
   - **STAPLE (12s).** The stapler is fixed on the desk. Your left hand moves the papers: line the corner mark up under the stapler's nose (it turns green). Then raise your right hand and swing it down to staple. Swinging while it's not lined up is a miss.
3. **Results.** Raise both hands again to go again.

Score per job = done × 100 − fumbles × 25. Drunkenness is 2.6 at the bar, then 3, 3.5 and 4 across the jobs.

## Controls
No keyboard needed. **Reach:** each hand gets its own box of space out beside its own shoulder, sized by your shoulder width, and that box maps onto the whole desk, so one hand reaches everywhere without crossing your body (tune it in `TUNING.reach`). The camera panel (bottom-right) shows your skeleton and both reach boxes. On the TV, pose tracking starts by itself at 30 fps when the app opens. Each wrist is used on its own: if a wrist isn't seen, the forearm past the elbow stands in, and a missing hand holds its last spot for a second. Small L/R X marks show where the game thinks each hand is (`?nomarks` hides them). Dev controls are hidden; add `?dev` to the URL to show them.

- **Mouse (dev):** right hand. The left hand mirrors it (phone), sits out of the way (stamp/copy), or holds the papers still (staple). Hold Shift or right-click to keep the left hand still. Space raises both. Arrows move. T cycles themes. H hides the dev bar.
- **Themes:** the four flat-lay palettes (Warm Minimal, Studio Grid, Quiet Mono, Soft Industrial), from the dev bar, the `T` key, or `?theme=warm|studio|mono|industrial`. Remembered per browser.
- **Camera:** ENABLE CAMERA (browser MediaPipe pose; keep both wrists in view).
- **TV:** `sense.pose` wrists stream through `window.dockInput`. `get_status` reports `poseFrames`, `acceptedFrames` and `seen` (wrist / elbow / held counts). Arrows plus Enter still work as a remote fallback.
- `?practice=stamp|copy|staple` jumps straight into one job.

## Tuning the feel
Every feel number lives in `src/tuning.js`: how heavy and wobbly the drunk hands are, drunk levels per job, dwell times, hit sizes, slip speed, copier time, slam speed and so on. `npm run sim` runs a bot playtest. A "decent human" bot plays each job through the real drunk-hand model and rules at every level and prints done/fumbles. `RUSH=1.6 npm run sim` plays faster to check that rushing is a risk/reward trade.

Current pace (careful bot, 24 runs each): stamp at L3 ≈ 7.6 done / 1 fumble, copy at L3.5 ≈ 7.9 / 0.1, staple at L4 ≈ 5.6 / 0.8. Rushing earns about one extra copy for about one extra drop, costs accuracy on stamps, and fumbles more staples.

## Code map
- `src/tuning.js`: all feel constants.
- `src/layout.js`: the single desk coordinate system (0..1 across the 960×540 desk). The rules and the renderer both read it.
- `src/minigames.js`: Opener (phone pull-apart), StampGame, CopyGame, StapleGame. Pure rules.
- `src/shift.js`: phone → message → fade → three jobs → results. Save/restore.
- `src/drunk.js`: the drunk-hand model (under-damped spring, drift, sway, hiccups).
- `src/view2d.js`: flat-lay renderer, themes, the tools as cursors, and the drunk + pixel post (sway, roll, zoom, double vision, RGB split, dither, scanlines, shake, flash).
- `src/input.js`: mouse/keyboard, browser camera, external frames. `src/sfx.js`: synthesized sounds.
- `src/main.js`: loop, HUD, `window.dockGame` API. `little-bridge.js`: Little SDK tools, pose, pause/resume, persistence.

`npm run check` runs syntax checks. `npm test` runs the rules and flow tests. The Little tools are start_shift, pause_game, resume_game, enable_tracking, use_remote and get_status.

## Status
The 3D renderer and the fisherman theme were removed. `showcase/` still holds the old fisherman GLB models and is no longer used by the game. Webcam and TV feel still need hands-on playtesting.

## Current playtest controls

Setup checks centering and at least one hand. Raise either hand to continue and answer the phone. Stamp targets use six preset layouts with margins inside the paper; an inked stamp fires instantly on target entry. Copying still requires a steady hold. Stapling uses the active hand to move a larger paper stack under an automatic two-second stapler. Every miss leaves a staple on that sheet; a correctly aligned strike scores and brings in a fresh stack. The large centered timer turns amber at eight seconds, red at five, and pulses faster at three.

Artificial hand drift, overshoot, and hiccups are disabled; camera smoothing remains. The camera preview is hidden after setup. Normal shifts run stamp, copy, staple once each; repeated start or host-entry calls preserve a running shift. Reload to begin a fresh night.
