// ============================================================
//  世界：地图生成、碰撞、地面预渲染
// ============================================================

const G_GRASS = 0, G_PATH = 1, G_WATER = 2, G_BRIDGE = 3, G_SOIL = 4;

class World {
  constructor(art) {
    this.art = art;
    this.W = 48; this.H = 36;
    const n = this.W * this.H;
    this.ground = new Uint8Array(n);        // 地面类型
    this.variant = new Uint8Array(n);       // 贴图变体
    this.farmable = new Uint8Array(n);      // 是否可耕地
    this.flower = new Int8Array(n).fill(-1);
    this.objects = new Array(n).fill(null); // 单格物体：树、石头、栅栏…
    this.buildings = [];
    this.crops = new Map();                 // "x,y" -> {kind, growth, stage}
    this.wet = new Set();                   // 浇过水的格子 "x,y"
    this.generate();
    this.groundCanvas = makeCanvas(this.W * TILE, this.H * TILE);
    this.renderGroundAll();
  }

  idx(x, y) { return y * this.W + x; }
  inBounds(x, y) { return x >= 0 && y >= 0 && x < this.W && y < this.H; }
  g(x, y) { return this.inBounds(x, y) ? this.ground[this.idx(x, y)] : G_GRASS; }
  obj(x, y) { return this.inBounds(x, y) ? this.objects[this.idx(x, y)] : null; }

  // ---------- 地图生成 ----------
  generate() {
    const r = makeRng(2026);
    const W = this.W, H = this.H;
    const reserved = new Uint8Array(W * H);
    const reserve = (x, y, w, h) => {
      for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (this.inBounds(i, j)) reserved[this.idx(i, j)] = 1;
    };
    const setG = (x, y, t) => { if (this.inBounds(x, y)) this.ground[this.idx(x, y)] = t; };
    const path = (x, y, w, h) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) setG(i, j, G_PATH); reserve(x - 1, y - 1, w + 2, h + 2); };
    const put = (x, y, type, v = 0) => { if (this.inBounds(x, y)) this.objects[this.idx(x, y)] = { type, v }; };

    for (let i = 0; i < W * H; i++) this.variant[i] = (r() * 4) | 0;

    // 建筑：x, y 是占地左上角（格），door 是门所在格
    const addBuilding = (type, x, y, w, h, door, extra = {}) => {
      this.buildings.push({ type, x, y, w, h, door, ...extra });
      reserve(x - 1, y - 1, w + 2, h + 2);
    };
    addBuilding('house', 4, 3, 5, 4, { x: 6, y: 6 });
    addBuilding('shop', 19, 5, 5, 4, { x: 21, y: 8 });
    addBuilding('shrine', 34, 2, 5, 4, { x: 36, y: 5 });

    // 道路
    path(6, 7, 1, 4);          // 家门口
    path(6, 10, 37, 1);        // 主路
    path(21, 9, 1, 1);         // 杂货铺门口
    path(36, 6, 1, 4);         // 神社参道
    path(6, 11, 1, 2);         // 通往农田
    path(23, 11, 1, 5);        // 通往广场
    path(18, 16, 10, 6);       // 广场
    path(28, 19, 3, 1);        // 广场 -> 桥
    path(34, 19, 8, 1);        // 桥 -> 竹林

    // 河流 + 泉水池
    for (let y = 12; y < H; y++) for (let x = 29; x < 36; x++) {
      const inPond = ((x - 32) / 3.2) ** 2 + ((y - 14) / 2.3) ** 2 <= 1;
      const inRiver = x >= 31 && x <= 33 && y >= 14;
      if (inPond || inRiver) setG(x, y, G_WATER);
    }
    reserve(28, 11, 9, 25);
    for (let x = 31; x <= 33; x++) setG(x, 19, G_BRIDGE);

    // 农田：栅栏围起来，内部可耕
    const fx0 = 3, fy0 = 13, fx1 = 16, fy1 = 23;
    for (let x = fx0; x <= fx1; x++) { put(x, fy0, 'fence'); put(x, fy1, 'fence'); }
    for (let y = fy0; y <= fy1; y++) { put(fx0, y, 'fence'); put(fx1, y, 'fence'); }
    this.objects[this.idx(6, fy0)] = null; setG(6, fy0, G_PATH);   // 田门
    for (let y = fy0 + 1; y < fy1; y++) for (let x = fx0 + 1; x < fx1; x++) this.farmable[this.idx(x, y)] = 1;
    reserve(fx0 - 1, fy0 - 1, fx1 - fx0 + 3, fy1 - fy0 + 3);

    // 神社周边：鸟居柱子、石灯笼、樱花
    put(35, 8, 'torii_post'); put(37, 8, 'torii_post');
    this.torii = { x: 36, y: 8 };
    put(34, 7, 'lantern'); put(38, 7, 'lantern');
    put(20, 9, 'lantern'); put(25, 15, 'lantern'); put(18, 22, 'lantern');
    put(32, 3, 'sakura', 0); put(40, 3, 'sakura', 1); put(40, 6, 'sakura', 2); put(32, 7, 'sakura', 1);
    put(17, 15, 'sakura', 0); put(28, 15, 'sakura', 2); put(28, 22, 'sakura', 1);
    this.shipBox = { x: 9, y: 6 };
    put(9, 6, 'shipbox');
    reserve(33, 1, 7, 10);

    // 东南竹林
    for (let y = 21; y < H - 2; y++) for (let x = 37; x < W - 2; x++) {
      if (r() < 0.55 && !reserved[this.idx(x, y)]) put(x, y, 'bamboo', (r() * 3) | 0);
      reserved[this.idx(x, y)] = 1;
    }

    // 边界：树林
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const edge = x < 2 || y < 2 || x >= W - 2 || y >= H - 2;
      if (!edge || this.ground[this.idx(x, y)] === G_WATER) continue;
      put(x, y, r() < 0.2 ? 'sakura' : 'tree', (r() * 3) | 0);
      reserved[this.idx(x, y)] = 1;
    }

    // 随机点缀
    for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) {
      const i = this.idx(x, y);
      if (this.ground[i] !== G_GRASS || this.objects[i]) continue;
      if (!reserved[i]) {
        const v = r();
        if (v < 0.035) { put(x, y, 'tree', (r() * 3) | 0); continue; }
        if (v < 0.05) { put(x, y, 'sakura', (r() * 3) | 0); continue; }
        if (v < 0.075) { put(x, y, 'bush', (r() * 2) | 0); continue; }
        if (v < 0.09) { put(x, y, 'rock', (r() * 2) | 0); continue; }
      }
      if (!this.farmable[i] && r() < 0.1) this.flower[i] = (r() * 6) | 0;
    }
  }

  // ---------- 碰撞 ----------
  buildingAt(x, y) {
    return this.buildings.find(b => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h) || null;
  }
  isSolid(x, y) {
    if (!this.inBounds(x, y)) return true;
    const gt = this.ground[this.idx(x, y)];
    if (gt === G_WATER) return true;
    if (this.objects[this.idx(x, y)]) return true;
    return !!this.buildingAt(x, y);
  }
  // 以像素为单位的矩形是否与实心格重叠
  rectBlocked(x0, y0, x1, y1) {
    const tx0 = Math.floor(x0 / TILE), ty0 = Math.floor(y0 / TILE);
    const tx1 = Math.floor((x1 - 0.01) / TILE), ty1 = Math.floor((y1 - 0.01) / TILE);
    for (let y = ty0; y <= ty1; y++) for (let x = tx0; x <= tx1; x++) if (this.isSolid(x, y)) return true;
    return false;
  }

  // ---------- 地面渲染（预渲染到一张大 canvas，改动时只重画局部） ----------
  renderGroundAll() {
    for (let y = 0; y < this.H; y++) for (let x = 0; x < this.W; x++) this.renderGroundTile(x, y);
  }
  refreshAround(x, y) {
    for (let j = y - 1; j <= y + 1; j++) for (let i = x - 1; i <= x + 1; i++) if (this.inBounds(i, j)) this.renderGroundTile(i, j);
  }
  renderGroundTile(x, y) {
    const g = this.groundCanvas.getContext('2d'), A = this.art;
    const i = this.idx(x, y), t = this.ground[i], v = this.variant[i];
    const X = x * TILE, Y = y * TILE;
    g.drawImage(A.grass[v], X, Y);          // 先铺草，水和其他地面盖在上面
    if (t === G_PATH) {
      g.drawImage(A.path[v], X, Y);
      const isPathish = (tt) => tt === G_PATH || tt === G_BRIDGE;
      g.fillStyle = PAL.pathEdge;
      if (!isPathish(this.g(x, y - 1))) g.fillRect(X, Y, TILE, 1);
      if (!isPathish(this.g(x, y + 1))) g.fillRect(X, Y + TILE - 1, TILE, 1);
      if (!isPathish(this.g(x - 1, y))) g.fillRect(X, Y, 1, TILE);
      if (!isPathish(this.g(x + 1, y))) g.fillRect(X + TILE - 1, Y, 1, TILE);
    } else if (t === G_SOIL) {
      g.drawImage(this.wet.has(x + ',' + y) ? A.soilWet : A.soil, X, Y);
    } else if (t === G_BRIDGE) {
      g.fillStyle = PAL.water2; g.fillRect(X, Y, TILE, TILE);
      g.drawImage(A.bridge, X, Y);
    } else if (t === G_WATER) {
      g.fillStyle = PAL.water1; g.fillRect(X, Y, TILE, TILE);  // 水面每帧还会动态绘制
    }
    if (t === G_GRASS && this.flower[i] >= 0) g.drawImage(A.flowers[this.flower[i]], X, Y);
  }

  // 水面动画（只画可见范围）
  drawWater(ctx, camX, camY, vw, vh, time) {
    const x0 = Math.max(0, Math.floor(camX / TILE)), y0 = Math.max(0, Math.floor(camY / TILE));
    const x1 = Math.min(this.W - 1, Math.floor((camX + vw) / TILE)), y1 = Math.min(this.H - 1, Math.floor((camY + vh) / TILE));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const t = this.ground[this.idx(x, y)];
      if (t !== G_WATER && t !== G_BRIDGE) continue;
      const X = x * TILE - camX, Y = y * TILE - camY;
      if (t === G_BRIDGE) {
        // 桥下的水只露出一点
        continue;
      }
      ctx.fillStyle = PAL.water1; ctx.fillRect(X, Y, TILE, TILE);
      // 波光：随时间移动的短横线
      for (let k = 0; k < 3; k++) {
        const seed = (x * 73 + y * 151 + k * 37) % 97;
        const phase = time * 0.9 + seed * 0.3;
        const ox = ((seed * 5 + Math.floor(time * 4 + k * 3)) % 16);
        const oy = (seed * 3 + k * 5) % 14 + 1;
        if (Math.sin(phase) > 0.2) {
          ctx.fillStyle = k === 0 ? PAL.waterLight : PAL.water2;
          ctx.fillRect(X + (ox % 13), Y + oy, 3, 1);
        }
      }
      // 岸边：上方是陆地时画出河岸阴影 + 浪花
      const land = (tx, ty) => { const g = this.g(tx, ty); return g !== G_WATER && g !== G_BRIDGE; };
      const foam = Math.sin(time * 2 + x + y) > 0 ? PAL.waterLight : '#d8f0fa';
      if (land(x, y - 1)) { ctx.fillStyle = PAL.waterDeep; ctx.fillRect(X, Y, TILE, 3); ctx.fillStyle = foam; ctx.fillRect(X, Y + 3, TILE, 1); }
      if (land(x, y + 1)) { ctx.fillStyle = foam; ctx.fillRect(X, Y + TILE - 1, TILE, 1); }
      if (land(x - 1, y)) { ctx.fillStyle = PAL.waterDeep; ctx.fillRect(X, Y, 2, TILE); ctx.fillStyle = foam; ctx.fillRect(X + 2, Y, 1, TILE); }
      if (land(x + 1, y)) { ctx.fillStyle = foam; ctx.fillRect(X + TILE - 1, Y, 1, TILE); }
    }
  }

  // ---------- 可排序的精灵（物体、建筑） ----------
  // 返回 {y: 排序基线, draw(ctx, camX, camY)}
  collectSprites(camX, camY, vw, vh, out) {
    const A = this.art;
    const x0 = Math.max(0, Math.floor(camX / TILE) - 2), y0 = Math.max(0, Math.floor(camY / TILE) - 1);
    const x1 = Math.min(this.W - 1, Math.floor((camX + vw) / TILE) + 2), y1 = Math.min(this.H - 1, Math.floor((camY + vh) / TILE) + 3);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const o = this.objects[this.idx(x, y)];
      if (!o) continue;
      let img, ox = 0, shadow = 0;
      switch (o.type) {
        case 'tree': img = A.tree[o.v]; ox = -8; shadow = 11; break;
        case 'sakura': img = A.sakura[o.v]; ox = -8; shadow = 11; break;
        case 'bush': img = A.bush[o.v]; shadow = 7; break;
        case 'rock': img = A.rock[o.v]; shadow = 6; break;
        case 'bamboo': img = A.bamboo[o.v]; break;
        case 'lantern': img = A.lantern; shadow = 6; break;
        case 'shipbox': img = A.shipBox; shadow = 7; break;
        case 'fence': {
          const f = (i, j) => { const q = this.obj(i, j); return q && q.type === 'fence' ? 1 : 0; };
          img = A.fence[f(x, y - 1) | f(x + 1, y) << 1 | f(x, y + 1) << 2 | f(x - 1, y) << 3];
          break;
        }
        case 'torii_post': continue;   // 鸟居整体单独画
      }
      const bx = x * TILE + ox, by = (y + 1) * TILE - img.height;
      out.push({
        y: (y + 1) * TILE - 1, tall: img.height > 24,
        rect: [bx, by, img.width, img.height],
        draw: (ctx, cx, cy, alpha) => {
          if (shadow) { ctx.fillStyle = 'rgba(30,40,20,0.25)'; ctx.fillRect(x * TILE + 8 - shadow - cx, (y + 1) * TILE - 3 - cy, shadow * 2, 3); }
          if (alpha < 1) ctx.globalAlpha = alpha;
          ctx.drawImage(img, bx - cx, by - cy);
          ctx.globalAlpha = 1;
          if (o.type === 'lantern' && window.GAME && GAME.nightLevel() > 0.3) ctx.drawImage(A.lanternGlow, bx - cx, by - cy);
        },
      });
    }
    for (const b of this.buildings) {
      const img = A[b.type];
      const bx = b.x * TILE + (b.w * TILE - img.width) / 2, by = (b.y + b.h) * TILE - img.height;
      if (bx > camX + vw || bx + img.width < camX || by > camY + vh || by + img.height < camY) continue;
      out.push({
        y: (b.y + b.h) * TILE - 1, tall: true, rect: [bx, by, img.width, img.height],
        draw: (ctx, cx, cy, alpha) => {
          ctx.fillStyle = 'rgba(30,40,20,0.25)'; ctx.fillRect(b.x * TILE - cx + 2, (b.y + b.h) * TILE - cy - 2, b.w * TILE - 4, 4);
          ctx.drawImage(img, bx - cx, by - cy);
        },
      });
    }
    // 鸟居
    const t = this.torii, img = A.torii;
    const bx = t.x * TILE + 8 - img.width / 2, by = (t.y + 1) * TILE - img.height;
    out.push({
      y: (t.y + 1) * TILE - 1, tall: true, rect: [bx, by, img.width, img.height],
      draw: (ctx, cx, cy, alpha) => { if (alpha < 1) ctx.globalAlpha = alpha; ctx.drawImage(img, bx - cx, by - cy); ctx.globalAlpha = 1; },
    });
  }

  // 夜间光源（像素坐标）
  lights() {
    const out = [];
    for (let i = 0; i < this.objects.length; i++) {
      const o = this.objects[i];
      if (o && o.type === 'lantern') out.push({ x: (i % this.W) * TILE + 8, y: Math.floor(i / this.W) * TILE - 2, r: 34 });
    }
    for (const b of this.buildings) out.push({ x: (b.x + b.w / 2) * TILE, y: (b.y + b.h) * TILE - 12, r: 30 });
    return out;
  }

  // ---------- 农作 ----------
  key(x, y) { return x + ',' + y; }
  till(x, y) {
    const i = this.idx(x, y);
    if (!this.inBounds(x, y) || !this.farmable[i] || this.objects[i]) return false;
    if (this.ground[i] !== G_GRASS) return false;
    this.ground[i] = G_SOIL; this.flower[i] = -1;
    this.refreshAround(x, y);
    return true;
  }
  water(x, y) {
    if (this.g(x, y) !== G_SOIL) return false;
    const k = this.key(x, y);
    if (this.wet.has(k)) return false;
    this.wet.add(k);
    this.renderGroundTile(x, y);
    return true;
  }
  plant(x, y, kind) {
    const k = this.key(x, y);
    if (this.g(x, y) !== G_SOIL || this.crops.has(k)) return false;
    this.crops.set(k, { kind, growth: 0, stage: 0 });
    return true;
  }

  // 新的一天：浇过水的作物成长，土地变干
  newDay() {
    for (const [k, c] of this.crops) {
      if (this.wet.has(k) && c.stage < 4) {
        c.growth++;
        c.stage = CROPS[c.kind].stageAt(c.growth);
      }
    }
    this.wet.clear();
    this.renderGroundAll();
  }

  drawCrops(ctx, camX, camY, vw, vh) {
    for (const [k, c] of this.crops) {
      const [x, y] = k.split(',').map(Number);
      const X = x * TILE - camX, Y = y * TILE - camY;
      if (X < -16 || Y < -16 || X > vw || Y > vh) continue;
      ctx.drawImage(this.art.crops[c.kind][c.stage], X, Y);
    }
  }

  // ---------- 存档 ----------
  serialize() {
    const soil = [];
    for (let i = 0; i < this.ground.length; i++) if (this.ground[i] === G_SOIL) soil.push(i);
    return { soil, crops: [...this.crops.entries()], wet: [...this.wet] };
  }
  load(d) {
    for (const i of d.soil) { this.ground[i] = G_SOIL; this.flower[i] = -1; }
    this.crops = new Map(d.crops);
    this.wet = new Set(d.wet);
    this.renderGroundAll();
  }
}

// 作物数据
const CROPS = {
  turnip: { name: '芜菁', seedPrice: 20, sellPrice: 60, days: 4, stageAt: g => Math.min(4, g) },
  daikon: { name: '萝卜', seedPrice: 40, sellPrice: 150, days: 6, stageAt: g => g >= 6 ? 4 : g >= 4 ? 3 : g >= 2 ? 2 : g >= 1 ? 1 : 0 },
};
