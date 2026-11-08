// Every number that decides how the game *feels*, in one place.
// Distances are desk units (0..1 across the desk), speeds are desk units / second.
// Check changes with `node test/sim.mjs` (bot playtest) before trying them by hand.
export const TUNING = {
  // How drunk hands move. Each value goes sober → max drunk (level 0 → 4).
  drunk: {
    stiffness: [30, 24],     // spring rate chasing your real hand: lower = heavier, laggier
    damping: [1, 1],       // 1 = no overshoot; lower = wobbly overshoot past where you aimed
    drift: [0, 0],    // slow wander of each hand even when you hold still
    driftSpeed: [.7, 1.1],  // how fast that wander changes (Hz-ish)
    sway: [0, 0],      // whole-body lean shared by both hands (and the camera)
    hiccupsPerSec: 0,     // per drunk level: sudden upward jolt of both hands
  },
  levels: { bar: 2.6, firstJob: 3, perJob: .5 }, // drunk level at the bar, job 1, and added per job

  stamp: {
    duration: 15,
    inkRadius: .07, inkMaxSpeed: 1.4,   // rest on a pad (not just swipe past) to ink
    dwell: .45, calmSpeed: .6,          // hold still this long (below this speed) and it thumps
    perfect: .04, good: .085,           // distance from the target box centre
  },
  copy: {
    duration: 20,
    pileRadius: .08, glassRadius: .085,
    slipSpeed: 3.0, slipPerLevel: .3,   // carry the sheet faster than this and it may flutter off
    slipChance: 2.6,                    // per (unit of excess speed × second)
    scanTime: 1.3, calmSpeed: .7,       // hold the sheet over the glass, calmer than this, for this long
  },
  staple: {
    duration: 12,
    interval: 2,                       // automatic strike every two seconds
    cornerX: .094, cornerY: -.115,      // corner mark offset from the stack centre (= your left hand)
    tolerance: .06,                    // how close the corner must be to the stapler's nose
    armY: .4, slamY: .6,                // right hand above armY raises the stapler; swinging down past slamY slams it
    slamTravel: .16,                  // relative downward travel: slam anywhere on screen
    slamSpeed: 1.0,                     // swinging down slower than this is a limp tap
  },
  raise: { upY: .32, downY: .45, hold: .6 }, // hands-up to open the phone: above upY for hold seconds
  // One-handed reach (camera/TV). Units are shoulder widths, so it scales with distance.
  reach: {
    out: .525,          // each hand's box is centred this far outside its own shoulder…
    down: .6,         // …and this far below shoulder height
    spanX: 2.05,       // box width  → the whole desk width
    spanY: 1.75,       // box height → the whole desk height
    follow: 1.0,      // seconds for the boxes to follow you when you shift around
    minShoulder: .04, minScore: .2,
  },
};
