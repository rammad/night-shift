// One desk, one coordinate system. Rules and art both read from here.
// Desk space: x 0..1 left→right, y 0..1 far→near (top of screen → bottom), on the desk top.
// DESK gives the metres that span covers in the 3D scene.
export const DESK = { w: 1.6, d: .9 };

export const LAYOUT = {
  opener: { x: .5, y: .52 },                 // the flip phone
  restart: { x: .36, y: .62 },               // the phone on the results screen (left of the score card)
  form: { x: .5, y: .55, w: .1955, h: .506 },   // stamp task paper
  pads: { approved: { x: .2, y: .4 }, rejected: { x: .2, y: .68 } },
  pile: { x: .2, y: .55 },                   // copy task blank sheets
  copier: { x: .71, y: .42 },                // copier top centre
  glass: { x: .68, y: .4 },
  staplePaper: { w: .4, h: .5 },            // shared render and staple-hit bounds
  stapleY: .62,                              // where a fresh stack slides in
  stapler: { x: .5, y: .4 },                 // the fixed stapler's nose
};

