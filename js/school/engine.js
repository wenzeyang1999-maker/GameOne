// ============================================================
//  学校篇引擎：输入、角色、场景、寻路、对话、场景切换
//  场景由 buildXxx() 返回一个“场景定义”，见 Scene 上方的说明
// ============================================================

const VW = 384, VH = 216;
const SAVE_KEY = 'school-save-v1';   // 自动存档：记住所在的场景和位置
const FONT = '12px PixelFont, "PingFang SC", "Microsoft YaHei", sans-serif';
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

// ---------------- 画布 ----------------
const canvas = document.getElementById('game');
canvas.width = VW; canvas.height = VH;
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;
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

const mouse = { x: -1, y: -1, click: null };
function toView(e) {
  const r = canvas.getBoundingClientRect();
  return [(e.clientX - r.left) / r.width * VW, (e.clientY - r.top) / r.height * VH];
}
canvas.addEventListener('mousemove', e => { [mouse.x, mouse.y] = toView(e); });
canvas.addEventListener('mouseleave', () => { mouse.x = mouse.y = -1; });
canvas.addEventListener('mousedown', e => { mouse.click = toView(e); });

// ---------------- 文字与窗口 ----------------
function text(g, s, x, y, color = '#f4efe4', shadow = '#1a1428') {
  g.font = FONT; g.textBaseline = 'top';
  if (shadow) { g.fillStyle = shadow; g.fillText(s, x + 1, y + 1); }
  g.fillStyle = color; g.fillText(s, x, y);
}
function textW(g, s) { g.font = FONT; return g.measureText(s).width; }
function panel(g, x, y, w, h, top = '#34408a', bot = '#1c2250') {
  g.fillStyle = '#1a1428'; g.fillRect(x + 1, y, w - 2, h); g.fillRect(x, y + 1, w, h - 2);
  g.fillStyle = '#f4efe4'; g.fillRect(x + 1, y + 1, w - 2, h - 2);
  const grad = g.createLinearGradient(0, y, 0, y + h);
  grad.addColorStop(0, top); grad.addColorStop(1, bot);
  g.fillStyle = grad; g.fillRect(x + 2, y + 2, w - 4, h - 4);
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

// ============================================================
//  角色
// ============================================================
class Person {
  constructor(look, tx, ty, dir = 'down') {
    this.frames = buildCharacter(look);
    this.place(tx, ty, dir);
    this.moving = false; this.animT = 0;
  }
  place(tx, ty, dir) { this.x = tx * 16 + 8; this.y = ty * 16 + 12; if (dir) this.dir = dir; }
  tile() { return [Math.floor(this.x / 16), Math.floor((this.y - 2) / 16)]; }
  facing() { const [tx, ty] = this.tile(), [dx, dy] = DIRS[this.dir]; return [tx + dx, ty + dy]; }
  box(x = this.x, y = this.y) { return [x - 5, y - 4, x + 5, y + 1]; }
  frameIndex() { return this.moving ? [1, 0, 2, 0][Math.floor(this.animT * 7) % 4] : 0; }
  draw(g, cx, cy) {
    const f = this.frameIndex(), img = this.frames[this.dir][f];
    g.fillStyle = 'rgba(40,20,10,0.25)'; g.fillRect(Math.round(this.x - 5 - cx), Math.round(this.y - 1 - cy), 10, 3);
    g.drawImage(img, Math.round(this.x - 8 - cx), Math.round(this.y - img.height + 1 - cy) - (f ? 1 : 0));
  }
}

const LOOK = {
  player: { hair: '#3a2a2a', hairDark: '#241818', cloth: '#2a2e48', clothDark: '#1c1f34', pants: '#2a2e48', collar: '#f4efe4', shoes: '#f4efe4' },   // 立领学生服
  sailor: (hair, hairDark) => ({ hair, hairDark, cloth: '#f4efe4', clothDark: '#c8c4d4', pants: '#2a3a6a', collar: '#2a3a6a', shoes: '#6a3a2a' }), // 水手服
  gakuran: (hair, hairDark) => ({ hair, hairDark, cloth: '#2a2e48', clothDark: '#1c1f34', pants: '#2a2e48', collar: '#f4efe4', shoes: '#f4efe4' }),
  teacher: { hair: '#4a3a3a', hairDark: '#2e2222', cloth: '#6a6e7e', clothDark: '#4e5262', pants: '#3e4250', collar: '#f4efe4', shoes: '#2e2a2a' },
  jersey: { hair: '#2a2424', hairDark: '#1a1414', cloth: '#2e5ab0', clothDark: '#22448a', pants: '#2e5ab0', collar: '#f4efe4', shoes: '#f4efe4' },  // 体育老师的运动服
};

// 捡到的东西：id -> {name, desc, color}。捡起来时会把定义存进来，读档后书包里也能显示
const ITEM_DB = {};

// 书包里那个小书本图标
function drawBookIcon(g, x, y, color) {
  g.fillStyle = PAL.k; g.fillRect(x, y, 10, 13);
  g.fillStyle = color; g.fillRect(x + 1, y + 1, 8, 11);
  g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(x + 1, y + 1, 8, 1);
  g.fillStyle = '#f4efe4'; g.fillRect(x + 7, y + 1, 2, 11);
  g.fillStyle = PAL.k; g.fillRect(x + 3, y + 4, 4, 1); g.fillRect(x + 3, y + 6, 3, 1);
}

// 两个颜色之间插值
function mixHex(a, b, k) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const mix = (sa, sb) => Math.round(sa + (sb - sa) * k);
  const r = mix((pa >> 16) & 255, (pb >> 16) & 255), g = mix((pa >> 8) & 255, (pb >> 8) & 255), bl = mix(pa & 255, pb & 255);
  return '#' + [r, g, bl].map(v => v.toString(16).padStart(2, '0')).join('');
}

function overlaps(a, b) { return a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1]; }

// ============================================================
//  场景
//  场景定义：{
//    id, name, W, H, bg,                   // 大小（格）与预渲染背景
//    solid: Uint8Array(W*H),               // 1 = 走不过去
//    props: [{img, x, y, base}],           // 需要 y 排序的家具（像素坐标，base 为排序基线）
//    spots: Map("x,y" -> {name, text}),    // 可调查的东西
//    items: Map("x,y" -> {id, name, text, desc}),   // 能捡起来的东西（捡过一次就没了）
//    exits: Map("x,y" -> {to, entry}),     // 踩上去就切换场景（这些格子必须能走）
//    entries: {名字: {x, y, dir}},          // 从别的场景进来时站的位置
//    npcs: [{name, look, x, y, dir, lines, area?}],   // area = [x0,y0,x1,y1] 会在范围内闲逛
//    overlay?(g, cx, cy, time),            // 额外的前景效果（花瓣等）
//    camY?: 'top' | 'bottom'               // 场景比屏幕高时，镜头贴顶还是贴底（默认贴底）
//  }
// ============================================================
class Scene {
  constructor(def) {
    Object.assign(this, def);
    this.people = def.npcs.map(n => ({ ...n, p: new Person(n.look, n.x, n.y, n.dir), home: n.dir, wait: 1 + Math.random() * 3, target: null, talking: false }));
  }
  isSolid(x, y) { return x < 0 || y < 0 || x >= this.W || y >= this.H || !!this.solid[y * this.W + x]; }
  // 开门、撬门之后要改碰撞，所以场景建好之后也得能改
  setSolidAt(x, y, v) { this.solid[y * this.W + x] = v; }
  personAt(x, y) { return this.people.find(n => { const [tx, ty] = n.p.tile(); return tx === x && ty === y; }) || null; }
  // 寻路用：这一格是墙/家具，或者站在格子中间会碰到某个人（包括走到一半、身子跨在两格之间的 NPC）
  blocked(x, y, ignore) {
    if (this.isSolid(x, y)) return true;
    const b = [x * 16 + 3, y * 16 + 8, x * 16 + 13, y * 16 + 13];
    return this.people.some(n => n.p !== ignore && overlaps(b, n.p.box()));
  }
  // b = 想走到的位置的碰撞框，from = 当前位置的碰撞框
  // 只挡住“走过去才会碰到”的人：万一已经重叠了，也总能走开，不会互相卡死
  rectBlocked(b, ignore, from) {
    for (let y = Math.floor(b[1] / 16); y <= Math.floor((b[3] - 0.01) / 16); y++)
      for (let x = Math.floor(b[0] / 16); x <= Math.floor((b[2] - 0.01) / 16); x++) if (this.isSolid(x, y)) return true;
    return this.people.some(n => n.p !== ignore && overlaps(b, n.p.box()) && !(from && overlaps(from, n.p.box())));
  }
}

// 建场景定义时用的小工具
function sceneBuilder(W, H) {
  const d = { W, H, solid: new Uint8Array(W * H), props: [], spots: new Map(), items: new Map(), exits: new Map(), entries: {}, npcs: [] };
  // 能捡的东西。it = {id, name, text, desc}
  d.item = (x, y, it) => d.items.set(x + ',' + y, it);
  d.setSolid = (x, y, v = 1) => { d.solid[y * W + x] = v; };
  d.spot = (x, y, name, t) => d.spots.set(x + ',' + y, { name, text: t });
  d.exit = (x, y, to, entry) => { d.setSolid(x, y, 0); d.exits.set(x + ',' + y, { to, entry }); };
  // 家具按“占的那格”底部对齐、水平居中
  d.prop = (tx, ty, img) => d.props.push({ img, x: tx * 16 + 8 - img.width / 2, y: (ty + 1) * 16 - img.height, base: (ty + 1) * 16 - 1 });
  return d;
}

// 开场可选的六个角色。现在外观一样，之后可以各自给 look
const CHARACTERS = [
  { name: 'Miss Ren', look: {                       // 暗金色长发、吊带上衣、短裙
    hair: '#b8903a', hairDark: '#8a6a24', cloth: '#aed4ee', clothDark: '#7fa9c9',
    collar: '#aed4ee', pants: '#3a3448', shoes: '#5a4432', cami: true, skirt: true, longHair: true,
  } },
  { name: 'Jojo', look: {                           // 黑 T 恤 + 黑裤子
    hair: '#2e2420', hairDark: '#1a1412', cloth: '#2b2b33', clothDark: '#191920',
    collar: '#2b2b33', pants: '#1f1f26', shoes: '#3a3a44', tshirt: true,
  } },
  { name: 'Kerry', look: {                          // 黑衬衫 + 深灰西装
    hair: '#1f1b1a', hairDark: '#100e0e', cloth: '#4e4e57', clothDark: '#363640',
    shirt: '#17171c', collar: '#17171c', pants: '#4a4a53', shoes: '#1d1d22', suit: true,
  } },
  { name: '凯哥', look: {                           // 无袖连帽卫衣 + 牛仔裤 + 黑白球鞋
    hair: '#5a4330', hairDark: '#3a2a1c', cloth: '#3a3b42', clothDark: '#23242a',
    collar: '#4e5059', stripe: '#d6d2c6', pants: '#34405c', shoes: '#1d1e24', hoodie: true,
  } },
  // 阿奇：白色运动套装，袖子和裤腿外侧一条深蓝条纹，细框眼镜
  { name: '阿奇', look: { hair: '#1d1a18', hairDark: '#0e0c0b', cloth: '#ece9e1', clothDark: '#c6c2b7', stripe: '#2b3566', collar: '#d8d4ca', pants: '#ded9cf', shoes: '#b1854f', track: true, glasses: '#4a4458' } },
  // Wen：普通 JK 水手服，白衬衣配藏青领子和百褶裙，红领结
  { name: 'Wen', look: { hair: '#3b2a20', hairDark: '#241710', cloth: '#f1ece1', clothDark: '#cdc7ba', collar: '#2b3454', shirt: '#b43a4a', stripe: '#f1ece1', pants: '#2f3a5c', shoes: '#6d4a34', jk: true } },
];

// ============================================================
//  游戏：管理当前场景、玩家、对话、切换
// ============================================================
class Game {
  constructor(builders, start) {
    this.builders = builders;
    this.scenes = {};
    this.start = start;
    this.player = new Person(LOOK.player, 0, 0, 'up');
    this.path = null; this.goal = null; this.marker = null; this.pathWait = 0;
    this.dialog = null; this.time = 0;
    this.fade = 0; this.fading = null;
    this.saveAcc = 0;
    this.bag = []; this.taken = new Set();       // 书包里的东西 / 已经捡过的
    this.declined = new Set();                   // 刚选过「放弃」的东西，走开之前不再问
    this.flags = new Set();                      // 剧情进度（'拿到撬棍' 等），存档带走
    this.monsters = []; this.fx = []; this.trail = []; this.swing = null; this.shake = 0;
    this.phase = 'day';                             // 时段：day 白天（没有怪）/ night 晚自习后（除教室外都锁）
    this.run = 0;                                   // 这是第几局，通关判彩蛋要用
    this.meta = loadMeta();                         // 跨周目进度，清档不动它
    this.restored = this.restore();                 // 有存档就接着上次玩
    this.mode = this.restored ? 'play' : 'select';  // 没存档就先选人
    this.pick = 0;
    if (this.restored) { /* 位置已经从存档里恢复 */ } else this.cur = this.scene(start.scene);
    // 关掉/切走页面时也存一次
    addEventListener('pagehide', () => this.save());
    addEventListener('visibilitychange', () => { if (document.hidden) this.save(); });
  }

  // ---------------- 存档 ----------------
  save() {
    if (!this.cur) return;
    const p = this.player;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ scene: this.cur.id, x: p.x, y: p.y, dir: p.dir, name: this.playerName, bag: this.bag, taken: [...this.taken], flags: [...this.flags], phase: this.phase, run: this.run }));
    } catch (e) { /* 浏览器不让存（无痕模式等）就算了 */ }
  }
  restore() {
    let d;
    try { d = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { return false; }
    if (!d || !this.builders[d.scene]) return false;
    this.cur = this.scene(d.scene);
    const p = this.player;
    p.x = d.x; p.y = d.y; p.dir = d.dir || 'down';
    this.bag = d.bag || []; this.taken = new Set(d.taken || []);
    this.flags = new Set(d.flags || []);
    // 读档回到序章：答应了却还没捡的话，钱包得重新放回草丛里
    if (this.cur.id === 'prologue' && this.flags.has('答应帮忙') && !this.taken.has('wallet')) {
      this.dropItem(WALLET[0], WALLET[1], walletItem(), spriteWallet());
    }
    this.playerName = d.name || CHARACTERS[0].name;
    this.phase = d.phase === 'night' ? 'night' : 'day';
    this.run = d.run || this.meta.runs || 1;        // 老存档没记局数，就按目前已开过的局算
    // 存档以后场景改过的话，位置可能卡在墙里：挪到最近能站的格子
    const [tx, ty] = p.tile();
    if (this.cur.isSolid(tx, ty) || this.cur.exits.has(tx + ',' + ty)) {
      const free = this.nearestFree(tx, ty);
      if (!free) { this.cur = null; return false; }
      p.place(free[0], free[1], p.dir);
    }
    this.enterTime = 0;
    return true;
  }
  nearestFree(tx, ty) {
    const s = this.cur, seen = new Set([tx + ',' + ty]), q = [[tx, ty]];
    for (let i = 0; i < q.length && i < 400; i++) {
      const [x, y] = q[i];
      if (!s.isSolid(x, y) && !s.exits.has(x + ',' + y)) return [x, y];
      for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
        const k = (x + dx) + ',' + (y + dy);
        if (!seen.has(k) && x + dx >= 0 && y + dy >= 0 && x + dx < s.W && y + dy < s.H) { seen.add(k); q.push([x + dx, y + dy]); }
      }
    }
    return null;
  }
  // 重新开始：清掉存档，回到最初的位置
  resetGame() {
    this.bag = []; this.taken = new Set(); this.flags = new Set();
    this.phase = 'day';
    this.scenes = {};   // 场景会被剧情改（捡走的东西、开过的门），重开一局得重新建
    // 只清这一局：META_KEY 不动，不然跨周目的进度和彩蛋就白攒了
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* 忽略 */ }
    this.mode = 'select'; this.pick = 0; this.dialog = null; this.fading = null; this.fade = 0;
  }

  // ---------------- 选人 ----------------
  startAs(i) {
    const c = CHARACTERS[i];
    this.playerName = c.name;
    this.player = new Person(c.look, 0, 0, 'up');
    this.phase = 'day';
    this.run = metaStartRun(this.meta);             // 新的一局，计数器 +1（读档继续不算）
    this.mode = 'play';
    // Miss Ren 从上学路上开始（序章），其他人直接进教室
    if (c.name === 'Miss Ren') this.enter('prologue', 'start');
    else this.enter(this.start.scene, this.start.entry);
    if (this.onStart) this.onStart();
  }

  updateSelect(click, dt) {
    const cols = 3;
    this.selT = (this.selT || 0) + (dt > 0 ? Math.min(dt, 0.1) : 0);
    this.hover = mouse.x < 0 ? -1 : this.selectCellAt(mouse.x, mouse.y);   // 鼠标指着谁
    if (this.hover >= 0) this.pick = this.hover;
    if (hit('ArrowRight', 'KeyD')) this.pick = (this.pick + 1) % CHARACTERS.length;
    if (hit('ArrowLeft', 'KeyA')) this.pick = (this.pick + CHARACTERS.length - 1) % CHARACTERS.length;
    if (hit('ArrowDown', 'KeyS')) this.pick = (this.pick + cols) % CHARACTERS.length;
    if (hit('ArrowUp', 'KeyW')) this.pick = (this.pick + CHARACTERS.length - cols) % CHARACTERS.length;
    if (click) {
      const i = this.selectCellAt(click[0], click[1]);
      if (i >= 0) { this.pick = i; this.startAs(i); return; }
    }
    if (hit('KeyE', 'Enter', 'Space')) this.startAs(this.pick);
  }

  selectCell(i) {        // 第 i 个头像在屏幕上的位置
    const cw = 92, ch = 62, x0 = (VW - cw * 3) / 2, y0 = 54;
    return [x0 + (i % 3) * cw, y0 + ((i / 3) | 0) * ch, cw - 6, ch - 6];
  }
  selectCellAt(mx, my) {
    for (let i = 0; i < CHARACTERS.length; i++) {
      const [x, y, w, h] = this.selectCell(i);
      if (mx >= x && my >= y && mx <= x + w && my <= y + h) return i;
    }
    return -1;
  }

  drawSelect(g) {
    g.fillStyle = '#14101f'; g.fillRect(0, 0, VW, VH);
    for (let i = 0; i < 40; i++) {                    // 背景里的一点星尘
      const x = (i * 97) % VW, y = (i * 53) % VH;
      g.fillStyle = i % 3 ? '#1e1830' : '#272040'; g.fillRect(x, y, 2, 2);
    }
    const title = '选择角色';
    g.font = FONT; g.textBaseline = 'top';
    const tw = textW(g, title);
    text(g, title, Math.round((VW - tw) / 2), 24, '#ffe08a');
    if (!this.selFrames) this.selFrames = CHARACTERS.map(c => buildCharacter(c.look).down);
    const CYCLE = [0, 1, 0, 2];                       // 迈左脚 -> 站 -> 迈右脚 -> 站
    CHARACTERS.forEach((c, i) => {
      const [x, y, w, h] = this.selectCell(i), on = i === this.pick, hv = i === this.hover;
      // 鼠标指上去：底色亮起来，小人停下（以后这里还会在右下角弹高清立绘）
      panel(g, x, y, w, h, hv ? '#4d5fc4' : '#34408a', hv ? '#2a3576' : '#1c2250');
      if (on) { g.fillStyle = '#ffd24a'; for (const [ax, ay, bw, bh] of [[0, 0, 8, 1], [0, 0, 1, 8], [w - 8, 0, 8, 1], [w - 1, 0, 1, 8], [0, h - 1, 8, 1], [0, h - 8, 1, 8], [w - 8, h - 1, 8, 1], [w - 1, h - 8, 1, 8]]) g.fillRect(x + ax, y + ay, bw, bh); }
      // 原地踏步 + 上下一点点浮动，每个人错开一点，看起来不整齐划一
      const t = (this.selT || 0) + i * 0.37;
      const f = hv ? 0 : CYCLE[Math.floor(t * 4) % 4];
      const bob = hv ? 0 : (Math.floor(t * 4) % 2 ? 0 : -2);
      const img = this.selFrames[i][f];
      g.drawImage(img, 0, 0, img.width, img.height, Math.round(x + w / 2 - img.width), y + 6 + bob, img.width * 2, img.height * 2);
      const nw = textW(g, c.name);
      text(g, c.name, Math.round(x + (w - nw) / 2), y + h - 16, on ? '#ffe08a' : '#f4efe4');
    });
    const tip = '方向键选择 · Enter 确定 · 也可以直接点';
    text(g, tip, Math.round((VW - textW(g, tip)) / 2), VH - 22, '#8a94c8');
  }

  scene(id) { return this.scenes[id] || (this.scenes[id] = new Scene(this.builders[id]())); }

  enter(id, entry) {
    this.cur = this.scene(id);
    const e = this.cur.entries[entry];
    this.player.place(e.x, e.y, e.dir);
    this.player.moving = false;
    this.path = null; this.goal = null; this.marker = null;
    this.monsters = []; this.fx = []; this.trail = []; this.swing = null;   // 怪物只待在当前场景
    this.enterTime = this.time;
    this.save();
  }
  // 淡出 -> 换场景 -> 淡入
  goTo(id, entry) { if (!this.fading) this.fading = { id, entry, phase: 'out' }; }

  // pages: [{name, text, choices?}]
  // choices = [{label, onPick(game)}]，挂在哪一页，就在那一页说完之后弹选项
  say(pages) { this.dialog = { pages, i: 0, chars: 0, lines: null, pick: 0, optRects: null }; }

  // ---------------- 寻路（BFS，4 方向） ----------------
  findPath(from, targets) {
    const s = this.cur, W = s.W, H = s.H, key = (x, y) => y * W + x;
    const prev = new Int32Array(W * H).fill(-1);
    const goal = new Set(targets.map(([x, y]) => key(x, y)));
    const q = [key(...from)]; prev[q[0]] = q[0];
    for (let qi = 0; qi < q.length; qi++) {
      const cur = q[qi];
      if (goal.has(cur)) {
        const out = [];
        for (let k = cur; k !== prev[k]; k = prev[k]) out.push([k % W, (k / W) | 0]);
        return out.reverse();
      }
      const cx = cur % W, cy = (cur / W) | 0;
      for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const nk = key(nx, ny);
        if (prev[nk] !== -1 || s.blocked(nx, ny)) continue;
        if (s.exits.has(nx + ',' + ny) && !goal.has(nk)) continue;   // 出口（门、楼梯）只能当终点，不能路过
        prev[nk] = cur; q.push(nk);
      }
    }
    return null;
  }

  // 点击某一格：能走就走过去；点到家具/人就走到旁边并调查
  // 点到的格子本身没东西（比如挂画的上半截、横幅、墙面），
  // 就在附近找最近的目标：能调查的、门、人，或者能站的地方。墙都在上面，所以优先往下找
  resolveClick(tx, ty) {
    const s = this.cur;
    const kind = (x, y) => {
      if (x < 0 || y < 0 || x >= s.W || y >= s.H) return 0;
      if (s.exits.has(x + ',' + y) || s.spots.has(x + ',' + y) || s.personAt(x, y)) return 2;
      return s.isSolid(x, y) ? 0 : 1;
    };
    if (kind(tx, ty)) return [tx, ty];
    let best = null, bestD = 1e9;
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
      const k = kind(tx + dx, ty + dy);
      if (!k) continue;
      const d = Math.abs(dx) + Math.abs(dy) * 0.9 - (dy > 0 ? 0.3 : 0) - (k === 2 ? 0.4 : 0);
      if (d < bestD) { bestD = d; best = [tx + dx, ty + dy]; }
    }
    return best;
  }

  clickTile(tx, ty) {
    const s = this.cur, start = this.player.tile();
    this.path = null; this.goal = null; this.marker = null;
    const target = this.resolveClick(tx, ty);
    if (!target) return;
    [tx, ty] = target;
    // 点到出口（比如楼梯的某一格）：走到通往同一个地方的最近那格
    const ex = s.exits.get(tx + ',' + ty);
    if (ex) {
      const targets = [...s.exits].filter(([, e]) => e.to === ex.to && e.entry === ex.entry).map(([k]) => k.split(',').map(Number));
      const p = this.findPath(start, targets);
      if (p && p.length) { this.path = p; this.marker = { x: tx, y: ty, t: 0 }; }
      return;
    }
    if (!s.blocked(tx, ty)) {
      const p = this.findPath(start, [[tx, ty]]);
      if (p && p.length) { this.path = p; this.marker = { x: tx, y: ty, t: 0 }; }
      return;
    }
    // 点到的是家具/人：找它旁边能站的格子。
    // 大块的东西（比如 3 格宽的楼梯）中间那格旁边没有空位，就沿着同一块东西往外找
    const region = [[tx, ty]], seen = new Set([tx + ',' + ty]), spot = s.spots.get(tx + ',' + ty);
    for (let i = 0; i < region.length && region.length < 40; i++) {
      const [x, y] = region[i];
      for (const [dx, dy] of [[0, 1], [-1, 0], [1, 0], [0, -1]]) {
        const k = (x + dx) + ',' + (y + dy);
        if (!seen.has(k) && spot && s.spots.get(k)?.text === spot.text && s.isSolid(x + dx, y + dy)) { seen.add(k); region.push([x + dx, y + dy]); }
      }
    }
    const standAt = new Map();   // 能站的格子 -> 站在那里要面对的那格
    for (const [x, y] of region) for (const [dx, dy] of [[0, 1], [-1, 0], [1, 0], [0, -1]]) {
      const k = (x + dx) + ',' + (y + dy);
      if (!standAt.has(k) && !s.exits.has(k) && !s.blocked(x + dx, y + dy)) standAt.set(k, [x, y]);
    }
    if (!standAt.size) return;
    const p = this.findPath(start, [...standAt.keys()].map(k => k.split(',').map(Number)));
    if (!p) return;
    const end = p.length ? p[p.length - 1] : start, face = standAt.get(end[0] + ',' + end[1]);
    if (!p.length) { this.faceAndInteract(...face); return; }   // 已经站在旁边了
    this.path = p; this.goal = face; this.marker = { x: tx, y: ty, t: 0 };
  }

  faceAndInteract(tx, ty) {
    const p = this.player, [px0, py0] = p.tile();
    p.dir = tx < px0 ? 'left' : tx > px0 ? 'right' : ty < py0 ? 'up' : 'down';
    this.interactAt(tx, ty);
  }

  // 捡起某一格的东西。捡到了（或者弹出了「捡不捡」的询问）返回 true
  pickUp(tx, ty) {
    const s = this.cur, it = s.items.get(tx + ',' + ty);
    if (!it || this.taken.has(it.id)) return false;
    // 标了 ask 的东西，先问一句，玩家自己选捡还是不捡
    if (it.ask) {
      this.say([{ name: '', text: it.text, choices: [
        { label: T('选项.拾取'), onPick: g => g.takeItem(tx, ty, false) },
        { label: T('选项.放弃'), onPick: g => g.declined.add(it.id) },
      ] }]);
      return true;
    }
    return this.takeItem(tx, ty, true);
  }

  // 真正把东西放进书包。showText = 要不要先念一遍 it.text（询问过的话就不用再念）
  takeItem(tx, ty, showText = true) {
    const s = this.cur, key = tx + ',' + ty, it = s.items.get(key);
    if (!it || this.taken.has(it.id)) return false;
    this.taken.add(it.id); this.bag.push(it.id); ITEM_DB[it.id] = it;
    // 捡走了就从场上消失：地上那一格、以及它自己那张图
    s.items.delete(key);
    if (it.prop) {
      const i = s.props.indexOf(it.prop);
      if (i >= 0) s.props.splice(i, 1);
    }
    this.save();
    const got = { name: '', text: `把「${it.name}」放进了书包。\n（按 I 可以看书包里的东西）` };
    this.say(showText ? [{ name: '', text: it.text }, got] : [got]);
    return true;
  }

  // 脚下和四周一圈的东西都能捡，不用正对着它
  pickUpNear(autoOnly = false) {
    const [px0, py0] = this.player.tile();
    let touching = false;
    for (const [dx, dy] of [[0, 0], [0, -1], [0, 1], [-1, 0], [1, 0]]) {
      const it = this.cur.items.get((px0 + dx) + ',' + (py0 + dy));
      if (!it || this.taken.has(it.id)) continue;
      if (autoOnly && !it.auto) continue;        // 自动捡只捡标了 auto 的
      touching = true;
      // 刚选过「放弃」的，站在旁边不再反复问；走开再回来才会重新问
      if (autoOnly && this.declined.has(it.id)) continue;
      return this.pickUp(px0 + dx, py0 + dy);
    }
    if (!touching) this.declined.clear();
    return false;
  }

  interactAt(tx, ty) {
    if (this.pickUp(tx, ty)) return;
    const n = this.cur.personAt(tx, ty);
    if (n) {
      const dx = this.player.x - n.p.x, dy = this.player.y - n.p.y;
      n.p.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
      n.talking = true; n.p.moving = false;
      // pagesFor 可以带选项；linesFor 让台词随剧情进度变；都没有就用固定的 lines
      const pages = n.pagesFor && n.pagesFor(this);
      if (pages) { this.say(pages); return; }
      // 一句可以是字符串（默认这个 NPC 说的），也可以是 {name, text} 指定说话的人
      const lines = n.linesFor ? n.linesFor(this) : n.lines;
      this.say(lines.map(t => (typeof t === 'string' ? { name: n.name, text: t } : t)));
      if (n.onTalk) n.onTalk(this);          // 说完这段要发生的事（给东西、开门……）
      return;
    }
    const s = this.cur.spots.get(tx + ',' + ty);
    if (s) this.say([{ name: s.name, text: s.text }]);
  }

  endDialog() {
    this.dialog = null;
    for (const n of this.cur.people) if (n.talking) { n.talking = false; n.p.dir = n.home; }
  }

  // 剧情中途往场景里放一样能捡的东西
  dropItem(tx, ty, it, img) {
    const s = this.cur;
    if (this.taken.has(it.id) || s.items.has(tx + ',' + ty)) return;
    s.items.set(tx + ',' + ty, it);
    if (img) {
      // 记住这张图，捡走的时候要把它从画面上删掉
      it.prop = { img, x: tx * 16 + 8 - img.width / 2, y: (ty + 1) * 16 - img.height, base: (ty + 1) * 16 - 1 };
      s.props.push(it.prop);
    }
  }

  // 直接塞进书包（剧情给的东西，不是从地上捡的）
  giveItem(it) {
    if (this.taken.has(it.id)) return;
    this.taken.add(it.id); this.bag.push(it.id); ITEM_DB[it.id] = it;
    this.save();
  }

  // NPC 在自己的范围里闲逛
  updateNPC(n, dt) {
    const p = n.p;
    p.moving = false;
    if (n.talking || !n.area) return;
    if (!n.target) {
      n.wait -= dt;
      if (n.wait <= 0) {
        const [x0, y0, x1, y1] = n.area;
        const tx = x0 + ((Math.random() * (x1 - x0 + 1)) | 0), ty = y0 + ((Math.random() * (y1 - y0 + 1)) | 0);
        if (!this.cur.isSolid(tx, ty)) { n.target = [tx * 16 + 8, ty * 16 + 12]; n.stuck = 0; }
      }
      return;
    }
    const sp = 30 * dt, ddx = n.target[0] - p.x, ddy = n.target[1] - p.y;
    let mx = 0, my = 0;
    if (Math.abs(ddx) > 1) mx = Math.sign(ddx) * Math.min(sp, Math.abs(ddx));
    else if (Math.abs(ddy) > 1) my = Math.sign(ddy) * Math.min(sp, Math.abs(ddy));
    else { n.target = null; n.wait = 2 + Math.random() * 4; p.dir = n.home; return; }
    p.dir = mx ? (mx < 0 ? 'left' : 'right') : (my < 0 ? 'up' : 'down');
    const b = p.box(p.x + mx, p.y + my), cur = p.box(), pb = this.player.box();
    if (!this.cur.rectBlocked(b, p, cur) && !(overlaps(b, pb) && !overlaps(cur, pb))) { p.x += mx; p.y += my; p.moving = true; p.animT += dt; }
    else if ((n.stuck += dt) > 1) { n.target = null; n.wait = 1; }
  }

  // ---------------- 更新 ----------------
  update(dt) {
    this.time += dt;
    if (this.mode === 'select') { const c = mouse.click; mouse.click = null; this.updateSelect(c, dt); return; }
    if (this.marker) this.marker.t += dt;
    // 走动的时候每隔几秒存一次
    if ((this.saveAcc += dt) > 3) { this.saveAcc = 0; if (this.player.moving) this.save(); }
    // R 按两次 = 重新开始（Mac 上 F2 是系统键，所以不用）
    if (hit('KeyR')) {
      if (this.askReset > 0) { this.askReset = 0; this.resetGame(); return; }
      this.askReset = 3; this.toast('再按一次 R 重新开始（会清掉存档）');
    }
    if (this.askReset > 0 && (this.askReset -= dt) <= 0) this.askReset = 0;
    const click = mouse.click; mouse.click = null;
    const p = this.player, s = this.cur;

    if (this.fading) {
      const f = this.fading;
      p.moving = false;
      if (f.phase === 'out') {
        this.fade = Math.min(1, this.fade + dt * 4);
        if (this.fade >= 1) { this.enter(f.id, f.entry); f.phase = 'in'; }
      } else {
        this.fade = Math.max(0, this.fade - dt * 4);
        if (this.fade <= 0) this.fading = null;
      }
      return;
    }

    if (this.bagOpen) {
      p.moving = false;
      if (hit('KeyI', 'KeyB', 'Escape') || click) this.bagOpen = false;
      return;
    }
    if (this.dialog) {
      p.moving = false;
      const d = this.dialog, page = d.pages[d.i], total = d.lines ? d.lines.join('').length : 999;
      d.chars = Math.min(total, d.chars + dt * 45);
      const choosing = page.choices && d.chars >= total;

      if (choosing) {
        // 选项：上下键挪，Enter 确定，也可以直接点
        if (hit('ArrowUp', 'KeyW')) d.pick = (d.pick + page.choices.length - 1) % page.choices.length;
        if (hit('ArrowDown', 'KeyS')) d.pick = (d.pick + 1) % page.choices.length;
        let confirmed = hit('KeyE', 'Enter', 'Space');
        if (click && d.optRects) {
          const i = d.optRects.findIndex(r => click[0] >= r[0] && click[0] <= r[0] + r[2] && click[1] >= r[1] && click[1] <= r[1] + r[3]);
          if (i >= 0) { d.pick = i; confirmed = true; }
        }
        if (confirmed) {
          const ch = page.choices[d.pick];
          this.endDialog();
          if (ch.onPick) ch.onPick(this);
        }
        return;
      }

      if (hit('KeyE', 'Enter', 'Space') || click) {
        if (d.chars < total) d.chars = total;
        else if (++d.i >= d.pages.length) this.endDialog();
        else { d.chars = 0; d.lines = null; d.pick = 0; }
      }
      return;
    }

    for (const n of s.people) this.updateNPC(n, dt);
    this.updateCombat(dt);

    // 键盘移动（会打断点击寻路）
    let mx = 0, my = 0;
    if (down('ArrowLeft', 'KeyA')) mx -= 1;
    if (down('ArrowRight', 'KeyD')) mx += 1;
    if (down('ArrowUp', 'KeyW')) my -= 1;
    if (down('ArrowDown', 'KeyS')) my += 1;
    p.moving = false;
    if (mx || my) {
      this.path = null; this.goal = null; this.marker = null;
      if (my) p.dir = my < 0 ? 'up' : 'down';
      if (mx && !my) p.dir = mx < 0 ? 'left' : 'right';
      const len = Math.hypot(mx, my), sp = (down('ShiftLeft', 'ShiftRight') ? 100 : 64) * dt;
      const ddx = mx / len * sp, ddy = my / len * sp;
      if (ddx && !s.rectBlocked(p.box(p.x + ddx, p.y), p, p.box())) { p.x += ddx; p.moving = true; }
      if (ddy && !s.rectBlocked(p.box(p.x, p.y + ddy), p, p.box())) { p.y += ddy; p.moving = true; }
      if (p.moving) p.animT += dt;
    } else if (this.path) {
      this.followPath(dt);
    }

    // 走到旁边就自动捡起来的东西（标了 auto 的，比如钱包）
    if (this.pickUpNear(true)) return;

    // 踩到出口就切换场景
    const [ptx, pty] = p.tile(), ex = s.exits.get(ptx + ',' + pty);
    if (ex) { this.goTo(ex.to, ex.entry); return; }

    if (hit('KeyI', 'KeyB')) { this.bagOpen = true; return; }
    if (hit('KeyM')) { this.spawnMonster(); this.toast(`异形 ×${this.monsters.length}（N 清除）`); }
    if (hit('KeyN')) { this.monsters = []; this.toast('异形已清除'); }
    if (hit('KeyJ', 'KeyK')) { this.attack(); return; }
    // 按 E：先捡四周的东西（不用正对着），没有再调查面前那一格
    if (hit('KeyE', 'Enter', 'Space')) { if (!this.pickUpNear()) this.interactAt(...p.facing()); return; }
    if (click) {
      const [cx, cy] = this.camera();
      this.clickTile(Math.floor((click[0] + cx) / 16), Math.floor((click[1] + cy) / 16));
    }
  }

  // 路被挡住太久：重新找一条路（找不到就停下来）
  repath() {
    const last = this.path[this.path.length - 1], goal = this.goal;
    this.pathWait = 0; this.path = null; this.goal = null; this.marker = null;
    this.clickTile(...(goal || last));
  }

  followPath(dt) {
    const p = this.player, [tx, ty] = this.path[0];
    // 有人挡在下一格（闲逛的 NPC）就等一下，等太久就重新找路
    if (this.cur.personAt(tx, ty)) {
      p.moving = false;
      if ((this.pathWait += dt) > 0.8) this.repath();
      return;
    }
    const gx = tx * 16 + 8, gy = ty * 16 + 12;
    const ddx = gx - p.x, ddy = gy - p.y, step = 64 * dt;
    let nx = p.x, ny = p.y;
    if (Math.abs(ddx) > 0.5) nx += Math.sign(ddx) * Math.min(step, Math.abs(ddx));
    else if (Math.abs(ddy) > 0.5) ny += Math.sign(ddy) * Math.min(step, Math.abs(ddy));
    if (nx !== p.x || ny !== p.y) {
      // 走动中的 NPC 可能半个身子挡在路上：按像素检查，会撞到就先等一下
      if (this.cur.rectBlocked(p.box(nx, ny), p, p.box())) { this.pathWait += dt; p.moving = false; if (this.pathWait > 0.8) this.repath(); return; }
      p.dir = nx !== p.x ? (nx < p.x ? 'left' : 'right') : (ny < p.y ? 'up' : 'down');
      p.x = nx; p.y = ny;
    } else {
      this.pathWait = 0;
      p.x = gx; p.y = gy; this.path.shift();
      if (!this.path.length) {
        this.path = null; this.marker = null;
        if (this.goal) {   // 到了，转身面对目标并调查
          const [gx2, gy2] = this.goal;
          this.goal = null;
          this.faceAndInteract(gx2, gy2);
        }
      }
    }
    p.moving = !!this.path; p.animT += dt;
  }

  // ---------------- 战斗 ----------------
  spawnMonster() {
    const [fx, fy] = this.player.facing();
    const s = this.cur;
    const spot = !s.isSolid(fx, fy) ? [fx, fy] : (this.nearestFree(fx, fy) || this.player.tile());
    this.monsters.push(new Monster(spot[0], spot[1]));
  }

  // 屏幕上方的小提示，1.5 秒后消失
  toast(t) { this.toastMsg = { t, life: 1.5 }; }

  knockPlayer(vx, vy) {
    this.path = null; this.goal = null;
    this.playerKnock = { vx, vy, t: 0.22 };
    this.shake = 0.18;
    this.burst(this.player.x, this.player.y - 8, '#d4443c', 6);
  }

  attack() {
    if (this.swing) return;
    const p = this.player, [dx, dy] = DIRS[p.dir];
    this.swing = { t: 0, dir: p.dir };
    // 面前的一块判定区
    const cx = p.x + dx * 14, cy = p.y - 4 + dy * 14;
    const box = [cx - 11, cy - 10, cx + 11, cy + 8];
    let hitAny = false;
    for (const m of this.monsters) {
      if (!overlaps(box, m.box())) continue;
      hitAny = true;
      // 撬棍只是打得更疼，没有也能打
      m.hurt(dx * 190 + (dx ? 0 : (m.x - p.x) * 2), dy * 190 + (dy ? 0 : (m.y - p.y) * 2), this.bag.includes('crowbar') ? 2 : 1);
      this.burst(m.x, m.y - 10, '#b8e0ff', 10);
      this.shake = 0.12;
      if (m.dead) this.burst(m.x, m.y - 10, '#6a7a9a', 18);
    }
    if (hitAny) this.monsters = this.monsters.filter(m => !m.dead);
  }

  // 怪物走过留下的痕迹：一块深色的印子 + 一滩绿色黏液，黏液会慢慢变浅
  addTrail(x, y) {
    const big = Math.random() < 0.3;                       // 偶尔滴一大滴
    this.trail.push({
      x: x + (Math.random() - 0.5) * 8, y: y - 1 + (Math.random() - 0.5) * 4,
      t: 0, life: (big ? 12 : 9) + Math.random() * 3, r: big ? 3 + Math.round(Math.random()) : 2,
    });
    if (this.trail.length > 90) this.trail.shift();
  }

  burst(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = 30 + Math.random() * 70;
      this.fx.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 20, life: 0.25 + Math.random() * 0.3, color });
    }
  }

  updateCombat(dt) {
    if (this.toastMsg && (this.toastMsg.life -= dt) <= 0) this.toastMsg = null;
    if (this.swing && (this.swing.t += dt) > 0.22) this.swing = null;
    this.shake = Math.max(0, this.shake - dt);
    if (this.playerKnock) {                       // 玩家被撞退
      const k = this.playerKnock, p = this.player;
      const nx = p.x + k.vx * dt, ny = p.y + k.vy * dt;
      if (!this.cur.rectBlocked(p.box(nx, p.y), p, p.box())) p.x = nx;
      if (!this.cur.rectBlocked(p.box(p.x, ny), p, p.box())) p.y = ny;
      k.vx *= 0.85; k.vy *= 0.85;
      if ((k.t -= dt) <= 0) this.playerKnock = null;
    }
    for (const m of this.monsters) m.update(dt, this);
    for (const f of this.fx) { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 160 * dt; f.life -= dt; }
    this.fx = this.fx.filter(f => f.life > 0);
    for (const t of this.trail) t.t += dt;
    this.trail = this.trail.filter(t => t.t < t.life);
  }

  // 挥击的白色弧线
  drawSwing(g, cx, cy) {
    const sw = this.swing, p = this.player, k = sw.t / 0.22;
    const [dx, dy] = DIRS[sw.dir];
    const x = Math.round(p.x - cx + dx * (8 + k * 6)), y = Math.round(p.y - 8 - cy + dy * (8 + k * 6));
    g.globalAlpha = 1 - k;
    g.fillStyle = '#ffffff';
    for (let i = -2; i <= 2; i++) {
      const ox = dy ? i * 3 : Math.round(i * 1.5), oy = dy ? Math.round(i * 1.5) : i * 3;
      g.fillRect(x + ox - 1, y + oy - 1, 2, 2);
    }
    g.globalAlpha = 1;
  }

  // 镜头：横向跟随玩家；场景比屏幕小就居中；纵向贴底（顶上的墙裁掉一点）
  camera() {
    const s = this.cur, pw = s.W * 16, ph = s.H * 16;
    const cx = pw <= VW ? Math.round((pw - VW) / 2) : Math.round(Math.max(0, Math.min(pw - VW, this.player.x - VW / 2)));
    const cy = ph <= VH ? Math.round((ph - VH) / 2) : s.camY === 'top' ? 0 : ph - VH;
    return [cx, cy];
  }

  // ---------------- 绘制 ----------------
  draw() {
    const g = ctx, p = this.player, s = this.cur;
    if (this.mode === 'select') return this.drawSelect(g);
    let [cx, cy] = this.camera();
    if (this.shake > 0) { cx += Math.round((Math.random() - 0.5) * 6); cy += Math.round((Math.random() - 0.5) * 4); }
    g.fillStyle = '#140f22'; g.fillRect(0, 0, VW, VH);
    g.drawImage(s.bg, -cx, -cy);

    // 怪物留下的痕迹（画在所有人脚下）
    for (const t of this.trail) {
      const k = t.t / t.life, X = Math.round(t.x - cx), Y = Math.round(t.y - cy), r = t.r;
      g.globalAlpha = (1 - k) * 0.7;
      g.fillStyle = '#0a0710';                                                       // 脚底压出来的深色印子
      g.fillRect(X - r - 1, Y - 1, r * 2 + 3, 4);
      g.globalAlpha = Math.min(1, (1 - k) * 1.4);
      g.fillStyle = mixHex('#1f7a2a', '#a9dcae', k);                                 // 黏液：越干越浅
      g.fillRect(X - r, Y - 1, r * 2 + 1, 3);
      g.fillRect(X - r - 1, Y, r * 2 + 3, 1);
      g.fillStyle = mixHex('#57c765', '#cdeccf', k);                                 // 上面一层反光
      g.fillRect(X - r + 1, Y - 1, r, 1);
      g.globalAlpha = 1;
    }

    // 鼠标所在格子
    if (!this.dialog && !this.fading && mouse.x >= 0) {
      const tx = Math.floor((mouse.x + cx) / 16), ty = Math.floor((mouse.y + cy) / 16), key = tx + ',' + ty;
      const busy = s.spots.has(key) || s.exits.has(key) || !!s.personAt(tx, ty);
      if (busy || !s.isSolid(tx, ty)) {
        g.fillStyle = busy ? 'rgba(255,220,90,0.9)' : 'rgba(255,255,255,0.6)';
        const X = tx * 16 - cx, Y = ty * 16 - cy;
        for (const [ax, ay, w, h] of [[0, 0, 4, 1], [0, 0, 1, 4], [12, 0, 4, 1], [15, 0, 1, 4], [0, 15, 4, 1], [0, 12, 1, 4], [12, 15, 4, 1], [15, 12, 1, 4]]) g.fillRect(X + ax, Y + ay, w, h);
      }
    }
    // 点击目标标记
    if (this.marker) {
      const X = this.marker.x * 16 + 8 - cx, Y = this.marker.y * 16 + 8 - cy, k = Math.floor(this.marker.t * 6) % 2;
      g.fillStyle = '#ffd24a';
      g.fillRect(X - 1, Y - 4 - k, 2, 2); g.fillRect(X - 1, Y + 2 + k, 2, 2); g.fillRect(X - 4 - k, Y - 1, 2, 2); g.fillRect(X + 2 + k, Y - 1, 2, 2);
    }

    // y 排序
    const list = [];
    for (const o of s.props) {
      if (o.x > cx + VW || o.x + o.img.width < cx) continue;
      list.push({ y: o.base, draw: () => g.drawImage(o.img, Math.round(o.x - cx), Math.round(o.y - cy)) });
    }
    for (const n of s.people) list.push({ y: n.p.y, draw: () => n.p.draw(g, cx, cy) });
    for (const m of this.monsters) list.push({ y: m.y, draw: () => m.draw(g, cx, cy) });
    list.push({ y: p.y, draw: () => p.draw(g, cx, cy) });
    list.sort((a, b) => a.y - b.y);
    for (const it of list) it.draw();

    // 指路的小箭头：场景里 hints 定义，when(game) 为真才显示
    if (s.hints && !this.dialog) {
      const bob = Math.floor(this.time * 3) % 2;
      for (const h of s.hints) {
        if (h.when && !h.when(this)) continue;
        const X = h.x * 16 + 8 - cx, Y = h.y * 16 - 14 - cy - bob;
        g.fillStyle = '#1a1428';
        for (let k = 0; k < 6; k++) g.fillRect(X - 5 + k, Y + k, 11 - k * 2, 1);
        g.fillStyle = '#ffd24a';
        for (let k = 0; k < 5; k++) g.fillRect(X - 4 + k, Y + k, 9 - k * 2, 1);
      }
    }

    if (this.swing) this.drawSwing(g, cx, cy);
    for (const f of this.fx) { g.fillStyle = f.color; g.fillRect(Math.round(f.x - cx), Math.round(f.y - cy), 2, 2); }
    if (s.overlay) s.overlay(g, cx, cy, this.time);

    // 地点名：进场时显示几秒后淡出
    const la = Math.max(0, Math.min(1, this.enterTime + 3.5 - this.time));
    if (la > 0) {
      g.globalAlpha = la;
      const w = Math.round(textW(g, s.name) + 16);
      panel(g, 4, 4, w, 18);
      text(g, s.name, 12, 7);
      g.globalAlpha = 1;
    }

    if (this.toastMsg) {
      const tw = Math.round(textW(g, this.toastMsg.t)) + 16;
      g.globalAlpha = Math.min(1, this.toastMsg.life * 2);
      panel(g, Math.round((VW - tw) / 2), 4, tw, 18);
      text(g, this.toastMsg.t, Math.round((VW - tw) / 2) + 8, 7);
      g.globalAlpha = 1;
    }
    if (this.bagOpen) this.drawBag(g);
    else if (this.dialog) this.drawDialog(g);
    if (this.fade > 0) { g.fillStyle = `rgba(10,8,20,${this.fade})`; g.fillRect(0, 0, VW, VH); }
  }

  // 书包
  drawBag(g) {
    const w = 260, h = 150, x = (VW - w) / 2, y = (VH - h) / 2;
    panel(g, x, y, w, h);
    text(g, '书包', x + 12, y + 8, '#ffe08a');
    g.fillStyle = '#8a94c8'; g.fillRect(x + 10, y + 24, w - 20, 1);
    if (!this.bag.length) text(g, '空空如也。', x + 14, y + 32, '#8a94c8');
    this.bag.slice(0, 6).forEach((id, i) => {
      const it = ITEM_DB[id] || { name: id, desc: '' };
      const ly = y + 30 + i * 19;
      drawBookIcon(g, x + 14, ly + 1, it.color || '#8a4a3a');
      text(g, it.name, x + 28, ly + 2);
      if (it.desc) text(g, it.desc, x + 32 + textW(g, it.name), ly + 2, '#9aa4d8');
    });
    text(g, '按 I 或 Esc 关闭', x + w - 96, y + h - 17, '#8a94c8');
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
    d.lines.forEach((ln, i) => { text(g, ln.slice(0, Math.max(0, left)), bx + 14, by + 10 + i * 15); left -= ln.length; });

    // 选项：说完之后浮在对话框上方
    if (page.choices && d.chars >= d.lines.join('').length) {
      const ow = Math.max(120, ...page.choices.map(c => Math.round(textW(g, c.label)) + 44));
      const oh = 20, oy0 = by - 8 - page.choices.length * oh, ox = bx + bw - ow - 10;
      d.optRects = [];
      page.choices.forEach((c, i) => {
        const oy = oy0 + i * oh, on = i === d.pick;
        d.optRects.push([ox, oy, ow, oh]);
        panel(g, ox, oy, ow, oh, on ? '#5a4aa8' : '#2a3060', on ? '#3a2c78' : '#161a3c');
        text(g, c.label, ox + 24, oy + 3, on ? '#ffe08a' : '#c8c4d8');
        if (on) {   // 选中的那条前面一个小三角
          g.fillStyle = '#ffd24a';
          for (let k = 0; k < 4; k++) g.fillRect(ox + 11, oy + 6 + k, 1, Math.max(1, 7 - k * 2));
          for (let k = 0; k < 4; k++) g.fillRect(ox + 11 + k, oy + 6 + k, 1, Math.max(1, 7 - k * 2));
        }
      });
      return;
    }
    d.optRects = null;

    if (d.chars >= d.lines.join('').length && Math.floor(this.time * 3) % 2 === 0) {
      g.fillStyle = '#ffd24a';
      const ax = bx + bw - 16, ay = by + bh - 12;
      g.fillRect(ax, ay, 7, 1); g.fillRect(ax + 1, ay + 1, 5, 1); g.fillRect(ax + 2, ay + 2, 3, 1); g.fillRect(ax + 3, ay + 3, 1, 1);
    }
  }
}
