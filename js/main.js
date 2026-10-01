// ============================================================
//  樱之村物语 —— 主程序：输入、角色、UI、时间、存档
// ============================================================

const VW = 384, VH = 216;            // 内部分辨率（像素风的关键：低分辨率 + 整数放大）
const MIN_PER_TICK_MS = 700;         // 现实 0.7 秒 = 游戏内 1 分钟
const DAY_START = 6 * 60, DAY_END = 26 * 60;
const SAVE_KEY = 'sakura-village-save-v1';
const FONT = '12px PixelFont, "PingFang SC", "Microsoft YaHei", sans-serif';
const FONT_BIG = '24px PixelFont, "PingFang SC", "Microsoft YaHei", sans-serif';
const WEEK = ['月', '火', '水', '木', '金', '土', '日'];
const SEASONS = ['春', '夏', '秋', '冬'];

const ITEMS = {
  hoe: { name: '锄头', icon: 'hoe', desc: '开垦农田里的草地' },
  can: { name: '水壶', icon: 'can', desc: '给作物浇水，对着水面可以装水' },
  seed_turnip: { name: '芜菁种子', icon: 'seed_turnip', plant: 'turnip', price: 20 },
  seed_daikon: { name: '萝卜种子', icon: 'seed_daikon', plant: 'daikon', price: 40 },
  turnip: { name: '芜菁', icon: 'turnip', sell: 60 },
  daikon: { name: '萝卜', icon: 'daikon', sell: 150 },
};

// ---------------- 画布 ----------------
const canvas = document.getElementById('game');
canvas.width = VW; canvas.height = VH;
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;
const darkCanvas = makeCanvas(VW, VH), dctx = darkCanvas.getContext('2d');

function fitScreen() {
  const s = Math.max(1, Math.floor(Math.min(innerWidth / VW, innerHeight / VH)));
  canvas.style.width = VW * s + 'px';
  canvas.style.height = VH * s + 'px';
}
addEventListener('resize', fitScreen);
fitScreen();

// ---------------- 输入 ----------------
const keys = {}, pressed = {};
addEventListener('keydown', e => {
  if (!keys[e.code]) pressed[e.code] = true;
  keys[e.code] = true;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
});
addEventListener('keyup', e => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
const down = (...c) => c.some(k => keys[k]);
const hit = (...c) => c.some(k => pressed[k]);
const CONFIRM = ['KeyE', 'Enter', 'Space', 'KeyK', 'KeyJ'];
const CANCEL = ['Escape', 'KeyX', 'Backspace'];

// ---------------- 小工具：文字与窗口 ----------------
function text(g, s, x, y, color = '#f4efe4', shadow = '#1a1428') {
  g.font = FONT; g.textBaseline = 'top';
  if (shadow) { g.fillStyle = shadow; g.fillText(s, x + 1, y + 1); }
  g.fillStyle = color; g.fillText(s, x, y);
}
function textW(g, s) { g.font = FONT; return g.measureText(s).width; }

// 日式 RPG 风格窗口：深蓝底 + 米白双边框
function panel(g, x, y, w, h) {
  g.fillStyle = '#1a1428'; g.fillRect(x + 1, y, w - 2, h); g.fillRect(x, y + 1, w, h - 2);
  g.fillStyle = '#f4efe4'; g.fillRect(x + 1, y + 1, w - 2, h - 2);
  g.fillStyle = '#2a3468'; g.fillRect(x + 2, y + 2, w - 4, h - 4);
  g.fillStyle = '#1e2650'; g.fillRect(x + 3, y + 3, w - 6, h - 6);
  const grad = g.createLinearGradient(0, y, 0, y + h);
  grad.addColorStop(0, '#34408a'); grad.addColorStop(1, '#1c2250');
  g.fillStyle = grad; g.fillRect(x + 3, y + 3, w - 6, h - 6);
}

function wrap(g, s, maxW) {
  const lines = [];
  for (const para of s.split('\n')) {
    let cur = '';
    for (const ch of para) {
      if (textW(g, cur + ch) > maxW) { lines.push(cur); cur = ch; } else cur += ch;
    }
    lines.push(cur);
  }
  return lines;
}

// 3x5 小数字（道具数量用）
const DIGITS = ['111101101101111', '010110010010111', '111001111100111', '111001111001111', '101101111001001',
  '111100111001111', '111100111101111', '111001010010010', '111101111101111', '111101111001111'];
function tinyNum(g, n, x, y) {
  const s = String(n);
  x -= s.length * 4;
  for (const ch of s) {
    const d = DIGITS[+ch];
    for (let i = 0; i < 15; i++) if (d[i] === '1') {
      g.fillStyle = '#1a1428'; g.fillRect(x + (i % 3) + 1, y + ((i / 3) | 0) + 1, 1, 1);
      g.fillStyle = '#f4efe4'; g.fillRect(x + (i % 3), y + ((i / 3) | 0), 1, 1);
    }
    x += 4;
  }
}

// ============================================================
//  角色
// ============================================================
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

class Actor {
  constructor(frames, tx, ty) {
    this.frames = frames;
    this.x = tx * TILE + 8; this.y = ty * TILE + 12;   // 脚底坐标
    this.dir = 'down'; this.moving = false; this.animT = 0;
  }
  box(x = this.x, y = this.y) { return [x - 5, y - 4, x + 5, y + 1]; }
  tile() { return [Math.floor(this.x / TILE), Math.floor((this.y - 2) / TILE)]; }
  facing() { const [tx, ty] = this.tile(), [dx, dy] = DIRS[this.dir]; return [tx + dx, ty + dy]; }
  blockedAt(x, y, world, others) {
    const b = this.box(x, y);
    if (world.rectBlocked(...b)) return true;
    for (const o of others) {
      if (o === this) continue;
      const c = o.box();
      if (b[0] < c[2] && b[2] > c[0] && b[1] < c[3] && b[3] > c[1]) return true;
    }
    return false;
  }
  move(dx, dy, world, others) {
    let moved = false;
    if (dx && !this.blockedAt(this.x + dx, this.y, world, others)) { this.x += dx; moved = true; }
    if (dy && !this.blockedAt(this.x, this.y + dy, world, others)) { this.y += dy; moved = true; }
    return moved;
  }
  frameIndex() { return this.moving ? [1, 0, 2, 0][Math.floor(this.animT * 7) % 4] : 0; }
  draw(g, cx, cy) {
    const f = this.frameIndex(), img = this.frames[this.dir][f];
    const X = Math.round(this.x - 8 - cx), Y = Math.round(this.y - img.height + 1 - cy) - (f ? 1 : 0);
    g.fillStyle = 'rgba(30,40,20,0.3)'; g.fillRect(Math.round(this.x - 5 - cx), Math.round(this.y - 1 - cy), 10, 3);
    g.drawImage(img, X, Y);
  }
}

class NPC extends Actor {
  constructor(opts) {
    super(buildCharacter(opts.look), opts.x, opts.y);
    Object.assign(this, opts);
    this.wait = 1 + Math.random() * 2; this.target = null; this.talking = false; this.stuck = 0;
  }
  update(dt, world, others) {
    this.moving = false;
    if (this.talking) return;
    if (!this.target) {
      this.wait -= dt;
      if (this.wait <= 0) {
        const [x0, y0, x1, y1] = this.area;
        this.target = [(x0 + Math.random() * (x1 - x0 + 1) | 0) * TILE + 8, (y0 + Math.random() * (y1 - y0 + 1) | 0) * TILE + 12];
        this.stuck = 0;
      }
      return;
    }
    const sp = 28 * dt, ddx = this.target[0] - this.x, ddy = this.target[1] - this.y;
    let mx = 0, my = 0;
    if (Math.abs(ddx) > 1) mx = Math.sign(ddx) * Math.min(sp, Math.abs(ddx));
    else if (Math.abs(ddy) > 1) my = Math.sign(ddy) * Math.min(sp, Math.abs(ddy));
    else { this.target = null; this.wait = 1.5 + Math.random() * 3; return; }
    this.dir = mx ? (mx < 0 ? 'left' : 'right') : (my < 0 ? 'up' : 'down');
    if (this.move(mx, my, world, others)) { this.moving = true; this.animT += dt; }
    else if ((this.stuck += dt) > 1) { this.target = null; this.wait = 1; }
  }
}

class Cat {
  constructor(art, tx, ty) {
    this.frames = art.cat; this.x = tx * TILE + 8; this.y = ty * TILE + 12;
    this.t = 0; this.hop = null; this.blink = 0; this.area = [7, 7, 12, 9];
    this.name = '小猫';
  }
  box() { return [this.x - 5, this.y - 4, this.x + 5, this.y + 1]; }
  update(dt, world) {
    this.t += dt;
    this.blink = (this.t % 4) > 3.8 ? 1 : 0;
    if (this.hop) {
      this.hop.t += dt;
      const k = Math.min(1, this.hop.t / 0.5);
      this.x = this.hop.x0 + (this.hop.x1 - this.hop.x0) * k;
      this.y = this.hop.y0 + (this.hop.y1 - this.hop.y0) * k;
      if (k >= 1) this.hop = null;
    } else if (Math.random() < dt * 0.15) {
      const [x0, y0, x1, y1] = this.area;
      const tx = x0 + (Math.random() * (x1 - x0 + 1) | 0), ty = y0 + (Math.random() * (y1 - y0 + 1) | 0);
      if (!world.isSolid(tx, ty)) this.hop = { t: 0, x0: this.x, y0: this.y, x1: tx * TILE + 8, y1: ty * TILE + 12 };
    }
  }
  draw(g, cx, cy) {
    const img = this.frames[this.blink];
    const jump = this.hop ? Math.round(Math.sin(this.hop.t / 0.5 * Math.PI) * 4) : 0;
    g.fillStyle = 'rgba(30,40,20,0.3)'; g.fillRect(Math.round(this.x - 5 - cx), Math.round(this.y - 1 - cy), 10, 2);
    g.drawImage(img, Math.round(this.x - 6 - cx), Math.round(this.y - img.height + 1 - cy) - jump);
  }
}

// ============================================================
//  游戏
// ============================================================
class Game {
  constructor() {
    this.art = buildArt();
    this.mode = 'title';
    this.titleCursor = 0;
    this.time = 0;
    this.petals = Array.from({ length: 36 }, () => this.newPetal(true));
    this.newGame();
  }

  newPetal(anywhere) {
    return {
      x: Math.random() * (VW + 60) - 30, y: anywhere ? Math.random() * VH : -4,
      vx: 8 + Math.random() * 12, vy: 10 + Math.random() * 10, p: Math.random() * 6, c: Math.random() < 0.5 ? PAL.pink : PAL.pinkLight,
    };
  }

  newGame() {
    this.world = new World(this.art);
    this.player = new Actor(buildCharacter({
      hair: '#6a4430', hairDark: '#4a2c20', cloth: '#4a78c0', clothDark: '#34588e', pants: '#3a3448', collar: '#f4efe4',
    }), 6, 7);
    this.npcs = [
      new NPC({ id: 'koharu', name: '巫女·小春', x: 36, y: 9, area: [33, 9, 39, 9],
        look: { hair: '#2e2438', hairDark: '#1e1628', cloth: '#f4efe4', clothDark: '#cfc6d8', pants: '#d4443c', collar: '#d4443c', shoes: '#f4efe4' } }),
      new NPC({ id: 'gen', name: '杂货铺·源先生', x: 22, y: 9, area: [22, 9, 24, 9],
        look: { hair: '#8a8a94', hairDark: '#5e5e6a', cloth: '#6a8a4a', clothDark: '#4e6a34', pants: '#4a3a30', collar: '#e8dcc0' } }),
      new NPC({ id: 'take', name: '竹爷爷', x: 21, y: 18, area: [18, 16, 27, 21],
        look: { hair: '#e8e4dc', hairDark: '#b8b4ac', cloth: '#8a6a9a', clothDark: '#6a4e7a', pants: '#4a4050', collar: '#e8dcc0' } }),
      new NPC({ id: 'hana', name: '阿花', x: 25, y: 12, area: [24, 11, 28, 13],
        look: { hair: '#e88aa8', hairDark: '#b86a88', cloth: '#f2d24a', clothDark: '#c8a830', pants: '#e07a3a', collar: '#f4efe4' } }),
    ];
    this.cat = new Cat(this.art, 10, 8);
    this.day = 1; this.minutes = DAY_START; this.tickAcc = 0;
    this.gold = 500; this.energy = 100; this.maxEnergy = 100;
    this.waterLeft = 20; this.maxWater = 20;
    this.slots = [{ id: 'hoe' }, { id: 'can' }, { id: 'seed_turnip', n: 12 }, { id: 'seed_daikon', n: 3 }, null, null, null, null];
    this.sel = 0; this.selShow = 0;
    this.shipped = []; this.prayed = false;
    this.talkCount = {};
    this.dialog = null; this.menu = null; this.toasts = []; this.particles = [];
    this.action = null;  // 使用工具的动作
    this.fade = 0; this.fadeDir = 0; this.summary = null;
    this.camX = 0; this.camY = 0;
  }

  // ---------------- 存档 ----------------
  save() {
    const d = {
      day: this.day, gold: this.gold, slots: this.slots, waterLeft: this.waterLeft, talkCount: this.talkCount,
      world: this.world.serialize(),
    };
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(d)); } catch (e) { /* 隐私模式等情况下忽略 */ }
  }
  hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } }
  loadSave() {
    let d;
    try { d = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { return false; }
    if (!d) return false;
    this.newGame();
    Object.assign(this, { day: d.day, gold: d.gold, slots: d.slots, waterLeft: d.waterLeft, talkCount: d.talkCount || {} });
    this.world.load(d.world);
    return true;
  }

  // ---------------- 时间 ----------------
  season() { return SEASONS[Math.floor((this.day - 1) / 28) % 4]; }
  dayOfMonth() { return (this.day - 1) % 28 + 1; }
  clockStr() {
    const m = Math.floor(this.minutes / 10) * 10;
    const h = Math.floor(m / 60) % 24, mm = m % 60;
    return String(h).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
  }
  nightLevel() {
    const m = this.minutes;
    if (m < 17 * 60) return 0;
    if (m < 20 * 60) return (m - 17 * 60) / 180 * 0.72;
    return Math.min(0.82, 0.72 + (m - 20 * 60) / 360 * 0.1);
  }

  // ---------------- 背包 ----------------
  addItem(id, n = 1) {
    let s = this.slots.find(s => s && s.id === id);
    if (s) { s.n += n; return true; }
    const i = this.slots.indexOf(null);
    if (i < 0) { this.toast('背包满了！'); return false; }
    this.slots[i] = { id, n };
    return true;
  }
  removeItem(slotIdx, n = 1) {
    const s = this.slots[slotIdx];
    s.n -= n;
    if (s.n <= 0) this.slots[slotIdx] = null;
  }
  countItem(id) { const s = this.slots.find(s => s && s.id === id); return s ? s.n : 0; }

  toast(t, color) { this.toasts.push({ t, life: 2.6, color }); if (this.toasts.length > 4) this.toasts.shift(); }

  // ---------------- 对话 ----------------
  // pages: [{name, text}] ；最后一页可以带 choices: [{label, fn}]
  say(pages, then) {
    this.dialog = { pages, i: 0, chars: 0, cursor: 0, then, lines: null };
  }
  updateDialog(dt) {
    const d = this.dialog, page = d.pages[d.i];
    if (!d.lines) d.lines = wrap(ctx, page.text, VW - 56);
    const total = d.lines.join('').length;
    d.chars = Math.min(total, d.chars + dt * 45);
    const done = d.chars >= total;
    if (done && page.choices) {
      if (hit('ArrowUp', 'KeyW')) d.cursor = (d.cursor + page.choices.length - 1) % page.choices.length;
      if (hit('ArrowDown', 'KeyS')) d.cursor = (d.cursor + 1) % page.choices.length;
      if (hit(...CANCEL)) { this.closeDialog(); return; }
    }
    if (hit(...CONFIRM)) {
      if (!done) { d.chars = total; return; }
      if (page.choices) {
        const c = page.choices[d.cursor];
        this.closeDialog();
        if (c.fn) c.fn();
        return;
      }
      d.i++; d.chars = 0; d.lines = null;
      if (d.i >= d.pages.length) { const then = d.then; this.closeDialog(); if (then) then(); }
    }
  }
  closeDialog() {
    this.dialog = null;
    for (const n of this.npcs) n.talking = false;
  }

  // ---------------- NPC 台词 ----------------
  talkTo(npc) {
    npc.talking = true;
    // 面向玩家
    const dx = this.player.x - npc.x, dy = this.player.y - npc.y;
    npc.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
    const c = this.talkCount[npc.id] = (this.talkCount[npc.id] || 0) + 1;
    const N = npc.name, night = this.minutes >= 19 * 60;
    const lines = {
      koharu: [
        ['你就是搬到村子东边农场的人吧？我是守护这座樱之社的巫女，小春。', '以后请多关照啦。'],
        ['今年的樱花开得特别好呢。风一吹，花瓣就像雪一样。'],
        ['听说在神社前诚心祈愿，就会有好事发生哦。', '……要不要试试看？拜殿就在我身后。'],
        ['神社的灯笼每到傍晚就会点亮。晚上来看的话，会很漂亮的。'],
      ],
      gen: [
        ['哟，新来的！我是杂货铺的源。种子、农具，要什么尽管说。'],
        ['芜菁四天就能收获，萝卜要六天，不过卖得贵。怎么选就看你啦。'],
        ['种出来的作物放进你家门口的出货箱，第二天早上就能拿到钱。'],
      ],
      take: [
        ['哦……是阿竹我老朋友的孙子啊。那片农场荒了好多年了。', '拿锄头在栅栏里的草地上开垦，撒下种子，再每天浇水就行。'],
        ['水壶空了的话，去河边或泉水池边，对着水面用一下就能装满。'],
        ['年轻人，晚上别熬太晚。过了凌晨两点还不睡，可是会晕倒的。'],
        ['作物只有浇过水的那天夜里才会长大。别忘了哦。'],
      ],
      hana: [
        ['啊，你好！我叫阿花，最喜欢在村里到处散步了。'],
        ['广场上的那位竹爷爷，年轻时可是村里最厉害的农夫哦。'],
        ['你家门口的小橘猫，好像很喜欢你呢。'],
        ['等到夏天，河边会有很多萤火虫……好期待啊。'],
      ],
    }[npc.id];
    let pick = lines[Math.min(c - 1, lines.length - 1)];
    if (c > lines.length) pick = lines[1 + (c % (lines.length - 1))];
    if (night && npc.id === 'koharu') pick = ['这么晚了还在外面？灯笼的光很美吧。', '不过要早点回去休息哦。'];
    const pages = pick.map(t => ({ name: N, text: t }));
    if (npc.id === 'gen') {
      pages.push({ name: N, text: '今天要点什么？', choices: [
        { label: '买东西', fn: () => this.openShop('buy') },
        { label: '卖东西', fn: () => this.openShop('sell') },
        { label: '不用了', fn: () => this.say([{ name: N, text: '好嘞，随时欢迎！' }]) },
      ] });
    }
    this.say(pages);
  }

  // ---------------- 商店菜单 ----------------
  openShop(mode) { this.menu = { type: 'shop', mode, cursor: 0 }; }
  shopList() {
    if (this.menu.mode === 'buy') return ['seed_turnip', 'seed_daikon'].map(id => ({ id, price: ITEMS[id].price }));
    return this.slots.filter(s => s && ITEMS[s.id].sell).map(s => ({ id: s.id, price: ITEMS[s.id].sell, n: s.n }));
  }
  updateMenu() {
    const m = this.menu, list = this.shopList();
    if (hit(...CANCEL)) { this.menu = null; return; }
    if (hit('ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD', 'Tab')) { m.mode = m.mode === 'buy' ? 'sell' : 'buy'; m.cursor = 0; return; }
    if (!list.length) return;
    m.cursor = Math.min(m.cursor, list.length - 1);
    if (hit('ArrowUp', 'KeyW')) m.cursor = (m.cursor + list.length - 1) % list.length;
    if (hit('ArrowDown', 'KeyS')) m.cursor = (m.cursor + 1) % list.length;
    if (hit(...CONFIRM)) {
      const it = list[m.cursor];
      const qty = down('ShiftLeft', 'ShiftRight') ? 5 : 1;
      if (m.mode === 'buy') {
        const n = Math.min(qty, Math.floor(this.gold / it.price));
        if (n <= 0) { this.toast('钱不够……', '#ff9a8a'); return; }
        if (this.addItem(it.id, n)) { this.gold -= n * it.price; this.toast(`买了 ${ITEMS[it.id].name} ×${n}`); }
      } else {
        const idx = this.slots.findIndex(s => s && s.id === it.id);
        const n = Math.min(qty, it.n);
        this.removeItem(idx, n); this.gold += n * it.price;
        this.toast(`卖出 ${ITEMS[it.id].name} ×${n}  +${n * it.price}G`, '#ffe08a');
      }
    }
  }

  // ---------------- 与世界互动 ----------------
  npcInFront() {
    const p = this.player, [dx, dy] = DIRS[p.dir];
    const fx = p.x + dx * 14, fy = p.y - 2 + dy * 14;
    const all = [...this.npcs, this.cat];
    return all.find(n => Math.hypot(n.x - fx, n.y - 2 - fy) < 12) || null;
  }

  interact() {
    const w = this.world, p = this.player;
    const n = this.npcInFront();
    if (n === this.cat) {
      this.say([{ name: '小猫', text: ['喵～', '（小猫蹭了蹭你的腿。）', '喵呜……（它眯起眼睛，看起来很舒服。）'][(Math.random() * 3) | 0] }]);
      this.spawnHearts(this.cat.x, this.cat.y - 12);
      return;
    }
    if (n) { this.talkTo(n); return; }
    const [tx, ty] = p.facing();
    const b = w.buildingAt(tx, ty);
    if (b && b.door.x === tx && b.door.y === ty) {
      if (b.type === 'house') {
        this.say([{ name: '', text: '要睡觉吗？（会自动存档）', choices: [
          { label: '睡觉', fn: () => this.sleep(false) }, { label: '还不睡', fn: null }] }]);
      } else if (b.type === 'shop') {
        const gen = this.npcs.find(n => n.id === 'gen');
        this.say([{ name: gen.name, text: '欢迎光临！', choices: [
          { label: '买东西', fn: () => this.openShop('buy') }, { label: '卖东西', fn: () => this.openShop('sell') }, { label: '离开', fn: null }] }]);
      } else if (b.type === 'shrine') {
        if (this.prayed) this.say([{ name: '', text: '今天已经祈祷过了。明天再来吧。' }]);
        else {
          this.say([{ name: '', text: '（投下香油钱，摇响了铃铛……）' }, { name: '', text: '你双手合十，默默许愿。\n感觉身体轻松了一些。（体力 +30）' }], () => {
            this.prayed = true; this.energy = Math.min(this.maxEnergy, this.energy + 30);
          });
        }
      }
      return;
    }
    const o = w.obj(tx, ty);
    if (o && o.type === 'shipbox') { this.openShipBox(); return; }
    if (o && o.type === 'lantern') { this.say([{ name: '', text: '古老的石灯笼。上面长着一点青苔。' }]); return; }
    const crop = w.crops.get(w.key(tx, ty));
    if (crop && crop.stage === 4) { this.harvest(tx, ty); return; }
    if (crop) { this.say([{ name: '', text: `${CROPS[crop.kind].name}还在生长中……（${w.wet.has(w.key(tx, ty)) ? '今天浇过水了' : '还没浇水'}）` }]); return; }
  }

  openShipBox() {
    const sellable = this.slots.filter(s => s && ITEMS[s.id].sell);
    if (!sellable.length) { this.say([{ name: '', text: '出货箱。放进去的作物，第二天早上会换成钱。\n（现在没有可以出货的作物）' }]); return; }
    const total = sellable.reduce((a, s) => a + s.n * ITEMS[s.id].sell, 0);
    this.say([{ name: '', text: `把所有作物放进出货箱吗？（预计 ${total}G，明早结算）`, choices: [
      { label: '全部出货', fn: () => {
        for (let i = 0; i < this.slots.length; i++) {
          const s = this.slots[i];
          if (s && ITEMS[s.id].sell) { this.shipped.push({ id: s.id, n: s.n }); this.slots[i] = null; }
        }
        this.toast('已放入出货箱', '#ffe08a');
      } },
      { label: '算了', fn: null }] }]);
  }

  harvest(tx, ty) {
    const w = this.world, c = w.crops.get(w.key(tx, ty));
    if (!this.addItem(c.kind, 1)) return;
    w.crops.delete(w.key(tx, ty));
    this.toast(`收获了 ${CROPS[c.kind].name}！`, '#b8f08a');
    this.spawnBurst(tx * TILE + 8, ty * TILE + 8, [PAL.leafLight, PAL.leaf, '#f4efe4'], 10);
  }

  useTool() {
    const s = this.slots[this.sel];
    if (!s || this.action) return;
    const w = this.world, [tx, ty] = this.player.facing(), it = ITEMS[s.id];
    const crop = w.crops.get(w.key(tx, ty));
    if (crop && crop.stage === 4) { this.harvest(tx, ty); return; }
    const cost = s.id === 'hoe' ? 3 : s.id === 'can' ? 1 : 0;
    if (cost && this.energy < cost) { this.toast('太累了……今天回家休息吧。', '#ff9a8a'); return; }

    if (s.id === 'hoe') {
      this.action = { t: 0, icon: 'hoe' };
      this.energy -= cost;
      if (w.till(tx, ty)) this.spawnBurst(tx * TILE + 8, ty * TILE + 10, [PAL.soil, PAL.soilDark, PAL.soilLight], 8);
      else if (!w.farmable[w.idx(tx, ty)] && w.inBounds(tx, ty) && w.g(tx, ty) === G_GRASS && !w.obj(tx, ty)) this.toast('这里不适合开垦，去栅栏里的农田吧');
    } else if (s.id === 'can') {
      this.action = { t: 0, icon: 'can' };
      if (w.g(tx, ty) === G_WATER) {
        this.waterLeft = this.maxWater; this.toast('水壶装满了！', '#a6ddf2');
        this.spawnBurst(tx * TILE + 8, ty * TILE + 8, [PAL.waterLight, '#ffffff'], 10);
        return;
      }
      if (this.waterLeft <= 0) { this.toast('水壶空了，去河边装水吧', '#a6ddf2'); return; }
      this.energy -= cost; this.waterLeft--;
      w.water(tx, ty);
      this.spawnBurst(tx * TILE + 8, ty * TILE + 6, [PAL.waterLight, PAL.water1, '#ffffff'], 8);
    } else if (it.plant) {
      if (w.plant(tx, ty, it.plant)) { this.removeItem(this.sel, 1); this.spawnBurst(tx * TILE + 8, ty * TILE + 10, ['#d8b878'], 4); }
      else if (w.g(tx, ty) !== G_SOIL) this.toast('要先用锄头开垦土地');
    } else if (it.sell) {
      this.toast('放进家门口的出货箱就能卖掉');
    }
  }

  // ---------------- 睡觉 / 新的一天 ----------------
  sleep(passedOut) {
    this.mode = 'sleep'; this.fade = 0; this.fadeDir = 1;
    const income = this.shipped.reduce((a, s) => a + s.n * ITEMS[s.id].sell, 0);
    const shippedList = this.shipped.slice();
    this.summary = null;
    this.afterFade = () => {
      this.gold += income;
      this.shipped = [];
      this.day++;
      this.world.newDay();
      this.minutes = DAY_START; this.tickAcc = 0;
      this.energy = passedOut ? Math.round(this.maxEnergy * 0.6) : this.maxEnergy;
      this.prayed = false;
      this.player.x = 6 * TILE + 8; this.player.y = 7 * TILE + 12; this.player.dir = 'down';
      this.save();
      this.summary = { day: this.day - 1, income, shippedList, passedOut };
    };
  }

  // ---------------- 粒子 ----------------
  spawnBurst(x, y, colors, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = 20 + Math.random() * 40;
      this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 30, life: 0.5 + Math.random() * 0.3, c: colors[i % colors.length], g: 140 });
    }
  }
  spawnHearts(x, y) {
    for (let i = 0; i < 3; i++) this.particles.push({ x: x - 6 + i * 6, y, vx: 0, vy: -18 - i * 4, life: 1.2, c: '#f06a8a', g: 0, heart: true });
  }

  // ============================================================
  //  更新
  // ============================================================
  update(dt) {
    this.time += dt;
    for (const p of this.petals) {
      p.p += dt * 3; p.x += (p.vx + Math.sin(p.p) * 10) * dt; p.y += p.vy * dt;
      if (p.y > VH + 4 || p.x > VW + 30) Object.assign(p, this.newPetal(false));
    }
    if (this.mode === 'title') return this.updateTitle();
    if (this.mode === 'sleep') return this.updateSleep(dt);

    for (const t of this.toasts) t.life -= dt;
    this.toasts = this.toasts.filter(t => t.life > 0);
    for (const p of this.particles) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; }
    this.particles = this.particles.filter(p => p.life > 0);
    if (this.action && (this.action.t += dt) > 0.25) this.action = null;
    this.selShow = Math.max(0, this.selShow - dt);

    if (this.dialog) { this.updateDialog(dt); this.player.moving = false; return; }
    if (this.menu) { this.updateMenu(); this.player.moving = false; return; }

    // 时间流逝
    this.tickAcc += dt * 1000;
    while (this.tickAcc >= MIN_PER_TICK_MS) { this.tickAcc -= MIN_PER_TICK_MS; this.minutes++; }
    if (this.minutes >= DAY_END) {
      this.say([{ name: '', text: '已经凌晨两点了……\n你累得眼前一黑，倒了下去。' }], () => this.sleep(true));
      return;
    }

    // 快捷栏
    for (let i = 0; i < 8; i++) if (hit('Digit' + (i + 1))) { this.sel = i; this.selShow = 1.5; }
    if (hit('KeyQ')) { this.sel = (this.sel + 7) % 8; this.selShow = 1.5; }
    if (hit('Tab')) { this.sel = (this.sel + 1) % 8; this.selShow = 1.5; }

    // 移动
    const p = this.player;
    let mx = 0, my = 0;
    if (down('ArrowLeft', 'KeyA')) mx -= 1;
    if (down('ArrowRight', 'KeyD')) mx += 1;
    if (down('ArrowUp', 'KeyW')) my -= 1;
    if (down('ArrowDown', 'KeyS')) my += 1;
    p.moving = false;
    if ((mx || my) && !this.action) {
      if (my) p.dir = my < 0 ? 'up' : 'down';
      if (mx && !my) p.dir = mx < 0 ? 'left' : 'right';
      const len = Math.hypot(mx, my), sp = (down('ShiftLeft', 'ShiftRight') ? 110 : 72) * dt;
      const others = [...this.npcs, this.cat];
      if (p.move(mx / len * sp, my / len * sp, this.world, others)) { p.moving = true; p.animT += dt * (sp > 80 * dt ? 1.5 : 1); }
    }

    for (const n of this.npcs) n.update(dt, this.world, [p, ...this.npcs]);
    this.cat.update(dt, this.world);

    if (hit('KeyE', 'Enter', 'KeyK')) this.interact();
    else if (hit('Space', 'KeyJ')) this.useTool();

    if (hit('Escape')) this.say([{ name: '', text: '暂停中', choices: [
      { label: '继续游戏', fn: null }, { label: '回到标题', fn: () => { this.mode = 'title'; this.titleCursor = 0; } }] }]);
  }

  updateTitle() {
    const opts = this.titleOptions();
    if (hit('ArrowUp', 'KeyW')) this.titleCursor = (this.titleCursor + opts.length - 1) % opts.length;
    if (hit('ArrowDown', 'KeyS')) this.titleCursor = (this.titleCursor + 1) % opts.length;
    if (hit(...CONFIRM)) {
      const o = opts[this.titleCursor];
      if (o.id === 'continue' && this.loadSave()) { this.mode = 'play'; this.toast(`第 ${this.day} 天 · 欢迎回来`); }
      else if (o.id === 'new') {
        this.newGame(); this.mode = 'play';
        this.say([
          { name: '', text: '……' },
          { name: '你', text: '这里就是爷爷留下的农场吗。\n樱花开得真好啊。' },
          { name: '', text: '【操作说明】\nWASD / 方向键：移动　Shift：跑步\n空格 / J：使用手中的道具　E / Enter：交谈、调查' },
          { name: '', text: '【操作说明】\n1～8 / Q / Tab：切换道具\n先用锄头开垦栅栏里的草地，再撒种、浇水吧！' },
        ]);
      }
    }
  }
  titleOptions() {
    const o = [{ id: 'new', label: '新的开始' }];
    if (this.hasSave()) o.unshift({ id: 'continue', label: '继续游戏' });
    return o;
  }

  updateSleep(dt) {
    if (this.fadeDir > 0) {
      this.fade = Math.min(1, this.fade + dt * 1.5);
      if (this.fade >= 1 && this.afterFade) { const f = this.afterFade; this.afterFade = null; f(); }
      if (this.summary && hit(...CONFIRM)) { this.fadeDir = -1; }
    } else {
      this.fade = Math.max(0, this.fade - dt * 1.5);
      if (this.fade <= 0) {
        this.mode = 'play'; this.summary = null;
        this.toast(`${this.season()} ${this.dayOfMonth()}日（${WEEK[(this.day - 1) % 7]}）早上好！`);
      }
    }
  }

  // ============================================================
  //  绘制
  // ============================================================
  draw() {
    const g = ctx, p = this.player, w = this.world;
    // 摄像机
    let tx = p.x - VW / 2, ty = p.y - VH / 2;
    if (this.mode === 'title') { tx = 29 * TILE + Math.sin(this.time * 0.1) * 40; ty = 2 * TILE; }
    const cx = Math.round(Math.max(0, Math.min(w.W * TILE - VW, tx)));
    const cy = Math.round(Math.max(0, Math.min(w.H * TILE - VH, ty)));
    // 花瓣跟着世界移动
    for (const pt of this.petals) { pt.x -= cx - this.camX; pt.y -= cy - this.camY; if (pt.x < -30) pt.x += VW + 60; if (pt.y < -10) pt.y += VH + 10; }
    this.camX = cx; this.camY = cy;

    g.drawImage(w.groundCanvas, cx, cy, VW, VH, 0, 0, VW, VH);
    w.drawWater(g, cx, cy, VW, VH, this.time);
    w.drawCrops(g, cx, cy, VW, VH);

    // 目标格子提示
    if (this.mode === 'play' && !this.dialog && !this.menu) {
      const [fx, fy] = p.facing(), X = fx * TILE - cx, Y = fy * TILE - cy;
      g.fillStyle = 'rgba(255,255,255,0.75)';
      for (const [ax, ay] of [[0, 0], [12, 0], [0, 15], [12, 15]]) g.fillRect(X + ax, Y + ay, 4, 1);
      for (const [ax, ay] of [[0, 0], [15, 0], [0, 12], [15, 12]]) g.fillRect(X + ax, Y + ay, 1, 4);
    }

    // y 排序绘制所有立体物
    const list = [];
    w.collectSprites(cx, cy, VW, VH, list);
    const actors = [...this.npcs, this.cat];
    if (this.mode !== 'title') actors.push(p);
    for (const a of actors) list.push({ y: a.y, draw: (gg, x, y) => a.draw(gg, x, y) });
    list.sort((a, b) => a.y - b.y);
    const pr = [p.x - 6, p.y - 18, p.x + 6, p.y];
    for (const s of list) {
      let alpha = 1;
      // 玩家走到树/建筑后面时，让前景半透明
      if (s.tall && this.mode !== 'title' && s.y > p.y) {
        const [rx, ry, rw, rh] = s.rect;
        if (pr[0] < rx + rw && pr[2] > rx && pr[1] < ry + rh && pr[3] > ry) alpha = 0.55;
      }
      s.draw(g, cx, cy, alpha);
    }

    // 工具动作
    if (this.action) {
      const [dx, dy] = DIRS[p.dir], k = this.action.t / 0.25;
      const icon = this.art.icons[this.action.icon];
      g.save();
      g.translate(Math.round(p.x - cx + dx * 9), Math.round(p.y - 10 - cy + dy * 6));
      g.rotate((dx < 0 ? -1 : 1) * (-0.8 + k * 1.6));
      g.drawImage(icon, -8, -12);
      g.restore();
    }

    // 粒子
    for (const pt of this.particles) {
      g.fillStyle = pt.c;
      const X = Math.round(pt.x - cx), Y = Math.round(pt.y - cy);
      if (pt.heart) { g.fillRect(X - 2, Y, 2, 2); g.fillRect(X + 1, Y, 2, 2); g.fillRect(X - 1, Y + 1, 3, 2); g.fillRect(X, Y + 3, 1, 1); }
      else g.fillRect(X, Y, 2, 2);
    }

    // 樱花花瓣
    for (const pt of this.petals) {
      g.fillStyle = pt.c;
      const X = Math.round(pt.x), Y = Math.round(pt.y);
      if (Math.sin(pt.p) > 0) g.fillRect(X, Y, 2, 1); else g.fillRect(X, Y, 1, 2);
    }

    this.drawLighting(g, cx, cy);

    if (this.mode === 'title') return this.drawTitle(g);
    this.drawHUD(g);
    if (this.menu) this.drawShop(g);
    if (this.dialog) this.drawDialog(g);
    if (this.mode === 'sleep') this.drawSleep(g);
  }

  drawLighting(g, cx, cy) {
    const lv = this.mode === 'title' ? 0 : this.nightLevel();
    const m = this.minutes;
    // 傍晚的暖色
    if (m > 16 * 60 && m < 20 * 60 && this.mode !== 'title') {
      const k = 1 - Math.abs(m - 18 * 60) / 120;
      g.fillStyle = `rgba(255,140,60,${0.18 * k})`; g.fillRect(0, 0, VW, VH);
    }
    if (lv <= 0) return;
    dctx.globalCompositeOperation = 'source-over';
    dctx.clearRect(0, 0, VW, VH);
    dctx.fillStyle = `rgba(12,16,48,${lv})`;
    dctx.fillRect(0, 0, VW, VH);
    dctx.globalCompositeOperation = 'destination-out';
    for (const L of this.world.lights()) {
      const x = L.x - cx, y = L.y - cy;
      if (x < -L.r || y < -L.r || x > VW + L.r || y > VH + L.r) continue;
      const grad = dctx.createRadialGradient(x, y, 2, x, y, L.r);
      grad.addColorStop(0, 'rgba(0,0,0,0.9)'); grad.addColorStop(1, 'rgba(0,0,0,0)');
      dctx.fillStyle = grad; dctx.fillRect(x - L.r, y - L.r, L.r * 2, L.r * 2);
    }
    // 玩家身边一点点可见度
    const px0 = this.player.x - cx, py0 = this.player.y - 8 - cy;
    const pg = dctx.createRadialGradient(px0, py0, 2, px0, py0, 40);
    pg.addColorStop(0, 'rgba(0,0,0,0.45)'); pg.addColorStop(1, 'rgba(0,0,0,0)');
    dctx.fillStyle = pg; dctx.fillRect(px0 - 40, py0 - 40, 80, 80);
    g.drawImage(darkCanvas, 0, 0);
    // 暖色灯光
    g.globalCompositeOperation = 'lighter';
    for (const L of this.world.lights()) {
      const x = L.x - cx, y = L.y - cy;
      if (x < -L.r || y < -L.r || x > VW + L.r || y > VH + L.r) continue;
      const grad = g.createRadialGradient(x, y, 1, x, y, L.r * 0.8);
      grad.addColorStop(0, `rgba(255,170,70,${0.35 * lv})`); grad.addColorStop(1, 'rgba(255,170,70,0)');
      g.fillStyle = grad; g.fillRect(x - L.r, y - L.r, L.r * 2, L.r * 2);
    }
    g.globalCompositeOperation = 'source-over';
  }

  drawHUD(g) {
    // 右上：日期、时间、金钱
    const x = VW - 90, y = 4;
    panel(g, x, y, 86, 50);
    text(g, `${this.season()} ${this.dayOfMonth()}日（${WEEK[(this.day - 1) % 7]}）`, x + 8, y + 5);
    const sunUp = this.minutes < 18 * 60;
    if (sunUp) {
      g.fillStyle = '#ffd24a'; g.fillRect(x + 10, y + 21, 5, 7); g.fillRect(x + 9, y + 22, 7, 5);
      g.fillStyle = '#fff2a0'; g.fillRect(x + 10, y + 22, 2, 2);
    } else {   // 月牙
      g.fillStyle = '#f4efb0';
      g.fillRect(x + 10, y + 21, 3, 1); g.fillRect(x + 9, y + 22, 2, 5); g.fillRect(x + 10, y + 27, 3, 1); g.fillRect(x + 11, y + 26, 3, 1);
    }
    text(g, this.clockStr(), x + 22, y + 19);
    text(g, `${this.gold} G`, x + 8, y + 33, '#ffe08a');

    // 右下：体力条
    const ex = VW - 16, ey = VH - 66, eh = 58;
    panel(g, ex - 4, ey - 4, 16, eh + 8);
    const k = this.energy / this.maxEnergy;
    g.fillStyle = '#10142c'; g.fillRect(ex, ey, 8, eh);
    g.fillStyle = k > 0.5 ? '#6ad04a' : k > 0.25 ? '#f2d24a' : '#e8503c';
    const fh = Math.round((eh - 2) * k);
    g.fillRect(ex + 1, ey + 1 + (eh - 2 - fh), 6, fh);
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(ex + 1, ey + 1 + (eh - 2 - fh), 2, fh);

    // 下方：快捷栏
    const n = 8, sw = 20, hx = Math.round((VW - n * sw - 6) / 2), hy = VH - 26;
    panel(g, hx, hy, n * sw + 6, 24);
    for (let i = 0; i < n; i++) {
      const sx = hx + 3 + i * sw, sy = hy + 3;
      g.fillStyle = '#131838'; g.fillRect(sx + 1, sy + 1, sw - 2, 16);
      const s = this.slots[i];
      if (s) {
        g.drawImage(this.art.icons[ITEMS[s.id].icon], sx + 2, sy + 1);
        if (s.n != null) tinyNum(g, s.n, sx + sw - 1, sy + 12);
        if (s.id === 'can') {
          g.fillStyle = '#10142c'; g.fillRect(sx + 3, sy + 15, 14, 2);
          g.fillStyle = '#6ac8f0'; g.fillRect(sx + 3, sy + 15, Math.round(14 * this.waterLeft / this.maxWater), 2);
        }
      }
      if (i === this.sel) {
        g.fillStyle = '#ffd24a';
        g.fillRect(sx, sy, sw, 1); g.fillRect(sx, sy + 17, sw, 1); g.fillRect(sx, sy, 1, 18); g.fillRect(sx + sw - 1, sy, 1, 18);
      }
    }
    // 选中道具名
    const cur = this.slots[this.sel];
    if (cur && this.selShow > 0) {
      const name = ITEMS[cur.id].name, tw = textW(g, name) + 12;
      panel(g, Math.round(VW / 2 - tw / 2), hy - 20, Math.round(tw), 18);
      text(g, name, Math.round(VW / 2 - tw / 2 + 6), hy - 17);
    }

    // 左侧：提示消息
    let ty = VH - 46;
    for (let i = this.toasts.length - 1; i >= 0; i--) {
      const t = this.toasts[i];
      g.globalAlpha = Math.min(1, t.life * 2);
      const tw = textW(g, t.t) + 10;
      g.fillStyle = 'rgba(20,20,48,0.75)'; g.fillRect(4, ty, tw, 15);
      text(g, t.t, 9, ty + 2, t.color || '#f4efe4');
      g.globalAlpha = 1;
      ty -= 17;
    }
  }

  drawDialog(g) {
    const d = this.dialog, page = d.pages[d.i];
    if (!d.lines) d.lines = wrap(g, page.text, VW - 56);
    const bx = 12, bh = 62, by = VH - bh - 8, bw = VW - 24;
    panel(g, bx, by, bw, bh);
    if (page.name) {
      const nw = textW(g, page.name) + 16;
      panel(g, bx + 6, by - 16, Math.round(nw), 18);
      text(g, page.name, bx + 14, by - 13, '#ffe08a');
    }
    let left = Math.floor(d.chars);
    d.lines.forEach((ln, i) => {
      const part = ln.slice(0, Math.max(0, left));
      left -= ln.length;
      text(g, part, bx + 14, by + 10 + i * 15);
    });
    const done = d.chars >= d.lines.join('').length;
    if (done && page.choices) {
      const cw = Math.max(...page.choices.map(c => textW(g, c.label))) + 30, ch = page.choices.length * 15 + 10;
      const cx0 = bx + bw - cw - 4, cy0 = by - ch - 2;
      panel(g, cx0, cy0, Math.round(cw), ch);
      page.choices.forEach((c, i) => {
        const sel = i === d.cursor;
        if (sel) { g.fillStyle = '#ffd24a'; this.drawCursor(g, cx0 + 8, cy0 + 8 + i * 15); }
        text(g, c.label, cx0 + 18, cy0 + 5 + i * 15, sel ? '#ffe08a' : '#f4efe4');
      });
    } else if (done && Math.floor(this.time * 3) % 2 === 0) {
      g.fillStyle = '#ffd24a';
      const ax = bx + bw - 16, ay = by + bh - 12;
      g.fillRect(ax, ay, 7, 1); g.fillRect(ax + 1, ay + 1, 5, 1); g.fillRect(ax + 2, ay + 2, 3, 1); g.fillRect(ax + 3, ay + 3, 1, 1);
    }
  }

  drawCursor(g, x, y) {   // ▶
    g.fillStyle = '#ffd24a';
    g.fillRect(x, y, 1, 7); g.fillRect(x + 1, y + 1, 1, 5); g.fillRect(x + 2, y + 2, 1, 3); g.fillRect(x + 3, y + 3, 1, 1);
  }

  drawShop(g) {
    const m = this.menu, list = this.shopList();
    const w = 260, h = 132, x = (VW - w) / 2, y = 22;
    panel(g, x, y, w, h);
    const tabs = [['buy', '购买'], ['sell', '出售']];
    tabs.forEach(([id, label], i) => {
      const on = m.mode === id;
      text(g, (on ? '【' : '　') + label + (on ? '】' : '　'), x + 12 + i * 60, y + 7, on ? '#ffe08a' : '#8a94c8');
    });
    text(g, `${this.gold} G`, x + w - 12 - textW(g, `${this.gold} G`), y + 7, '#ffe08a');
    g.fillStyle = '#8a94c8'; g.fillRect(x + 8, y + 22, w - 16, 1);
    if (!list.length) text(g, m.mode === 'sell' ? '没有可以出售的作物。' : '', x + 16, y + 32, '#8a94c8');
    list.forEach((it, i) => {
      const ry = y + 28 + i * 20, sel = i === m.cursor;
      if (sel) { g.fillStyle = 'rgba(255,210,74,0.15)'; g.fillRect(x + 8, ry, w - 16, 19); this.drawCursor(g, x + 12, ry + 6); }
      g.drawImage(this.art.icons[ITEMS[it.id].icon], x + 20, ry + 1);
      text(g, ITEMS[it.id].name + (it.n != null ? ` ×${it.n}` : ''), x + 40, ry + 4, sel ? '#ffe08a' : '#f4efe4');
      const ps = `${it.price} G`;
      text(g, ps, x + w - 14 - textW(g, ps), ry + 4, '#ffe08a');
    });
    text(g, '←→ 切换　E 确定　Shift+E ×5　Esc 关闭', x + 10, y + h - 17, '#8a94c8');
  }

  drawSleep(g) {
    g.fillStyle = `rgba(8,8,24,${this.fade})`; g.fillRect(0, 0, VW, VH);
    const s = this.summary;
    if (!s || this.fadeDir < 0) return;
    const w = 200, h = 96, x = (VW - w) / 2, y = (VH - h) / 2;
    panel(g, x, y, w, h);
    text(g, `第 ${s.day} 天结束`, x + 14, y + 10, '#ffe08a');
    if (s.passedOut) text(g, '（晕倒了……体力只恢复了一部分）', x + 14, y + 26, '#ff9a8a');
    const shipped = s.shippedList.map(e => `${ITEMS[e.id].name}×${e.n}`).join('、') || '无';
    text(g, '出货：' + shipped, x + 14, y + 42);
    text(g, `收入：${s.income} G`, x + 14, y + 58, '#ffe08a');
    if (Math.floor(this.time * 2) % 2 === 0) text(g, '按 E 继续', x + w - 70, y + h - 16, '#8a94c8');
  }

  drawTitle(g) {
    g.fillStyle = 'rgba(20,16,48,0.35)'; g.fillRect(0, 0, VW, VH);
    const title = '樱之村物语';
    g.font = FONT_BIG; g.textBaseline = 'top';
    const tw = g.measureText(title).width, tx = Math.round((VW - tw) / 2), ty = 44;
    g.fillStyle = '#1a1428';
    for (const [ox, oy] of [[-2, 0], [2, 0], [0, -2], [0, 2], [2, 2]]) g.fillText(title, tx + ox, ty + oy);
    g.fillStyle = '#ffdcea'; g.fillText(title, tx, ty);
    g.fillStyle = PAL.pinkDark; g.fillText(title, tx, ty + 1); g.fillStyle = '#fff4f8'; g.fillText(title, tx, ty);
    const sub = '～ Sakura Village Story ～';
    text(g, sub, Math.round((VW - textW(g, sub)) / 2), ty + 32, '#fff4f8');
    const opts = this.titleOptions();
    const w = 110, h = opts.length * 16 + 12, x = Math.round((VW - w) / 2), y = 120;
    panel(g, x, y, w, h);
    opts.forEach((o, i) => {
      const sel = i === this.titleCursor;
      if (sel) this.drawCursor(g, x + 14, y + 10 + i * 16);
      text(g, o.label, x + 26, y + 7 + i * 16, sel ? '#ffe08a' : '#f4efe4');
    });
    text(g, '↑↓ 选择　Enter 确定', Math.round((VW - textW(g, '↑↓ 选择　Enter 确定')) / 2), VH - 20, '#fff4f8');
  }
}

// ---------------- 主循环 ----------------
let GAME;
(window.FONT_READY || Promise.resolve()).then(() => {
  GAME = window.GAME = new Game();
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    GAME.update(dt);
    GAME.draw();
    for (const k in pressed) delete pressed[k];
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
});
