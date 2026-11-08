import { CONVERSATION, MESSAGE_SECONDS, CONVERSATION_SECONDS } from './conversation.js';
import { LAYOUT } from './layout.js';
import { clamp, noise } from './util.js';
import { TUNING } from './tuning.js';

// Flat-lay 2D renderer. Desk space (layout.js, 0..1) maps onto a 960×540 drawing space that is
// rendered at half resolution (480×270) and upscaled with hard pixels. No hands: you only see
// what you control — the stamp, the sheet you carry, the stapler, the paperweight.
// Drunk + pixel post: sway, roll, breathing zoom, double vision, RGB split, ordered dither.
export const W = 960, H = 540;
const LOW = .5, LW = W * LOW, LH = H * LOW;
const X = x => x * W, Y = y => y * H;

export const THEMES = {
  warm: { name: '01 / WARM MINIMAL', desk: '#e2b58f', grain: '#d6a67d', item: '#f2ebdf', itemDark: '#e2d8c8', accent: '#c25a3c', dark: '#3a3430', paper: '#fbf8f1', line: '#d8d0c4', shadow: 'rgba(110,60,25,.28)', leaf: '#4f7a3a', glass: '#7d8f97', copyBtn: '#6dbf7e' },
  studio: { name: '02 / STUDIO GRID', desk: '#cdd2db', grain: '#c4c9d3', item: '#f5f6f8', itemDark: '#e3e6ec', accent: '#2f4f93', dark: '#1f2738', paper: '#ffffff', line: '#d3d8e2', shadow: 'rgba(40,55,90,.24)', leaf: null, glass: '#56688c', copyBtn: '#5c8fe0' },
  mono: { name: '03 / QUIET MONO', desk: '#38393b', grain: '#333436', item: '#e7e2d9', itemDark: '#cfcac1', accent: '#8f8f8f', dark: '#222222', paper: '#f3f0ea', line: '#cfcac1', shadow: 'rgba(0,0,0,.42)', leaf: null, glass: '#5e6166', copyBtn: '#d8d3ca' },
  industrial: { name: '04 / SOFT INDUSTRIAL', desk: '#a9b2a3', grain: '#a1aa9b', item: '#ede7d7', itemDark: '#d9d2c0', accent: '#6e7d58', dark: '#2c2c2a', paper: '#f7f3e8', line: '#d6cfbd', shadow: 'rgba(40,50,30,.28)', leaf: null, glass: '#7a8470', copyBtn: '#9db27a' },
};
const INK = { approved: '#3f8a57', rejected: '#c84f3c' };
const CONFETTI = ['#f2c14e', '#e87f6a', '#7cc49a', '#8aa7e0'];

function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
function text(g, s, x, y, size, color, align = 'center') {
  g.font = `${size}px Silkscreen, monospace`; g.textAlign = align; g.textBaseline = 'middle'; g.fillStyle = color; g.fillText(s, x, y);
}

export class View2D {
  constructor(canvas, theme = 'warm') {
    this.canvas = canvas; canvas.width = LW; canvas.height = LH;
    this.out = canvas.getContext('2d');
    const mk = () => { const c = Object.assign(document.createElement('canvas'), { width: LW, height: LH }); const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return [c, g]; };
    [this.buf, this.g] = mk(); [this.mix, this.mg] = mk(); [this.chan, this.cg] = mk();
    this.g.scale(LOW, LOW);
    this.dither = this.makeDither();
    this.showMarks = true; this.t = 0; this.trauma = 0; this.flash = 0; this.fade = 0; this.parts = []; this.pops = [];
    this.setTheme(theme);
  }
  setTheme(key) { this.themeKey = THEMES[key] ? key : 'warm'; this.th = THEMES[this.themeKey]; this.desk = this.paintDesk(); }
  nextTheme() { const k = Object.keys(THEMES); this.setTheme(k[(k.indexOf(this.themeKey) + 1) % k.length]); return this.th.name; }

  makeDither() {
    const c = Object.assign(document.createElement('canvas'), { width: 4, height: 4 }), g = c.getContext('2d');
    const m = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    m.forEach((v, i) => { g.fillStyle = `rgba(${v > 7 ? '255,255,255' : '0,0,0'},${Math.abs(v - 7.5) / 7.5 * .045})`; g.fillRect(i % 4, i >> 2, 1, 1); });
    return this.out.createPattern(c, 'repeat');
  }

  // Everything sits on the desk with a soft drop shadow, flat-lay style. lift raises it off the desk.
  soft(g, lift = 0, fn) {
    g.save(); g.shadowColor = this.th.shadow; g.shadowBlur = 10 + lift * 40; g.shadowOffsetX = 4 + lift * 30; g.shadowOffsetY = 6 + lift * 46; fn(); g.restore();
  }

  // ---------------------------------------------------------------- static desk
  paintDesk() {
    const th = this.th, c = Object.assign(document.createElement('canvas'), { width: W, height: H }), g = c.getContext('2d');
    g.fillStyle = th.desk; g.fillRect(0, 0, W, H);
    g.fillStyle = th.grain; for (let y = 6; y < H; y += 11) g.fillRect(0, y, W, (y * 7) % 3 === 0 ? 2 : 1);
    const S = fn => this.soft(g, 0, fn);
    // Coffee.
    S(() => { g.beginPath(); g.arc(X(.085), Y(.15), 44, 0, 7); g.fillStyle = th.item; g.fill(); }); rr(g, X(.085) + 38, Y(.15) - 10, 26, 20, 9); g.fillStyle = th.item; g.fill();
    g.beginPath(); g.arc(X(.085), Y(.15), 34, 0, 7); g.fillStyle = '#3b2418'; g.fill(); g.beginPath(); g.arc(X(.085) - 8, Y(.15) - 10, 7, 0, 7); g.fillStyle = '#ffffff22'; g.fill();
    if (th.leaf) { g.save(); g.translate(-10, -4); g.rotate(.6); g.fillStyle = th.leaf; g.fillRect(0, 0, 150, 3); for (let i = 0; i < 5; i++) { g.beginPath(); g.ellipse(25 + i * 26, i % 2 ? 16 : -14, 18, 9, i % 2 ? .6 : -.6, 0, 7); g.fill(); } g.restore(); }
    // Organizer tray: pens, paper clips, binder clips, empty slot.
    const ox = X(.3), oy = Y(.02), ow = 290, oh = 88;
    S(() => { rr(g, ox, oy, ow, oh, 12); g.fillStyle = th.itemDark; g.fill(); });
    rr(g, ox + 8, oy + 8, ow - 16, 30, 7); g.fillStyle = th.item; g.fill();
    [[th.dark, 0], ['#d9d2c4', 12]].forEach(([col, dy]) => { rr(g, ox + 24, oy + 15 + dy, 200, 6, 3); g.fillStyle = col; g.fill(); });
    for (let i = 0; i < 3; i++) { rr(g, ox + 8 + i * 93, oy + 44, 85, 36, 7); g.fillStyle = th.item; g.fill(); }
    g.strokeStyle = '#a9a39a'; g.lineWidth = 2; for (let i = 0; i < 3; i++) { rr(g, ox + 22 + i * 13, oy + 50, 10, 24, 5); g.stroke(); }
    g.fillStyle = th.dark; for (let i = 0; i < 2; i++) { rr(g, ox + 118 + i * 26, oy + 58, 18, 16, 3); g.fill(); g.fillRect(ox + 122 + i * 26, oy + 48, 2, 10); g.fillRect(ox + 130 + i * 26, oy + 48, 2, 10); }
    g.setLineDash([5, 4]); g.strokeStyle = '#b9b1a5'; rr(g, ox + 205, oy + 50, 66, 24, 4); g.stroke(); g.setLineDash([]);
    // Calculator.
    S(() => { rr(g, X(.88) - 48, Y(.03), 96, 112, 10); g.fillStyle = th.item; g.fill(); });
    rr(g, X(.88) - 38, Y(.03) + 10, 76, 22, 4); g.fillStyle = th.glass; g.fill();
    for (let i = 0; i < 12; i++) { rr(g, X(.88) - 38 + (i % 4) * 20, Y(.03) + 40 + Math.floor(i / 4) * 22, 16, 16, 3); g.fillStyle = th.itemDark; g.fill(); }
    // Notebook down the left edge.
    S(() => { rr(g, -30, Y(.3), 100, 230, 8); g.fillStyle = th.item; g.fill(); });
    g.fillStyle = th.accent; g.fillRect(52, Y(.3), 8, 230);
    g.fillStyle = '#9a9288'; for (let y = Y(.3) + 12; y < Y(.3) + 222; y += 14) g.fillRect(-4, y, 10, 3);
    // Tape roll, ruler, envelope, sticky note.
    S(() => { g.beginPath(); g.arc(X(.955), Y(.62), 30, 0, 7); g.fillStyle = th.item; g.fill(); }); g.beginPath(); g.arc(X(.955), Y(.62), 15, 0, 7); g.fillStyle = th.desk; g.fill();
    S(() => { rr(g, X(.3), Y(.9), 380, 30, 5); g.fillStyle = th.item; g.fill(); });
    g.fillStyle = '#b5ada0'; for (let i = 0; i < 38; i++) g.fillRect(X(.3) + 10 + i * 10, Y(.9), 1.5, i % 5 ? 7 : 12);
    S(() => { rr(g, X(.04), Y(.82), 110, 72, 4); g.fillStyle = th.paper; g.fill(); });
    g.strokeStyle = th.line; g.lineWidth = 2; g.beginPath(); g.moveTo(X(.04) + 4, Y(.82) + 4); g.lineTo(X(.04) + 55, Y(.82) + 40); g.lineTo(X(.04) + 106, Y(.82) + 4); g.stroke();
    S(() => { g.fillStyle = th.themeKey === 'studio' ? th.accent : '#f6dca8'; g.fillStyle = this.themeKey === 'studio' ? th.accent : this.themeKey === 'mono' ? '#c9c4bb' : this.themeKey === 'industrial' ? th.accent : '#f7deac'; g.fillRect(X(.86), Y(.8), 70, 70); });
    return c;
  }

  // ---------------------------------------------------------------- props
  paper(x, y, w, h, a = 0, lift = 0, lines = true) {
    const g = this.g, th = this.th;
    g.save(); g.translate(x, y); g.rotate(a);
    this.soft(g, lift, () => { g.fillStyle = th.paper; g.fillRect(-w / 2, -h / 2, w, h); });
    if (lines) { g.fillStyle = th.line; for (let ly = -h / 2 + 16; ly < h / 2 - 10; ly += 10) g.fillRect(-w / 2 + 12, ly, (w - 24) * (.45 + ((ly * 13 + 400) % 40) / 80), 3); }
    g.restore();
  }
  inkPad(kind, x, y, active) {
    const g = this.g, th = this.th;
    this.soft(g, 0, () => { rr(g, x - 42, y - 26, 84, 52, 8); g.fillStyle = th.dark; g.fill(); });
    rr(g, x - 34, y - 18, 68, 36, 5); g.fillStyle = INK[kind]; g.fill();
    g.fillStyle = '#ffffff22'; g.fillRect(x - 30, y - 14, 60, 6);
    text(g, kind === 'approved' ? 'APPROVED' : 'REJECTED', x, y + 40, 16, active ? INK[kind] : th.dark);
  }
  // The stamp from above: wooden base, rubber rim in its ink colour, round knob. It is the cursor.
  stampTool(x, y, ink, lift) {
    const g = this.g, th = this.th, k = 1 + lift * .9;
    // Aim mark on the desk under it.
    g.strokeStyle = ink ? INK[ink] : th.dark; g.globalAlpha = .55; g.lineWidth = 3; g.setLineDash([6, 5]); g.strokeRect(x - 36, y - 12, 72, 24); g.setLineDash([]); g.globalAlpha = 1;
    g.save(); g.translate(x, y); g.scale(k, k);   // centred exactly on your hand; height shows as size + shadow
    this.soft(g, lift, () => { rr(g, -40, -24, 80, 48, 6); g.fillStyle = ink ? INK[ink] : '#a8a097'; g.fill(); });
    rr(g, -35, -19, 70, 38, 5); g.fillStyle = '#c99b6a'; g.fill();
    g.fillStyle = '#ffffff30'; g.fillRect(-31, -15, 62, 5);
    this.soft(g, lift * .5, () => { g.beginPath(); g.arc(0, 0, 15, 0, 7); g.fillStyle = th.accent; g.fill(); });
    g.beginPath(); g.arc(-4, -5, 5, 0, 7); g.fillStyle = '#ffffff40'; g.fill();
    g.restore();
    if (!ink) text(g, 'DRY', x, y + 34, 16, th.dark);
  }
  mark(kind, x, y, a) {
    const g = this.g; g.save(); g.translate(x, y); g.rotate(a); g.globalAlpha = .85;
    g.strokeStyle = INK[kind]; g.lineWidth = 4; g.strokeRect(-46, -14, 92, 28); text(g, kind === 'approved' ? 'APPROVED' : 'REJECTED', 0, 1, 16, INK[kind]);
    g.restore();
  }
  ring(x, y, color, r = 14) { const g = this.g; g.strokeStyle = color; g.lineWidth = 4; g.globalAlpha = .8; g.beginPath(); g.arc(x, y, r, 0, 7); g.stroke(); g.globalAlpha = 1; }
  // Flip phone lying on the counter. open 0..1 unfolds the keypad half downward.
  phone(x, y, s, open, msg) {
    const g = this.g, th = this.th; g.save(); g.translate(x, y); g.scale(s, s);
    const lidH = 92, body = '#cbbfd9', bodyDark = '#b3a6c4';
    if (open > .02) {
      this.soft(g, 0, () => { rr(g, -42, -4, 84, 100 * open, 14); g.fillStyle = bodyDark; g.fill(); });
      if (open > .6) {
        rr(g, -32, 8, 20, 9, 4); g.fillStyle = '#6dbf7e'; g.fill(); rr(g, 12, 8, 20, 9, 4); g.fillStyle = '#e07060'; g.fill();
        for (let i = 0; i < 12; i++) { const kx = -26 + (i % 3) * 26, ky = 26 + Math.floor(i / 3) * 16; rr(g, kx - 10, ky, 20, 12, 4); g.fillStyle = '#ece6f2'; g.fill(); text(g, '123456789*0#'[i], kx, ky + 6.5, 8, '#5a4e68'); }
      }
    }
    this.soft(g, 0, () => { rr(g, -42, -lidH, 84, lidH, 16); g.fillStyle = body; g.fill(); });
    if (open > .3) {
      rr(g, -33, -lidH + 12, 66, 66, 6); g.fillStyle = '#c2e6a6'; g.fill();
      if (msg) {
        g.fillStyle = '#28432e'; g.fillRect(-29, -lidH + 26, 58, 12); text(g, msg.who, -25, -lidH + 32, 8, '#c2e6a6', 'left');
        // Measure with the actual pixel font; keep all lines inside the 58×34 text area.
        g.font = '8px Silkscreen, monospace';
        const widest = Math.max(...msg.lines.map(line => g.measureText(line).width), 1);
        const fontSize = Math.min(8, 8 * 56 / widest);
        msg.lines.forEach((l, i) => text(g, l, -28, -lidH + 44 + i * 8.5, fontSize, '#28432e', 'left'));
        if (Math.sin(this.t * 6) > 0) { g.fillStyle = '#28432e'; g.fillRect(-29, -lidH + 15, 10, 7); }
      } else text(g, '11:47', 0, -lidH + 44, 16, '#28432e');
    } else {
      rr(g, -16, -lidH + 22, 32, 20, 5); g.fillStyle = Math.sin(this.t * 5) > 0 ? '#d4ffb8' : '#a3d2ac'; g.fill();
      g.fillStyle = '#28432e'; g.fillRect(-7, -lidH + 28, 14, 8);
    }
    g.fillStyle = '#8f80a3'; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(-8 + i * 8, -lidH + 6, 2, 0, 7); g.fill(); }
    g.restore();
  }
  copier(game) {
    const g = this.g, th = this.th, cx = X(LAYOUT.copier.x), cy = Y(LAYOUT.copier.y), w = 300, h = 236, x0 = cx - w / 2, y0 = cy - h / 2;
    // Output tray on the right, copies stacking up.
    this.soft(g, 0, () => { rr(g, x0 + w - 10, cy - 36, 72, 100, 8); g.fillStyle = th.itemDark; g.fill(); });
    const n = game.count;
    for (let i = 0; i < Math.min(n, 10); i++) this.paper(x0 + w + 26 + (i === n - 1 ? -game.ejected * 40 : 0), cy + 14 - i * 3, 58, 76, (i % 3 - 1) * .05);
    this.soft(g, 0, () => { rr(g, x0, y0, w, h, 16); g.fillStyle = th.item; g.fill(); });
    g.fillStyle = th.itemDark; for (let i = 0; i < 6; i++) g.fillRect(x0 + 20 + i * 12, y0 + h - 26, 6, 14);
    const gx = X(LAYOUT.glass.x), gy = Y(LAYOUT.glass.y);
    rr(g, gx - 82, gy - 72, 164, 144, 8); g.fillStyle = th.glass; g.fill();
    g.fillStyle = '#ffffff22'; g.fillRect(gx - 72, gy - 62, 26, 124);
    // Flatbed open (lid propped up behind). Hold a sheet over the glass: the scan light sweeps it.
    rr(g, gx - 88, y0 - 18, 176, 22, 8); g.fillStyle = th.itemDark; g.fill();
    if (game.scan > 0) {
      const k = game.scan / TUNING.copy.scanTime, sx = gx - 80 + k * 160;
      g.save(); g.shadowColor = '#b8ffcf'; g.shadowBlur = 24; g.fillStyle = '#d8ffe4'; g.fillRect(sx - 4, gy - 72, 8, 144); g.restore();
    }
    text(g, 'HOLD SHEET HERE', gx, gy + 88, 16, th.dark);
  }
  // Fixed desk stapler from above. Nose at (x, y); the body angles away up-right, off the paper,
  // so it reaches over the stack's top-right corner. open 0..1 = how far the head is up.
  stapler(x, y, open, closed) {
    const g = this.g, th = this.th, s = 1.2;
    g.save(); g.translate(x, y); g.rotate(-Math.PI * .75); g.scale(s, s);
    this.soft(g, 0, () => { rr(g, -20, -12, 40, 128, 12); g.fillStyle = th.dark; g.fill(); });     // base
    const up = closed ? 0 : open, k = 1 + up * .18;                                                      // head lifts toward the camera
    g.save(); g.translate(0, 100); g.scale(k, k); g.translate(0, -100);
    this.soft(g, up * .35, () => { rr(g, -15, -8 - up * 6, 30, 112 + up * 6, 10); g.fillStyle = th.accent; g.fill(); });
    g.fillStyle = '#ffffff30'; g.fillRect(-10, -2 - up * 6, 5, 86);
    g.restore(); g.restore();
  }
  burst(x, y, colors, n = 12, power = 1) {
    for (let i = 0; i < n; i++) this.parts.push({ x, y, vx: (Math.random() - .5) * 420 * power, vy: -Math.random() * 380 * power, life: .6 + Math.random() * .4, c: colors[i % colors.length], a: Math.random() * 6 });
  }
  pop(x, y, s, color) { this.pops.push({ x, y, s, color, life: 1 }); }

  // ---------------------------------------------------------------- events
  event(e, shift) {
    const kick = { flip: .3, stamp: .26, wrong: .15, copy: .08, jam: .2, staple: .3, clack: .1, ouch: .9, drop: .2, timeup: .3 }[e.type];
    if (kick) this.trauma = Math.min(1, this.trauma + kick);
    const r = shift.hands.right, g = shift.game;
    if (e.type === 'stamp') { this.flash = .055; this.burst(X(e.x), Y(e.y), CONFETTI, 14); this.pop(X(e.x), Y(e.y) - 40, `${e.grade}! +100`, INK.approved); }
    if (e.type === 'wrong') { this.flash = -.18; this.pop(X(e.x), Y(e.y) - 40, `${e.grade} −25`, INK.rejected); }
    if (e.type === 'copied') { this.burst(X(LAYOUT.copier.x) + 186, Y(LAYOUT.copier.y), CONFETTI, 10, .6); this.pop(X(LAYOUT.glass.x), Y(LAYOUT.glass.y) - 90, 'COPIED! +100', INK.approved); }
    if (e.type === 'drop') this.pop(X(r.x), Y(r.y) - 40, 'WHOOPS −25', INK.rejected);
    if (e.type === 'staple') { this.burst(X(e.x), Y(e.y), CONFETTI, 14); this.pop(X(e.x), Y(e.y) - 50, 'CLACK! +100', INK.approved); }
    if (e.type === 'clack') { this.burst(X(e.x), Y(e.y), [this.th.paper], 6, .5); this.pop(X(e.x), Y(e.y) - 50, 'MISSED −25', INK.rejected); }
    if (e.type === 'ouch') { this.flash = -.3; this.pop(X(e.x), Y(e.y) - 60, 'OUCH! −25', INK.rejected); }
  }

  // ---------------------------------------------------------------- frame
  render(shift, dt) {
    this.t += dt; const g = this.g, s = shift.state, game = shift.game, h = shift.hands;
    const atBar = s === 'phone' || s === 'message' || s === 'fade';
    const inGame = s === 'intro' || s === 'play' || s === 'roundEnd';
    this.fade = s === 'fade' ? clamp(this.fade + dt * 1.4) : s === 'intro' ? 0 : this.fade * Math.max(0, 1 - dt * 5);
    if (atBar) this.drawBar(shift);
    else {
      g.drawImage(this.desk, 0, 0);
      // Pool of warm light cast by the switched-on desk lamp.
      const beam = g.createRadialGradient(140, 80, 10, 440, 280, 650);
      beam.addColorStop(0, 'rgba(255,239,176,.23)'); beam.addColorStop(1, 'rgba(30,22,14,.14)');
      g.fillStyle = beam; g.fillRect(0, 0, W, H);
      g.strokeStyle = '#343532'; g.lineWidth = 9; g.beginPath(); g.moveTo(70, 115); g.lineTo(95, 45); g.lineTo(155, 55); g.stroke();
      g.fillStyle = '#52634c'; g.beginPath(); g.moveTo(128, 45); g.lineTo(180, 45); g.lineTo(194, 79); g.lineTo(114, 79); g.closePath(); g.fill();
      g.fillStyle = '#ffe8a6'; g.fillRect(120, 78, 68, 5);
      if (inGame && game) this['draw_' + game.key](game, h);
      if (s === 'results') this.drawRestartPhone(shift);
    }
    for (const p of this.parts) { p.life -= dt; p.vy += 900 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.a += dt * 9; g.save(); g.translate(p.x, p.y); g.rotate(p.a); g.fillStyle = p.c; g.fillRect(-6, -4, 12, 8); g.restore(); }
    this.parts = this.parts.filter(p => p.life > 0);
    for (const p of this.pops) { p.life -= dt * .9; g.globalAlpha = clamp(p.life * 2); text(g, p.s, p.x, p.y - (1 - p.life) * 50, 16, p.color); g.globalAlpha = 1; }
    this.pops = this.pops.filter(p => p.life > 0);
    if (this.showMarks && s !== 'message' && s !== 'fade') this.handMarks(h);
    this.composite(shift, dt);
  }

  composite(shift, dt) {
    const o = this.out, mg = this.mg, cg = this.cg, t = this.t, L = shift.level / 4;
    this.trauma = Math.max(0, this.trauma - dt * 1.6); const shake = this.trauma * this.trauma;
    const sw = shift.drunk.sway();
    // 1) Drunk camera: sway, roll, breathing zoom, double vision.
    mg.setTransform(1, 0, 0, 1, 0, 0); mg.globalCompositeOperation = 'source-over'; mg.globalAlpha = 1;
    mg.fillStyle = this.th.desk; mg.fillRect(0, 0, LW, LH);
    const zoom = 1.05 + Math.sin(t * .8) * .035 * L + L * .03;
    const rot = Math.sin(t * .55) * .055 * L + noise(t * .2, 51) * .03 * L + noise(t * 25, 7) * .02 * shake;
    const tx = sw.x * LW * .4 + Math.sin(t * .47) * 5 * L + noise(t * 23, 3) * 5 * shake, ty = sw.y * LH * .4 + Math.cos(t * .39) * 3 * L + noise(t * 27, 5) * 5 * shake;
    const draw = (alpha, dx, dy) => { mg.save(); mg.globalAlpha = alpha; mg.translate(LW / 2 + tx + dx, LH / 2 + ty + dy); mg.rotate(rot); mg.scale(zoom, zoom); mg.drawImage(this.buf, -LW / 2, -LH / 2); mg.restore(); };
    draw(1, 0, 0);
    const gs = (.55 + .45 * Math.sin(t * .6)) * L;
    if (gs > .02) draw(.28 * gs, Math.sin(t * .43) * 12 * gs, Math.cos(t * .37) * 4 * gs);
    // 2) RGB split: rebuild the frame from offset red / green / blue copies.
    const split = Math.round(.6 + L * 1.1 + shake * 3);
    o.globalCompositeOperation = 'source-over'; o.fillStyle = '#000'; o.fillRect(0, 0, LW, LH);
    for (const [col, dx, dy] of [['#ff0000', split, 0], ['#00ff00', 0, 0], ['#0000ff', -split, Math.round(split / 2)]]) {
      cg.globalCompositeOperation = 'copy'; cg.clearRect(0, 0, LW, LH);
      // Slow horizontal heat-haze waves bend the scene without altering input coordinates.
      cg.globalCompositeOperation = 'source-over';
      for (let y = 0; y < LH; y += 2) {
        const warp = Math.sin(y * .035 + t * 1.2) * 2.8 * L;
        cg.drawImage(this.mix, 0, y, LW, 2, warp, y, LW, 2);
      }
      cg.globalCompositeOperation = 'multiply'; cg.fillStyle = col; cg.fillRect(0, 0, LW, LH);
      o.globalCompositeOperation = 'lighter'; o.drawImage(this.chan, dx, dy);
    }
    o.globalCompositeOperation = 'source-over';
    // 3) Ordered dither, faint scanlines, soft vignette, impact flash.
    o.fillStyle = this.dither; o.fillRect(0, 0, LW, LH);
    o.fillStyle = 'rgba(0,0,0,.035)'; for (let y = 0; y < LH; y += 2) o.fillRect(0, y, LW, 1);
    const v = o.createRadialGradient(LW / 2, LH / 2, LH * .4, LW / 2, LH / 2, LH);
    v.addColorStop(0, 'rgba(40,20,20,0)'); v.addColorStop(1, `rgba(40,20,20,${.22 + .15 * L})`); o.fillStyle = v; o.fillRect(0, 0, LW, LH);
    if (Math.abs(this.flash) > .01) { o.fillStyle = this.flash > 0 ? `rgba(255,245,200,${this.flash})` : `rgba(220,50,40,${-this.flash})`; o.fillRect(0, 0, LW, LH); }
    this.flash *= Math.max(0, 1 - dt * 5);
  }

  drawBar(shift) {
    const g = this.g, o = shift.opener, s = shift.state, t = this.t, h = shift.hands;
    g.fillStyle = '#0c090c'; g.fillRect(0, 0, W, H);
    const spot = g.createRadialGradient(X(.5), Y(.55), 20, X(.5), Y(.55), 320);
    spot.addColorStop(0, 'rgba(255,190,130,.42)'); spot.addColorStop(1, 'rgba(255,190,130,0)'); g.fillStyle = spot; g.fillRect(0, 0, W, H);
    if (s === 'phone') {
      const buzz = Math.sin(t * 2.5) > .3 && o.phase !== 'raising';
      const px = X(o.pos.x) + (buzz ? Math.sin(t * 60) * 2 : 0), py = Y(o.pos.y) + 46;
      this.phone(px, py, 1.1, o.progress, false);
      if (buzz) { g.strokeStyle = '#f2c14e'; g.lineWidth = 4; for (const d of [-1, 1]) { g.beginPath(); g.arc(px, py - 46, 66 + Math.sin(t * 20) * 3, d < 0 ? Math.PI * .8 : -.4, d < 0 ? Math.PI * 1.2 : .4); g.stroke(); } }
    } else {
      const index = s === 'fade' ? CONVERSATION.length - 1 : Math.min(CONVERSATION.length - 1, Math.max(0, Math.floor((CONVERSATION_SECONDS - shift.timer) / MESSAGE_SECONDS)));
      this.phone(X(.5), Y(.50), 2.5, 1, CONVERSATION[index]);
    }
  }
  drawRestartPhone(shift) {
    const o = shift.opener;
    this.phone(X(o.pos.x), Y(o.pos.y) + 42, .9, o.progress, false);
  }

  // ---------------------------------------------------------------- jobs
  draw_stamp(game, h) {
    const g = this.g, F = LAYOUT.form, f = game.form, th = this.th;
    for (const k of ['approved', 'rejected']) this.inkPad(k, X(game.pads[k].x), Y(game.pads[k].y), game.ink === k);
    const fx = X(F.x + f.slide * .8), fy = Y(F.y), fw = X(F.w), fh = Y(F.h);
    this.paper(fx, fy, fw, fh, f.slide * .5, 0, false);
    g.save(); g.translate(fx, fy); g.rotate(f.slide * .5);
    const want = f.want;
    rr(g, -fw / 2 + 10, -fh / 2 + 10, fw - 20, 34, 6); g.fillStyle = INK[want]; g.fill();
    text(g, want === 'approved' ? 'APPROVE' : 'REJECT', 0, -fh / 2 + 28, 16, '#ffffff');
    g.fillStyle = th.line; for (let ly = -fh / 2 + 60; ly < fh / 2 - 12; ly += 12) g.fillRect(-fw / 2 + 14, ly, (fw - 28) * (.45 + ((ly * 13 + 400) % 40) / 80), 3);
    const tx = X(f.target.x - F.x), ty = Y(f.target.y - F.y);
    g.fillStyle = th.paper; g.fillRect(tx - X(TUNING.stamp.good), ty - Y(TUNING.stamp.good), X(TUNING.stamp.good)*2, Y(TUNING.stamp.good)*2);
    g.setLineDash([8, 6]); g.strokeStyle = INK[want]; g.lineWidth = 3; g.strokeRect(tx - X(TUNING.stamp.good), ty - Y(TUNING.stamp.good), X(TUNING.stamp.good)*2, Y(TUNING.stamp.good)*2); g.setLineDash([]);
    text(g, 'HERE', tx, ty + 1, 16, INK[want]);
    if (f.mark) this.mark(f.mark.kind, X(f.mark.x), Y(f.mark.y), Math.sin(f.mark.x * 40) * .2);
    g.restore();
    // The stamp is your hand. It sinks as you hold still, then thumps.
    const r = h.right, lift = game.thump > 0 ? 0 : .5 - (game.dwell / TUNING.stamp.dwell) * .48;
    this.stampTool(X(r.x), Y(r.y), game.ink, lift);
  }

  draw_copy(game, h) {
    for (let i = 0; i < 6; i++) this.paper(X(game.pile.x) + (i % 2) * 3, Y(game.pile.y) - i * 3, X(LAYOUT.copyPaper.w), Y(LAYOUT.copyPaper.h), (i % 3 - 1) * .03, 0, i === 5);
    this.copier(game);
    const r = h.right;
    if (game.holder) this.paper(X(r.x), Y(r.y) + 10, 133, 173, Math.sin(this.t * 6) * .06 * (game.scan > 0 ? .2 : 1), game.scan > 0 ? .08 : .25);
    else if (game.fall) this.paper(X(game.sheet.x), Y(game.sheet.y), 133, 173, Math.sin(this.t * 9) * .5, .15);
    else this.ring(X(r.x), Y(r.y), this.th.dark, 16);          // empty hand: just where you're reaching
  }

  draw_staple(game, h) {
    const g = this.g, s = game.stack, sx = X(s.x + s.slide * .7), sy = Y(s.y), PW = X(LAYOUT.staplePaper.w), PH = Y(LAYOUT.staplePaper.h);
    // The active hand carries the paper, including offscreen.
    g.save(); g.translate(sx, sy); g.rotate(s.spin + s.slide * .4);
    for (let i = 0; i < 4; i++) this.paper((i % 2) * 5 - 2, -i * 4, PW, PH, (i - 1.5) * .03, .06, i === 3);
    const cx = X(game.target.x), cy = Y(game.target.y);
    if (game.phase !== 'done') { const col = game.aligned ? INK.approved : INK.rejected; g.strokeStyle = col; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, 13, 0, 7); g.stroke(); g.fillStyle = col; g.fillRect(cx - 1.5, cy - 17, 3, 34); g.fillRect(cx - 17, cy - 1.5, 34, 3); }
    for (const mark of game.marks) {
      const mx = X(mark.x), my = Y(mark.y);
      g.fillStyle = '#454553'; g.fillRect(mx - 12, my - 2, 24, 5);
      g.fillStyle = '#c9cad2'; g.fillRect(mx - 10, my - 2, 20, 2);
      g.fillRect(mx - 12, my - 2, 3, 7); g.fillRect(mx + 9, my - 2, 3, 7);
    }
    g.restore();
    // The stapler never moves. Its head follows your right hand: up = open, swing down = shut.
    g.save(); g.translate(X(LAYOUT.stapler.x), Y(LAYOUT.stapler.y)); g.scale(1.2, 1.2);
    this.stapler(0, 0, game.height, game.slam > 0); g.restore();
    if (game.aligned) { g.strokeStyle = INK.approved; g.lineWidth = 3; g.setLineDash([5, 4]); g.beginPath(); g.arc(X(LAYOUT.stapler.x), Y(LAYOUT.stapler.y), 22, 0, 7); g.stroke(); g.setLineDash([]); }
  }

  // Debug: small X where the game thinks each hand is.
  handMarks(h) {
    const g = this.g;
    for (const [side, col] of [['left', '#3b6fd6'], ['right', '#e0533d']]) {
      const x = X(h[side].x), y = Y(h[side].y);
      g.strokeStyle = '#ffffff'; g.lineWidth = 6; g.beginPath(); g.moveTo(x - 9, y - 9); g.lineTo(x + 9, y + 9); g.moveTo(x + 9, y - 9); g.lineTo(x - 9, y + 9); g.stroke();
      g.strokeStyle = col; g.lineWidth = 3; g.stroke();
      text(g, side === 'left' ? 'L' : 'R', x + 16, y - 14, 16, col);
    }
  }
}

