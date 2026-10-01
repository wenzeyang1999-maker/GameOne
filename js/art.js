// ============================================================
//  像素美术：全部用代码生成，不依赖外部图片
//  - 地形用带种子的随机数程序化生成
//  - 角色、道具、作物用字符画（每个字符 = 一个像素）
// ============================================================

const TILE = 16;

const PAL = {
  k: '#2b1d2a',            // 描边
  grass1: '#7cbf4a', grass2: '#68a83e', grass3: '#94d160', grassDark: '#548f36',
  path1: '#dcbc8c', path2: '#c9a574', path3: '#ead0a6', pathEdge: '#b08c5c',
  water1: '#4fa4d8', water2: '#3f8fc8', waterLight: '#a6ddf2', waterDeep: '#2e6aa8',
  soil: '#9a6440', soilDark: '#7a4c30', soilLight: '#b07a50',
  wet: '#5e3d28', wetDark: '#48301e',
  wood: '#9a6a42', woodDark: '#6e4a2e', woodLight: '#c08a5a',
  stone: '#aaa8b2', stoneDark: '#77758a', stoneLight: '#d4d2da',
  red: '#d4443c', redDark: '#9a2a30', white: '#f4efe4',
  pink: '#f6a8c4', pinkDark: '#d9789c', pinkLight: '#ffdcea',
  leaf: '#4f9a42', leafDark: '#357334', leafLight: '#7cc458',
};

// ---------- 小工具 ----------
function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

// 带种子的随机数（mulberry32），保证每次生成的地图一样
function makeRng(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// 字符画 -> canvas。pal 把字符映射到颜色，'.' 或未定义 = 透明
function fromStrings(rows, pal) {
  const h = rows.length, w = Math.max(...rows.map(r => r.length));
  const c = makeCanvas(w, h), g = c.getContext('2d');
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const col = pal[row[x]];
      if (col) { g.fillStyle = col; g.fillRect(x, y, 1, 1); }
    }
  });
  return c;
}

function flipH(src) {
  const c = makeCanvas(src.width, src.height), g = c.getContext('2d');
  g.translate(src.width, 0); g.scale(-1, 1); g.drawImage(src, 0, 0);
  return c;
}

function px(g, color, x, y, w = 1, h = 1) { g.fillStyle = color; g.fillRect(x, y, w, h); }

// ============================================================
//  角色（模板字符：H 头发 h 头发暗部 s 皮肤 S 皮肤暗部 e 眼睛
//  C 衣服 c 衣服暗部 w 领口 L 裤子/裙 F 鞋 k 描边）
// ============================================================
const CHAR_TOP = {
  down: [
    '....kkkkkkkk....',
    '..kkHHHHHHHHkk..',
    '.kHHHGGHHGGHHHk.',
    '.kHHHHHHHHHHHHk.',
    '.kHHhsssssshHHk.',
    '.kHssssssssssHk.',
    '.khssessssesshk.',
    '.khssessssesshk.',
    '.kHsbssSSssbsHk.',
    '..kSssssssssSk..',
    '...kkwwwwwwkk...',
    '..kCWwwCCwwWCk..',
    '.kCCCCwCCwCCCCk.',
    '.ksCCCCggCCCCsk.',
    '.kscCCCCCCCCcsk.',
  ],
  up: [
    '....kkkkkkkk....',
    '..kkHHHHHHHHkk..',
    '.kHHHGGHHGGHHHk.',
    '.kHHHHHHHHHHHHk.',
    '.kHHHHHHHHHHHHk.',
    '.kHHhHHHHHHhHHk.',
    '.kHHHHHHHHHHHHk.',
    '.kHhHHHHHHHHhHk.',
    '.kHHhhHHHHhhHHk.',
    '..kkhhhhhhhhkk..',
    '...kkwwwwwwkk...',
    '..kCWWCCCCWWCk..',
    '.kCCCCCCCCCCCCk.',
    '.ksCCCCCCCCCCsk.',
    '.kscCCCCCCCCcsk.',
  ],
  right: [
    '....kkkkkkkk....',
    '..kkHHHHHHHHkk..',
    '.kHHHGGHHHHHHHk.',
    '.kHHHHHHHHHsssk.',
    '.kHHHHHHHssssSk.',
    '.kHHHHHhssesssk.',
    '.kHHHHHhssesssk.',
    '.kHHHHHhsssSssk.',
    '.kHHHHHhssbssSk.',
    '..kHhHHHSsssssk.',
    '...kkwwwwwwkk...',
    '..kCCWwwCCCCCk..',
    '..kCCCCCCCCCCk..',
    '..kCCCCsCCCCCk..',
    '..kccCCCCCCCck..',
  ],
};
// 吊带上衣：肩膀露出来，两根细带，手臂是光的。身体和脖子都比校服窄一圈
const CAMI_BODY = {
  down: [
    '...kSssssssSk...',
    '....kssssssk....',
    '...kscsssscsk...',
    '..ksCCCCCCCCsk..',
    '..ksCCCCggCCsk..',
    '..kscCCCCCCcsk..',
  ],
  up: [
    '...kSssssssSk...',
    '....kssssssk....',
    '...kscsssscsk...',
    '..ksCCCCCCCCsk..',
    '..ksCCCCCCCCsk..',
    '..kscCCCCCCcsk..',
  ],
  right: [
    '...kSssssssSk...',
    '....kssssssk....',
    '...kscsssscsk...',
    '...ksCCCCCCsk...',
    '...ksCCCCsCsk...',
    '...kscCCCCCcsk..',
  ],
};

// T 恤：圆领、短袖，袖口以下露出手臂
const TSHIRT_BODY = {
  down: [
    '..kSssssssssSk..',
    '...kkCCCCCCkk...',
    '..kCCCCCCCCCCk..',
    '.kCCCCCCCCCCCCk.',
    '.ksCCCCCCCCCCsk.',
    '.kscCCCCCCCCcsk.',
  ],
  up: [
    '..kSssssssssSk..',
    '...kkCCCCCCkk...',
    '..kCCCCCCCCCCk..',
    '.kCCCCCCCCCCCCk.',
    '.ksCCCCCCCCCCsk.',
    '.kscCCCCCCCCcsk.',
  ],
  right: [
    '..kSssssssssSk..',
    '...kkCCCCCCkk...',
    '..kCCCCCCCCCCk..',
    '..kCCCCCCCCCCk..',
    '..ksCCCCsCCCsk..',
    '..kscCCCCCCcsk..',
  ],
};

// 西装：翻领、里面是衬衫（I）
const SUIT_BODY = {
  down: [
    '..kSssssssssSk..',
    '...kkIIIIIIkk...',
    '..kCCIIIIIICCk..',
    '.kCCCCIIIICCCCk.',
    '.ksCCCCIICCCCsk.',
    '.kscCCCCCCCCcsk.',
  ],
  up: [
    '..kSssssssssSk..',
    '...kkCCCCCCkk...',
    '..kCCCCCCCCCCk..',
    '.kCCCCCCCCCCCCk.',
    '.ksCCCCCCCCCCsk.',
    '.kscCCCCCCCCcsk.',
  ],
  right: [
    '..kSssssssssSk..',
    '...kkCCCCIIkk...',
    '..kCCCCCCCIICk..',
    '..kCCCCCCCCCCk..',
    '..kCCCCsCCCCCk..',
    '..kccCCCCCCCck..',
  ],
};

// 程序员格子衬衫：里面一件灰 T，外面红黑格子
const PLAID_BODY = {
  down: [
    '..kSssssssssSk..',
    '...kkwwwwwwkk...',
    '..kCCPPCCPPCCk..',
    '.kCCPPCCPPCCPPk.',
    '.ksPPCCPPCCPPsk.',
    '.kscPPCCPPCCcsk.',
  ],
  up: [
    '..kSssssssssSk..',
    '...kkwwwwwwkk...',
    '..kCCPPCCPPCCk..',
    '.kCCPPCCPPCCPPk.',
    '.ksPPCCPPCCPPsk.',
    '.kscPPCCPPCCcsk.',
  ],
  right: [
    '..kSssssssssSk..',
    '...kkwwwwwwkk...',
    '..kCCPPCCPPCCk..',
    '..kCCPPCCPPCCk..',
    '..ksPPCCPsPCCk..',
    '..kscPPCCPPcsk..',
  ],
};

// 运动外套：立领、拉链、袖子外侧一条深色条纹（N）
const TRACK_BODY = {
  down: [
    '..kSssssssssSk..',
    '...kkCCCCCCkk...',
    '..kNCCCCCCCCNk..',
    '.kNCCCCwwCCCCNk.',
    '.kNCCCCwwCCCCNk.',
    '.ksNccccccccNsk.',
  ],
  up: [
    '..kSssssssssSk..',
    '...kkCCCCCCkk...',
    '..kNCCCCCCCCNk..',
    '.kNCCCCCCCCCCNk.',
    '.kNCCCCCCCCCCNk.',
    '.ksNccccccccNsk.',
  ],
  right: [
    '..kSssssssssSk..',
    '...kkCCCCCCkk...',
    '..kCCCCCCCCCNk..',
    '..kCCCCCCCCCNk..',
    '..kCCCCsCCCCNk..',
    '..kcccccccccNk..',
  ],
};

// 运动裤：裤腿外侧也有一条条纹
const TRACK_LEGS = {
  front: [
    ['....kLLkkLLk....', '....kFfkkfFk....', '....kkk..kkk....'],
    ['....kLLkkLLk....', '....kFfkkkkk....', '....kkk.........'],
    ['....kLLkkLLk....', '....kkkkkfFk....', '.........kkk....'],
  ],
  side: [
    ['.....kLLNLk.....', '.....kFffFk.....', '.....kkkkkk.....'],
    ['....kLLkkLLk....', '...kFfk..kfFk...', '...kkk....kkk...'],
    ['.....kLLNLk.....', '.....kFffFk.....', '.....kkkkkk.....'],
  ],
};

// 短裙 + 光腿
const CHAR_LEGS_SKIRT = {
  front: [
    ['..kLLLLLLLLLLk..', '.kLLLLLLLLLLLLk.', '....kssk.kssk...', '....kFfk.kfFk...'],
    ['..kLLLLLLLLLLk..', '.kLLLLLLLLLLLLk.', '....kssk.kssk...', '....kFfkkkkk....'],
    ['..kLLLLLLLLLLk..', '.kLLLLLLLLLLLLk.', '....kssk.kssk...', '....kkkkkfFk....'],
  ],
  side: [
    ['..kLLLLLLLLLLk..', '.kLLLLLLLLLLLLk.', '.....kssssk.....', '.....kFffFk.....'],
    ['..kLLLLLLLLLLk..', '.kLLLLLLLLLLLLk.', '....kssk.kssk...', '...kFfk..kfFk...'],
    ['..kLLLLLLLLLLk..', '.kLLLLLLLLLLLLk.', '.....kssssk.....', '.....kFffFk.....'],
  ],
};

const CHAR_LEGS = {
  front: [
    ['....kLLkkLLk....', '....kFfkkfFk....', '....kkk..kkk....'],
    ['....kLLkkLLk....', '....kFfkkkkk....', '....kkk.........'],
    ['....kLLkkLLk....', '....kkkkkfFk....', '.........kkk....'],
  ],
  side: [
    ['.....kLLLLk.....', '.....kFffFk.....', '.....kkkkkk.....'],
    ['....kLLkkLLk....', '...kFfk..kfFk...', '...kkk....kkk...'],
    ['.....kLLLLk.....', '.....kFffFk.....', '.....kkkkkk.....'],
  ],
};

// 把颜色调亮或调暗一点，用来自动生成高光和阴影
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v =>
    Math.max(0, Math.min(255, Math.round(f > 0 ? v + (255 - v) * f : v * (1 + f)))));
  return '#' + ch.map(v => v.toString(16).padStart(2, '0')).join('');
}

// 生成一个角色的全部帧：frames[dir][0..2]，dir ∈ down/up/left/right
function buildCharacter(p) {
  const pal = {
    k: PAL.k,
    H: p.hair, h: p.hairDark, G: shade(p.hair, 0.18),          // 头发：本色 / 暗部 / 高光
    s: '#f5cfa8', S: '#dca482', e: '#2b1d2a', b: '#f0a8a0',    // 皮肤 / 阴影 / 眼睛 / 腮红
    C: p.cloth, c: p.clothDark, W: shade(p.cloth, 0.22),       // 衣服：本色 / 暗部 / 受光
    w: p.collar || '#f4efe4', g: '#e0b040',                    // 领子 / 纽扣
    I: p.shirt || p.clothDark,                                 // 西装里面的衬衫
    P: p.plaidDark || shade(p.cloth, -0.45),                   // 格子的深色
    N: p.stripe || shade(p.cloth, -0.6),                       // 运动服的条纹
    L: p.pants, F: p.shoes || '#4a3428', f: shade(p.shoes || '#4a3428', 0.3),
  };
  const frames = {};
  const blank = '................';
  for (const dir of ['down', 'up', 'right']) {
    frames[dir] = [];
    const legSet = dir === 'right' ? CHAR_LEGS.side : CHAR_LEGS.front;
    for (let f = 0; f < 3; f++) {
      // 头上有啾啾的话，上面留两行位置
      // 吊带上衣就换掉身体那几行，短裙就换掉腿那几行
      const body = p.cami ? CAMI_BODY[dir] : p.tshirt ? TSHIRT_BODY[dir] : p.suit ? SUIT_BODY[dir]
        : p.plaid ? PLAID_BODY[dir] : p.track ? TRACK_BODY[dir] : null;
      const top = body ? CHAR_TOP[dir].slice(0, 9).concat(body) : CHAR_TOP[dir];
      const legsNow = p.skirt ? (dir === 'right' ? CHAR_LEGS_SKIRT.side : CHAR_LEGS_SKIRT.front)[f]
        : p.track ? (dir === 'right' ? TRACK_LEGS.side : TRACK_LEGS.front)[f] : legSet[f];
      const rows = (p.pins ? [blank, blank, blank, blank] : []).concat(top, legsNow);
      const c = fromStrings(rows, pal);
      if (p.pins) drawPins(c.getContext('2d'), dir, p.pins);
      if (p.glasses) drawGlasses(c.getContext('2d'), dir, p.pins ? 4 : 0, p.glasses);
      frames[dir].push(c);
    }
  }
  frames.left = frames.right.map(flipH);
  return frames;
}

// 头顶两个小圆啾啾：一根短杆连着一个小球。外圈用深一号的粉色，不用黑描边
function drawPins(g, dir, color) {
  const light = shade(color, 0.45), edge = shade(color, -0.45);
  const sides = dir === 'right' ? [[4, 1, 5], [10, 1, 9]] : [[3, 1, 4], [11, 1, 11]];
  for (const [cx, cy, sx] of sides) {
    px(g, edge, sx, cy + 2, 1, 2);                      // 小杆子
    px(g, edge, cx - 1, cy, 4, 3); px(g, edge, cx, cy - 1, 2, 4);   // 圆球的外圈
    px(g, color, cx, cy, 2, 2);                         // 球
    px(g, light, cx, cy, 1, 1);                         // 高光
  }
}

// 细框眼镜：围着眼睛的一圈细边，中间一根鼻梁，side 还有一条伸向耳朵的镜腿
function drawGlasses(g, dir, yo, color) {
  if (dir === 'up') return;                       // 背面看不见
  const glass = shade(color, 0.8);
  if (dir === 'down') {
    px(g, color, 4, yo + 5, 8, 1);                // 横过两只眼睛上方的镜框
    px(g, color, 3, yo + 5, 1, 2); px(g, color, 12, yo + 5, 1, 2);   // 两边的外框角
    px(g, color, 4, yo + 8, 3, 1); px(g, color, 9, yo + 8, 3, 1);    // 镜片下沿
    px(g, glass, 4, yo + 6, 1, 1); px(g, glass, 9, yo + 6, 1, 1);    // 镜片反光
  } else {
    px(g, color, 7, yo + 5, 5, 1);
    px(g, color, 12, yo + 5, 1, 2);
    px(g, color, 9, yo + 8, 3, 1);
    px(g, glass, 9, yo + 6, 1, 1);
  }
}

const CAT_ROWS = [
  '.k.......k.',
  'kOk.....kOk',
  'kOOkkkkkOOk',
  'kOOOOOOOOOk',
  'kOkOOOOOkOk',
  'kOOOOpOOOOk',
  '.kOOOOOOOk.',
  '.kOWWWWWOk..',
  'kOOWWWWWOOkk',
  'kOOOOOOOOOkOk',
  '.kkkkkkkkkkk.',
];
function buildCat() {
  const pal = { k: PAL.k, O: '#e8a050', W: '#f4efe4', p: '#f08a9a' };
  const a = fromStrings(CAT_ROWS, pal);
  const blinkRows = CAT_ROWS.slice(); blinkRows[4] = 'kOOOOOOOOOk';
  const b = fromStrings(blinkRows, pal);
  return [a, b];
}

// ============================================================
//  地形
// ============================================================
function tileGrass(seed) {
  const c = makeCanvas(TILE, TILE), g = c.getContext('2d'), r = makeRng(seed);
  px(g, PAL.grass1, 0, 0, TILE, TILE);
  for (let i = 0; i < 14; i++) px(g, PAL.grass2, (r() * 16) | 0, (r() * 16) | 0);
  for (let i = 0; i < 3; i++) {           // 小草丛 “v”
    const x = 1 + ((r() * 13) | 0), y = 2 + ((r() * 12) | 0);
    px(g, PAL.grassDark, x, y); px(g, PAL.grassDark, x + 2, y); px(g, PAL.grassDark, x + 1, y + 1);
    px(g, PAL.grass3, x, y - 1);
  }
  for (let i = 0; i < 5; i++) px(g, PAL.grass3, (r() * 16) | 0, (r() * 16) | 0);
  return c;
}

function tilePath(seed) {
  const c = makeCanvas(TILE, TILE), g = c.getContext('2d'), r = makeRng(seed);
  px(g, PAL.path1, 0, 0, TILE, TILE);
  for (let i = 0; i < 18; i++) px(g, PAL.path2, (r() * 16) | 0, (r() * 16) | 0);
  for (let i = 0; i < 8; i++) px(g, PAL.path3, (r() * 16) | 0, (r() * 16) | 0);
  for (let i = 0; i < 2; i++) {           // 小石子
    const x = (r() * 14) | 0, y = (r() * 14) | 0;
    px(g, PAL.stone, x, y, 2, 1); px(g, PAL.stoneDark, x, y + 1, 2, 1);
  }
  return c;
}

function tileSoil(wet) {
  const c = makeCanvas(TILE, TILE), g = c.getContext('2d');
  const base = wet ? PAL.wet : PAL.soil, dark = wet ? PAL.wetDark : PAL.soilDark;
  px(g, dark, 0, 0, TILE, TILE);
  px(g, base, 1, 1, 14, 14);
  for (let y = 3; y < 15; y += 4) {      // 垄沟
    px(g, dark, 2, y, 12, 1);
    px(g, wet ? '#6e4a32' : PAL.soilLight, 2, y - 1, 12, 1);
  }
  return c;
}

function tileBridge() {
  const c = makeCanvas(TILE, TILE), g = c.getContext('2d');
  px(g, PAL.woodDark, 0, 0, TILE, TILE);
  for (let x = 0; x < 16; x += 4) {
    px(g, PAL.wood, x, 2, 3, 12);
    px(g, PAL.woodLight, x, 2, 1, 12);
  }
  px(g, PAL.woodDark, 0, 0, 16, 2); px(g, PAL.woodLight, 0, 0, 16, 1);   // 栏杆
  px(g, PAL.woodDark, 0, 14, 16, 2); px(g, PAL.woodLight, 0, 14, 16, 1);
  return c;
}

// 花、草等不挡路的小装饰
function decoFlower(seed) {
  const c = makeCanvas(TILE, TILE), g = c.getContext('2d'), r = makeRng(seed);
  const colors = [['#f4efe4', '#f2d24a'], ['#f6a8c4', '#f4efe4'], ['#f2d24a', '#e07a3a'], ['#a8a0f0', '#f4efe4']];
  const n = 1 + ((r() * 3) | 0);
  for (let i = 0; i < n; i++) {
    const [petal, mid] = colors[(r() * colors.length) | 0];
    const x = 2 + ((r() * 11) | 0), y = 2 + ((r() * 10) | 0);
    px(g, PAL.leafDark, x + 1, y + 2, 1, 2);
    px(g, petal, x, y + 1); px(g, petal, x + 2, y + 1); px(g, petal, x + 1, y); px(g, petal, x + 1, y + 2);
    px(g, mid, x + 1, y + 1);
  }
  return c;
}

// ============================================================
//  程序化“团块”：树冠、灌木、石头
// ============================================================
function blob(w, h, circles, shades, seed, extra) {
  const c = makeCanvas(w, h), g = c.getContext('2d'), r = makeRng(seed);
  const inside = (x, y) => circles.some(([cx, cy, cr]) => (x - cx) ** 2 + (y - cy) ** 2 <= cr * cr);
  const img = g.getImageData(0, 0, w, h);
  const set = (x, y, hex) => {
    const i = (y * w + x) * 4;
    img.data[i] = parseInt(hex.slice(1, 3), 16); img.data[i + 1] = parseInt(hex.slice(3, 5), 16);
    img.data[i + 2] = parseInt(hex.slice(5, 7), 16); img.data[i + 3] = 255;
  };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (inside(x, y)) {
      // 找出“最深入”的那个圆，用相对位置做左上受光的明暗
      let best = null, bestD = -1e9;
      for (const cc of circles) {
        const d = cc[2] - Math.hypot(x - cc[0], y - cc[1]);
        if (d > bestD) { bestD = d; best = cc; }
      }
      const nx = (x - best[0]) / best[2], ny = (y - best[1]) / best[2];
      const v = -(nx * 0.55 + ny * 0.85) + (r() - 0.5) * 0.35;
      set(x, y, v > 0.45 ? shades.light : v < -0.35 ? shades.dark : shades.mid);
    } else if (inside(x + 1, y) || inside(x - 1, y) || inside(x, y + 1) || inside(x, y - 1)) {
      set(x, y, PAL.k);
    }
  }
  g.putImageData(img, 0, 0);
  if (extra) extra(g, r, inside);
  return c;
}

function spriteTree(seed, kind) {
  const W = 32, H = 42;
  const c = makeCanvas(W, H), g = c.getContext('2d');
  // 树干
  px(g, PAL.k, 12, 24, 8, 17);
  px(g, kind === 'sakura' ? '#7a4e3e' : PAL.wood, 13, 24, 6, 16);
  px(g, kind === 'sakura' ? '#5a3a30' : PAL.woodDark, 17, 24, 2, 16);
  px(g, PAL.k, 11, 39, 10, 2);
  const circles = [[16, 12, 10], [9, 17, 7], [23, 17, 7], [16, 20, 7], [11, 9, 6], [21, 9, 6]];
  const shades = kind === 'sakura'
    ? { light: PAL.pinkLight, mid: PAL.pink, dark: PAL.pinkDark }
    : { light: PAL.leafLight, mid: PAL.leaf, dark: PAL.leafDark };
  const crown = blob(W, 30, circles, shades, seed, (cg, r, inside) => {
    const dots = kind === 'sakura' ? ['#ffffff', '#fff0f6'] : ['#9ad86a'];
    for (let i = 0; i < 22; i++) {
      const x = (r() * W) | 0, y = (r() * 30) | 0;
      if (inside(x, y) && inside(x + 1, y) && inside(x, y + 1)) px(cg, dots[(r() * dots.length) | 0], x, y);
    }
  });
  g.drawImage(crown, 0, 0);
  return c;
}

function spriteBush(seed) {
  return blob(16, 14, [[8, 8, 6], [5, 9, 4], [11, 9, 4]],
    { light: PAL.leafLight, mid: PAL.leaf, dark: PAL.leafDark }, seed, (g, r, inside) => {
      for (let i = 0; i < 4; i++) {        // 小红果
        const x = 3 + ((r() * 10) | 0), y = 4 + ((r() * 7) | 0);
        if (inside(x, y)) px(g, '#e04858', x, y);
      }
    });
}

function spriteRock(seed) {
  return blob(16, 12, [[8, 7, 5], [5, 8, 3], [11, 8, 3]],
    { light: PAL.stoneLight, mid: PAL.stone, dark: PAL.stoneDark }, seed);
}

function spriteBamboo(seed) {
  const r = makeRng(seed), c = makeCanvas(16, 44), g = c.getContext('2d');
  const stalks = [[3, 44], [8, 38], [12, 42]];
  for (const [x, top] of stalks) {
    const y0 = 44 - top;
    px(g, PAL.k, x - 1, y0, 4, top);
    px(g, '#8cc85a', x, y0, 2, top);
    px(g, '#5a9a3e', x + 1, y0, 1, top);
    for (let y = y0 + 4 + ((r() * 3) | 0); y < 43; y += 7) px(g, '#3e7430', x, y, 2, 1);   // 竹节
  }
  for (let i = 0; i < 10; i++) {                 // 竹叶
    const x = (r() * 13) | 0, y = (r() * 22) | 0;
    px(g, PAL.leafDark, x, y + 1, 3, 1); px(g, PAL.leafLight, x + 1, y, 3, 1);
  }
  return c;
}

// 石灯笼
function spriteLantern() {
  const c = makeCanvas(16, 28), g = c.getContext('2d');
  const S = PAL.stone, D = PAL.stoneDark, L = PAL.stoneLight, K = PAL.k;
  // 顶
  px(g, K, 7, 0, 2, 1); px(g, K, 5, 1, 6, 1);
  px(g, K, 1, 2, 14, 4); px(g, L, 2, 3, 12, 1); px(g, S, 2, 4, 12, 1); px(g, D, 3, 5, 10, 1);
  // 火袋
  px(g, K, 3, 6, 10, 7); px(g, S, 4, 6, 8, 6); px(g, '#3a2a30', 6, 7, 4, 4); px(g, D, 4, 11, 8, 1);
  // 中台
  px(g, K, 2, 13, 12, 3); px(g, L, 3, 13, 10, 1); px(g, D, 3, 14, 10, 1);
  // 柱
  px(g, K, 5, 16, 6, 9); px(g, S, 6, 16, 4, 9); px(g, L, 6, 16, 1, 9); px(g, D, 9, 16, 1, 9);
  // 基座
  px(g, K, 2, 24, 12, 4); px(g, S, 3, 24, 10, 2); px(g, D, 3, 26, 10, 1);
  return c;
}

// 灯笼亮起来的窗口（夜晚叠加用）
function spriteLanternGlow() {
  const c = makeCanvas(16, 28), g = c.getContext('2d');
  px(g, '#ffd66a', 6, 7, 4, 4); px(g, '#fff2b0', 7, 8, 2, 2);
  return c;
}

// 栅栏：根据四邻连接
function spriteFence(n, e, s, w) {
  const c = makeCanvas(16, 20), g = c.getContext('2d');
  const W = PAL.woodLight, D = PAL.woodDark, K = PAL.k;
  if (w) { px(g, K, 0, 7, 8, 5); px(g, W, 0, 8, 8, 1); px(g, D, 0, 10, 8, 1); }
  if (e) { px(g, K, 8, 7, 8, 5); px(g, W, 8, 8, 8, 1); px(g, D, 8, 10, 8, 1); }
  if (n) { px(g, K, 6, 0, 4, 8); px(g, W, 7, 0, 2, 8); }
  if (s) { px(g, K, 6, 10, 4, 10); px(g, W, 7, 10, 2, 10); }
  px(g, K, 5, 3, 6, 15); px(g, W, 6, 4, 4, 13); px(g, D, 8, 4, 2, 13); px(g, PAL.woodLight, 6, 4, 4, 1);
  return c;
}

// ============================================================
//  建筑
// ============================================================
function shojiDoor(g, x, y, w, h) {
  px(g, PAL.k, x - 1, y - 1, w + 2, h + 1);
  px(g, '#f6f0dc', x, y, w, h);
  for (let i = x + 3; i < x + w; i += 4) px(g, '#b89a70', i, y, 1, h);
  for (let j = y + 4; j < y + h; j += 5) px(g, '#b89a70', x, j, w, 1);
  px(g, PAL.woodDark, x + (w >> 1), y, 1, h);   // 两扇门中缝
}

function spriteHouse() {   // 农家（茅草屋顶），80x88，占地 5x4 格
  const W = 80, H = 88, c = makeCanvas(W, H), g = c.getContext('2d'), r = makeRng(7);
  const wallTop = 46;
  // 墙
  px(g, PAL.k, 3, wallTop, 74, H - wallTop);
  px(g, '#efe4cc', 4, wallTop, 72, H - wallTop - 5);
  px(g, '#d8caa8', 4, wallTop, 72, 3);
  for (const x of [4, 22, 56, 72]) { px(g, PAL.woodDark, x, wallTop, 4, H - wallTop - 5); px(g, PAL.wood, x, wallTop, 1, H - wallTop - 5); }
  px(g, PAL.woodDark, 4, wallTop + 12, 72, 3);
  // 窗
  shojiDoor(g, 9, wallTop + 18, 10, 10);
  shojiDoor(g, 60, wallTop + 18, 10, 10);
  // 门
  shojiDoor(g, 30, wallTop + 16, 20, 21);
  // 石基
  px(g, PAL.stoneDark, 3, H - 5, 74, 5); px(g, PAL.stone, 3, H - 5, 74, 2);
  px(g, PAL.stone, 34, H - 3, 12, 3); px(g, PAL.stoneLight, 34, H - 3, 12, 1);
  // 茅草屋顶（梯形）
  const roofTop = 6, roofBottom = wallTop + 4;
  for (let y = roofTop; y < roofBottom; y++) {
    const t = (y - roofTop) / (roofBottom - roofTop);
    const half = 18 + t * 22;
    const x0 = Math.round(40 - half), x1 = Math.round(40 + half);
    px(g, PAL.k, x0 - 1, y, x1 - x0 + 2, 1);
    for (let x = x0; x < x1; x++) {
      const stripe = (x * 7 + ((y / 3) | 0) * 3) % 5;
      const col = stripe === 0 ? '#9a7a3e' : (y - roofTop) < 3 ? '#e2c47a' : r() < 0.12 ? '#e2c47a' : '#c9a45c';
      px(g, col, x, y);
    }
  }
  px(g, '#7a5a2e', 0, roofBottom - 3, W, 3);            // 屋檐
  px(g, PAL.k, 0, roofBottom, W, 1);
  // 屋脊
  px(g, PAL.k, 19, 0, 42, 8);
  px(g, '#4a3a4a', 20, 1, 40, 6); px(g, '#6a5a6e', 20, 1, 40, 2);
  for (let x = 24; x < 58; x += 8) px(g, '#c9a45c', x, 3, 3, 3);
  return c;
}

function spriteShop() {    // 杂货铺（瓦屋顶 + 暖帘）
  const W = 80, H = 88, c = makeCanvas(W, H), g = c.getContext('2d');
  const wallTop = 40;
  px(g, PAL.k, 3, wallTop, 74, H - wallTop);
  px(g, '#e8dcc0', 4, wallTop, 72, H - wallTop - 5);
  for (const x of [4, 72]) { px(g, PAL.woodDark, x, wallTop, 4, H - wallTop - 5); }
  // 木板下墙
  for (let x = 8; x < 72; x += 4) { px(g, PAL.wood, x, wallTop + 30, 3, 13); px(g, PAL.woodDark, x + 3, wallTop + 30, 1, 13); }
  // 店面柜台窗
  px(g, PAL.k, 9, wallTop + 10, 16, 14); px(g, '#6a4a3a', 10, wallTop + 11, 14, 12);
  for (let i = 0; i < 4; i++) px(g, ['#e04858', '#f2d24a', '#7cc458', '#f6a8c4'][i], 11 + i * 3, wallTop + 19, 2, 3);
  px(g, PAL.k, 55, wallTop + 10, 16, 14); px(g, '#6a4a3a', 56, wallTop + 11, 14, 12);
  px(g, '#f4efe4', 58, wallTop + 18, 4, 4); px(g, '#e8a050', 63, wallTop + 17, 4, 5);
  // 门 + 暖帘
  px(g, PAL.k, 29, wallTop + 6, 22, H - wallTop - 11); px(g, '#3a2a28', 30, wallTop + 7, 20, H - wallTop - 12);
  px(g, PAL.k, 27, wallTop + 4, 26, 16);
  for (let i = 0; i < 3; i++) {
    px(g, '#2e4a8a', 28 + i * 8, wallTop + 5, 7, 14);
    px(g, '#3e5ea8', 28 + i * 8, wallTop + 5, 7, 2);
  }
  px(g, '#f4efe4', 38, wallTop + 9, 4, 4); px(g, '#2e4a8a', 39, wallTop + 10, 2, 2);   // 家纹
  px(g, PAL.stoneDark, 3, H - 5, 74, 5); px(g, PAL.stone, 3, H - 5, 74, 2);
  // 瓦屋顶
  const roofTop = 4, roofBottom = wallTop + 2;
  for (let y = roofTop; y < roofBottom; y++) {
    const t = (y - roofTop) / (roofBottom - roofTop);
    const half = 26 + t * 14;
    const x0 = Math.round(40 - half), x1 = Math.round(40 + half);
    px(g, PAL.k, x0 - 1, y, x1 - x0 + 2, 1);
    const row = ((y - roofTop) / 4) | 0, inRow = (y - roofTop) % 4;
    for (let x = x0; x < x1; x++) {
      const col = inRow === 3 ? '#3a4458' : ((x + row * 3) % 6 === 0) ? '#4a5470' : inRow === 0 ? '#8a94b0' : '#66708e';
      px(g, col, x, y);
    }
  }
  px(g, PAL.k, 0, roofBottom - 2, W, 3); px(g, '#4a5470', 1, roofBottom - 2, W - 2, 1);
  px(g, PAL.k, 12, 0, 56, 5); px(g, '#3a4458', 13, 1, 54, 3);
  // 招牌
  px(g, PAL.k, 30, 22, 20, 11); px(g, '#c08a5a', 31, 23, 18, 9); px(g, '#6e4a2e', 31, 31, 18, 1);
  return c;
}

function spriteShrine() {  // 神社拜殿
  const W = 80, H = 88, c = makeCanvas(W, H), g = c.getContext('2d');
  const wallTop = 42;
  px(g, PAL.k, 7, wallTop, 66, H - wallTop);
  px(g, '#efe4cc', 8, wallTop, 64, H - wallTop - 6);
  for (const x of [8, 24, 52, 68]) { px(g, PAL.k, x - 1, wallTop, 6, H - wallTop - 6); px(g, PAL.red, x, wallTop, 4, H - wallTop - 6); px(g, '#f06a5a', x, wallTop, 1, H - wallTop - 6); }
  px(g, PAL.redDark, 8, wallTop, 64, 4);
  shojiDoor(g, 31, wallTop + 10, 18, 26);
  // 注连绳
  px(g, '#d8c078', 14, wallTop + 5, 52, 3); px(g, '#b09a58', 14, wallTop + 7, 52, 1);
  for (const x of [24, 36, 44, 56]) { px(g, '#ffffff', x, wallTop + 8, 3, 3); px(g, '#ffffff', x + 1, wallTop + 11, 2, 3); }
  // 铃
  px(g, '#e0b040', 39, wallTop + 9, 3, 3); px(g, PAL.red, 40, wallTop + 12, 1, 6);
  // 赛钱箱
  px(g, PAL.k, 30, H - 14, 20, 9); px(g, PAL.wood, 31, H - 13, 18, 7);
  for (let x = 32; x < 48; x += 3) px(g, PAL.woodDark, x, H - 13, 1, 3);
  // 石台阶
  px(g, PAL.k, 5, H - 6, 70, 6); px(g, PAL.stone, 6, H - 5, 68, 3); px(g, PAL.stoneLight, 6, H - 5, 68, 1);
  // 屋顶（深色铜板，两端上翘）
  const roofTop = 8, roofBottom = wallTop;
  for (let y = roofTop; y < roofBottom; y++) {
    const t = (y - roofTop) / (roofBottom - roofTop);
    const half = 14 + Math.pow(t, 0.7) * 26;
    const x0 = Math.round(40 - half), x1 = Math.round(40 + half);
    px(g, PAL.k, x0 - 1, y, x1 - x0 + 2, 1);
    px(g, (y - roofTop) % 5 === 0 ? '#3e6a6a' : '#4e8a82', x0, y, x1 - x0, 1);
    px(g, '#6aaa9a', x0, y, 2, 1);
  }
  px(g, PAL.k, 0, roofBottom - 4, 6, 3); px(g, PAL.k, 74, roofBottom - 4, 6, 3);   // 翘角
  px(g, PAL.k, 0, roofBottom - 1, W, 2);
  // 千木 / 鲣木
  px(g, PAL.k, 24, 3, 32, 6); px(g, '#3e6a6a', 25, 4, 30, 4);
  for (const x of [30, 38, 46]) { px(g, PAL.k, x, 0, 5, 4); px(g, '#e0b040', x + 1, 1, 3, 2); }
  px(g, PAL.k, 20, 0, 3, 7); px(g, PAL.k, 57, 0, 3, 7);
  return c;
}

function spriteTorii() {   // 鸟居 48x48
  const c = makeCanvas(48, 48), g = c.getContext('2d');
  const R = PAL.red, D = PAL.redDark, K = PAL.k;
  for (const x of [7, 36]) { px(g, K, x - 1, 8, 7, 40); px(g, R, x, 8, 5, 38); px(g, '#f06a5a', x, 8, 1, 38); px(g, D, x + 4, 8, 1, 38); px(g, '#2b2b2b', x - 1, 42, 7, 6); }
  // 笠木（黑）
  px(g, K, 0, 1, 48, 7); px(g, '#3a3040', 1, 2, 46, 4); px(g, '#5a5060', 1, 2, 46, 1);
  px(g, K, 0, 0, 3, 2); px(g, K, 45, 0, 3, 2);
  px(g, K, 2, 7, 44, 4); px(g, R, 3, 7, 42, 3);
  // 贯
  px(g, K, 3, 16, 42, 5); px(g, R, 4, 17, 40, 3); px(g, D, 4, 19, 40, 1);
  // 额束（牌匾）
  px(g, K, 20, 9, 8, 9); px(g, '#2b2b2b', 21, 10, 6, 7); px(g, '#e0b040', 23, 12, 2, 3);
  return c;
}

function spriteShipBox() {
  const c = makeCanvas(16, 18), g = c.getContext('2d');
  px(g, PAL.k, 0, 3, 16, 15);
  px(g, PAL.wood, 1, 7, 14, 10); px(g, PAL.woodDark, 1, 15, 14, 2);
  for (let x = 4; x < 15; x += 4) px(g, PAL.woodDark, x, 7, 1, 8);
  px(g, PAL.woodLight, 1, 4, 14, 3); px(g, PAL.k, 0, 6, 16, 1);  // 盖
  px(g, '#e0b040', 7, 5, 2, 3);
  return c;
}

// ============================================================
//  作物（5 个阶段：0 种子 1 发芽 2 幼苗 3 长大 4 可收获）
// ============================================================
function spriteCrop(kind, stage) {
  const c = makeCanvas(16, 16), g = c.getContext('2d');
  const L = PAL.leafLight, M = PAL.leaf, D = PAL.leafDark;
  if (stage === 0) {
    for (const [x, y] of [[5, 9], [9, 7], [8, 11], [11, 10]]) { px(g, '#3a2418', x, y, 2, 1); px(g, '#d8b878', x, y - 1, 1, 1); }
    return c;
  }
  if (stage === 1) {
    px(g, D, 7, 9, 1, 3); px(g, M, 5, 8, 2, 2); px(g, L, 8, 7, 2, 2); px(g, D, 5, 9, 1, 1);
    return c;
  }
  const tall = kind === 'daikon' ? 2 : 0;
  if (stage >= 2) {
    const h = stage === 2 ? 5 : 8 + tall;
    const base = 13;
    // 叶子（左右交替的一簇）
    for (let i = 0; i < h; i++) {
      const y = base - i;
      px(g, D, 7, y, 2, 1);
      if (i > 1 && i % 2 === 0) { px(g, M, 4, y - 1, 3, 2); px(g, D, 4, y, 1, 1); }
      if (i > 1 && i % 2 === 1) { px(g, M, 9, y - 1, 3, 2); px(g, D, 11, y, 1, 1); }
    }
    px(g, L, 6, base - h, 4, 2); px(g, M, 7, base - h + 1, 2, 1);
    if (stage >= 3) { px(g, L, 3, base - 4, 2, 1); px(g, L, 11, base - 5, 2, 1); }
  }
  if (stage === 4) {
    if (kind === 'turnip') {
      px(g, PAL.k, 4, 11, 8, 5); px(g, '#f4efe4', 5, 12, 6, 3); px(g, '#b060b0', 5, 11, 6, 2); px(g, '#d888d8', 6, 11, 2, 1);
    } else {
      px(g, PAL.k, 5, 10, 6, 6); px(g, '#f4efe4', 6, 11, 4, 5); px(g, '#c8e0a0', 6, 11, 4, 1); px(g, '#ffffff', 6, 12, 1, 3);
    }
  }
  return c;
}

// ============================================================
//  道具图标
// ============================================================
const ICON_PAL = {
  k: PAL.k, o: '#d4d8e4', O: '#8a8ea0', n: '#c08a5a', N: '#7a5230',
  b: '#6aa8d8', B: '#3a74a8', l: '#b8e0f8',
  y: '#e2c47a', Y: '#b08a40', g: '#f4efe4', G: '#c8b890',
  L: '#6ab04a', D: '#3a7a34', p: '#b060b0', P: '#d888d8', w: '#f4efe4', W: '#c8c4b8',
};
const ICONS = {
  hoe: [
    '................',
    '.......kkkkk....',
    '......kOoooOk...',
    '.......kkknkOk..',
    '.........knk.k..',
    '........knk.....',
    '.......knk......',
    '......knk.......',
    '.....knk........',
    '....knk.........',
    '...knk..........',
    '..knk...........',
    '..kNk...........',
    '...k............',
  ],
  can: [
    '................',
    '................',
    '....kkkkk.......',
    '...k.....k......',
    '..kkkkkkkkk.....',
    '.klbbbbbbbbk..kk',
    '.klbbbbbbbbkkkbk',
    '.kbbbbbbbbbbbbk.',
    '.kbbbbbbbbbkkk..',
    '.kBbbbbbbbbk....',
    '.kBBbbbbbbBk....',
    '..kkkkkkkkk.....',
  ],
  seed: [
    '................',
    '.....kkkkkk.....',
    '....kyyyyyyk....',
    '.....kYkkYk.....',
    '....kyyyyyyk....',
    '...kyyyyyyyyk...',
    '..kyyyGGGGyyyk..',
    '..kyyGggggGyyk..',
    '..kyyGggggGyyk..',
    '..kyyyGGGGyyyk..',
    '..kYyyyyyyyyYk..',
    '...kYYYYYYYYk...',
    '....kkkkkkkk....',
  ],
  turnip: [
    '................',
    '......k.k.k.....',
    '.....kLkLkLk....',
    '.....kLLLLLk....',
    '......kDLDk.....',
    '.....kppppk.....',
    '....kpPPppppk...',
    '...kwwwwwwwwk...',
    '...kwwwwwwwwk...',
    '...kwwwwwwWwk...',
    '....kwwwwWWk....',
    '.....kwwWWk.....',
    '......kkkk......',
    '.......kk.......',
  ],
  daikon: [
    '.....k...k......',
    '....kLk.kLk.....',
    '....kLLkLLk.....',
    '.....kLLLk......',
    '......kDk.......',
    '.....kwwwk......',
    '.....kwwwWk.....',
    '.....kwwwWk.....',
    '......kwwWk.....',
    '......kwwWk.....',
    '......kwwk......',
    '.......kwk......',
    '.......kk.......',
  ],
};

function buildIcons() {
  const out = {};
  for (const [name, rows] of Object.entries(ICONS)) out[name] = fromStrings(rows, ICON_PAL);
  // 两种种子袋换个颜色
  out.seed_turnip = fromStrings(ICONS.seed, { ...ICON_PAL, g: '#d888d8', G: '#b060b0' });
  out.seed_daikon = fromStrings(ICONS.seed, { ...ICON_PAL, g: '#f4efe4', G: '#6ab04a' });
  return out;
}

// ============================================================
//  统一构建所有美术资源
// ============================================================
function buildArt() {
  const A = {};
  A.grass = [0, 1, 2, 3].map(i => tileGrass(100 + i));
  A.path = [0, 1, 2, 3].map(i => tilePath(200 + i));
  A.soil = tileSoil(false);
  A.soilWet = tileSoil(true);
  A.bridge = tileBridge();
  A.flowers = [0, 1, 2, 3, 4, 5].map(i => decoFlower(300 + i));
  A.tree = [0, 1, 2].map(i => spriteTree(400 + i, 'tree'));
  A.sakura = [0, 1, 2].map(i => spriteTree(500 + i, 'sakura'));
  A.bush = [0, 1].map(i => spriteBush(600 + i));
  A.rock = [0, 1].map(i => spriteRock(700 + i));
  A.bamboo = [0, 1, 2].map(i => spriteBamboo(800 + i));
  A.lantern = spriteLantern();
  A.lanternGlow = spriteLanternGlow();
  A.fence = {};
  for (let m = 0; m < 16; m++) A.fence[m] = spriteFence(m & 1, m & 2, m & 4, m & 8);
  A.house = spriteHouse();
  A.shop = spriteShop();
  A.shrine = spriteShrine();
  A.torii = spriteTorii();
  A.shipBox = spriteShipBox();
  A.crops = {};
  for (const k of ['turnip', 'daikon']) A.crops[k] = [0, 1, 2, 3, 4].map(s => spriteCrop(k, s));
  A.icons = buildIcons();
  A.cat = buildCat();
  return A;
}
