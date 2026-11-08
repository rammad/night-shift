// Tiny synthesized sound effects: no audio files. Starts on the first user gesture.
let ctx = null, master = null, noiseBuf = null;
export function unlockAudio() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = .5; master.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  } catch { ctx = null; }
}
function tone(freq, dur, { type = 'square', vol = .3, slide = 0, delay = 0 } = {}) {
  if (!ctx) return; const t = ctx.currentTime + delay;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
  o.connect(g).connect(master); o.start(t); o.stop(t + dur + .02);
}
function noise(dur, { vol = .3, freq = 1200, q = 1, delay = 0, type = 'bandpass' } = {}) {
  if (!ctx) return; const t = ctx.currentTime + delay;
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = noiseBuf; f.type = type; f.frequency.value = freq; f.Q.value = q;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
  s.connect(f).connect(g).connect(master); s.start(t, Math.random() * .5); s.stop(t + dur + .02);
}
const SOUNDS = {
  grip: () => tone(180, .06, { vol: .12 }),
  flip: () => { noise(.05, { vol: .4, freq: 2500, q: 2 }); tone(1400, .05, { delay: .03, vol: .15 }); },
  message: () => { [880, 1175, 880, 1175].forEach((f, i) => tone(f, .09, { delay: i * .12, vol: .14 })); },
  lamp_on: () => { noise(.045, { vol: .65, freq: 2400, q: 2 }); tone(110, .12, { type: 'sine', vol: .12, delay: .04 }); },
  fade: () => tone(220, 1.2, { type: 'sine', vol: .12, slide: -120 }),
  intro: () => { tone(523, .1, { type: 'triangle' }); tone(659, .1, { type: 'triangle', delay: .12 }); },
  go: () => { tone(784, .08, { type: 'triangle' }); tone(1046, .15, { type: 'triangle', delay: .09 }); },
  pickup: () => tone(520, .05, { type: 'triangle', vol: .15 }),
  stamp: () => { noise(.065, { vol: .35, freq: 260, q: .7 }); tone(105, .1, { type: 'sine', vol: .22, slide: -45 }); [784, 1046].forEach((f, i) => tone(f, .1, { delay: .05 + i * .07, vol: .16, type: 'triangle' })); },
  wrong: () => { noise(.09, { vol: .6, freq: 220, q: 1 }); tone(170, .3, { type: 'sawtooth', vol: .2, delay: .05 }); },
  grab: () => noise(.07, { vol: .25, freq: 3000, q: 1 }),
  drop: () => { noise(.4, { vol: .15, freq: 2000, q: .5 }); tone(600, .3, { type: 'triangle', slide: -350, vol: .15 }); },
  place: () => noise(.06, { vol: .3, freq: 1500, q: 1.5 }),
  copy: () => { tone(660, .06, { vol: .14 }); },
  copied: () => { noise(.25, { vol: .2, freq: 2500, q: .8 }); tone(1320, .08, { delay: .2, vol: .12, type: 'triangle' }); },
  beep: () => tone(1500, .05, { vol: .1 }),
  jam: () => [400, 300].forEach((f, i) => tone(f, .14, { type: 'square', delay: i * .14, vol: .14 })),
  staple: () => { noise(.035, { vol: .3, freq: 1900, q: 1 }); tone(130, .09, { type: 'sine', vol: .24, slide: -55 }); [659, 988].forEach((f, i) => tone(f, .1, { delay: .06 + i * .07, vol: .14, type: 'triangle' })); },
  clack: () => { noise(.08, { vol: .6, freq: 900, q: 2 }); tone(110, .1, { type: 'sine', vol: .35 }); },
  ouch: () => { noise(.08, { vol: .5, freq: 800 }); tone(600, .45, { type: 'sawtooth', vol: .2, slide: 500 }); },
  fizzle: () => tone(220, .2, { type: 'triangle', vol: .12, slide: -90 }),
  timeup: () => { tone(880, .12, { type: 'triangle' }); tone(660, .12, { type: 'triangle', delay: .14 }); tone(440, .3, { type: 'triangle', delay: .28 }); },
  results: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, .18, { delay: i * .12, vol: .18, type: 'triangle' })),
  hiccup: () => tone(420, .07, { type: 'triangle', vol: .2, slide: 320 }),
};
export function play(type) { SOUNDS[type]?.(); }
// Copier hum while it's scanning.
let humOsc = null;
export function hum(on) {
  if (!ctx) return;
  if (on && !humOsc) { humOsc = ctx.createOscillator(); const g = ctx.createGain(); humOsc.type = 'sawtooth'; humOsc.frequency.value = 95; g.gain.value = .05; humOsc.connect(g).connect(master); humOsc.start(); }
  if (!on && humOsc) { humOsc.stop(); humOsc = null; }
}
