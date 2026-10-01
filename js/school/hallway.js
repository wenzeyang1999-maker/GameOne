// ============================================================
//  场景：走廊（一~四楼共用同一个模板，buildHallway(楼层)）
//  上墙 = 各教室（门、班级牌、公告栏）  下墙 = 朝中庭的窗户，窗外能看到中庭
//  一~三楼：楼梯 | A班 | 洗手台 | B班 | 职员室/保健室/图书室 | 楼梯
//  四楼：楼梯 | 电脑室 | 实验室 | 校长室 | 教导主任室 | 楼梯（都是只有一扇门的小房间）
//  两头的楼梯：上半（亮）往上走，下半（暗）往下走
// ============================================================

const HW = 76, HH = 14;
const HALL_WIN_ROW = 10;   // 窗户那面墙所在的行；上面 3~9 行是走廊，下面是中庭
const HALL_A = { x0: 6, front: [10, 11], back: [25, 26] };   // 和教室的门一一对应（教室 x + 6）
const HALL_B = { x0: 32, front: [36, 37], back: [51, 52] };
const HALL_C = { x0: 58, door: [61, 62] };
const STAIRS = { L: 1, R: 72 };            // 楼梯占的起始列（各 3 列宽）
const STAIR_UP = [3, 4, 5], STAIR_DOWN = [6, 7, 8];

// 每层楼有哪些房间。
//   cls: 教室（两扇门，能不能进看 CLASSES 里的 open）
//   key + scene: 只有一扇门的房间，scene 是要去的场景；没有 scene 就是锁着的
const TOP_FLOOR = 4;
const FLOORS = {
  1: { id: 'hall1', name: '一楼走廊', boards: [[14, 20], [41, 47], [63, 67]],
    rooms: [{ cls: '1A', pos: HALL_A }, { cls: '1B', pos: HALL_B },
      { key: 'nurse', sign: '保健室', doors: [HALL_C.door], metal: true, locked: '保健室。门上挂着“老师外出中”的牌子。' }] },
  2: { id: 'hallway', name: '二楼走廊', boards: [[14, 20], [41, 47], [63, 67]],
    rooms: [{ cls: '2A', pos: HALL_A }, { cls: '2B', pos: HALL_B },
      { key: 'staff', sign: '职员室', doors: [HALL_C.door], metal: true, scene: 'staffroom' }] },
  3: { id: 'hall3', name: '三楼走廊', boards: [[14, 20], [41, 47], [63, 67]],
    rooms: [{ cls: '3A', pos: HALL_A }, { cls: '3B', pos: HALL_B },
      { key: 'library', sign: '图书室', doors: [HALL_C.door], metal: false, locked: '图书室。门上贴着“今日闭馆整理”。' }] },
  4: { id: 'hall4', name: '四楼走廊', boards: [[18, 23], [48, 53]],
    // 只有右边的楼梯能上五楼（左边还是封着的）
    up: { side: 'R', to: 'landing5', entry: 'stairs', label: '5F' },
    rooms: [{ key: 'pc', sign: '电脑室', doors: [[12, 13]], metal: true, scene: 'room_pc' },
      { key: 'lab', sign: '实验室', doors: [[26, 27]], metal: true, scene: 'room_lab' },
      { key: 'principal', sign: '校长室', doors: [[42, 43]], metal: false, scene: 'room_principal' },
      { key: 'dean', sign: '教导主任室', doors: [[58, 59]], metal: false, scene: 'room_dean' }] },
};
// 这一层的这一侧能往上走吗？返回 {to, entry, label}，不能就返回 null
function stairsUp(floor, side) {
  if (floor < TOP_FLOOR) return { to: FLOORS[floor + 1].id, entry: side + '_fromBelow', label: (floor + 1) + 'F' };
  const up = FLOORS[floor].up;                       // 顶层特例：只有指定的一侧能继续往上
  return up && up.side === side ? up : null;
}

const PAINTING_COLS = [68, 69, 70, 71];        // 右边楼梯旁的挂画（去程）
const PAINTING_COLS_L = [4, 5, 6, 7];          // 左边楼梯旁的挂画（归途）
// 倒计时横幅占的墙面（每层不一样，避开门、公告栏和挂画）
const BANNER_COLS = { 1: [53, 54, 55, 56, 57, 58, 59, 60], 2: [53, 54, 55, 56, 57, 58, 59, 60],
  3: [53, 54, 55, 56, 57, 58, 59, 60], 4: [32, 33, 34, 35, 36, 37, 38, 39] };
// 每层的红底白字横幅
const BANNER = {
  1: '距离高考还有 1029 天',
  2: '距离高考还有 664 天',
  3: '距离高考还有 264 天',
  4: '距离高考还有 264 天',
};
// 走廊中段的受难系挂画：一楼在保健室门口，二、三楼在教室之间
const HALL_EXTRA = {
  1: { art: SUFFER.pieta, cols: [32, 33, 34, 35] },
  2: { art: SUFFER.sisyphus, cols: [32, 33, 34, 35] },
  3: { art: SUFFER.prometheus, cols: [32, 33, 34, 35] },
};

const roomSign = rm => rm.sign || (rm.cls[0] + '-' + rm.cls[1]);
const roomDoors = rm => rm.doors || [rm.pos.front, rm.pos.back];
const HALL_LOWER = '#b8c4b0';

function hallFloorTile(seed) {   // 浅灰绿色的塑胶地板
  const c = makeCanvas(16, 16), g = c.getContext('2d'), r = makeRng(seed);
  px(g, '#c6ceb8', 0, 0, 16, 16);
  px(g, '#b0b8a2', 0, 0, 16, 1); px(g, '#b0b8a2', 0, 0, 1, 16);
  px(g, '#d4dcc6', 1, 1, 15, 1);
  for (let i = 0; i < 6; i++) px(g, r() < 0.5 ? '#bcc4ae' : '#d0d8c2', 1 + ((r() * 15) | 0), 1 + ((r() * 15) | 0));
  return c;
}

function spriteSink() {          // 洗手台 32x22（贴着上墙）
  const c = makeCanvas(32, 22), g = c.getContext('2d'), K = PAL.k;
  px(g, K, 0, 4, 32, 18);
  px(g, '#e8ecf0', 1, 5, 30, 8); px(g, '#ffffff', 1, 5, 30, 1);         // 台面
  for (const x of [3, 17]) { px(g, '#b8c4cc', x, 7, 12, 5); px(g, '#9aa8b2', x, 7, 12, 1); }   // 水槽
  px(g, '#c8d0d6', 1, 13, 30, 8); px(g, '#a8b0b8', 1, 19, 30, 2);       // 前面
  for (const x of [8, 22]) { px(g, K, x, 0, 3, 6); px(g, '#d8dde2', x + 1, 1, 1, 4); }        // 水龙头
  px(g, '#f0c040', 14, 6, 4, 2);                                          // 肥皂
  return c;
}

function spriteExtinguisher() {  // 灭火器 16x20
  const c = makeCanvas(16, 20), g = c.getContext('2d'), K = PAL.k;
  px(g, K, 4, 4, 8, 16); px(g, '#d4443c', 5, 5, 6, 14); px(g, '#f06a5a', 5, 5, 2, 14);
  px(g, '#f4efe4', 5, 10, 6, 3);
  px(g, K, 6, 1, 4, 4); px(g, '#2a2a2a', 7, 2, 2, 2); px(g, K, 10, 2, 3, 1); px(g, K, 12, 3, 1, 5);
  return c;
}

function spriteBench() {         // 长椅 48x16
  const c = makeCanvas(48, 16), g = c.getContext('2d'), K = PAL.k;
  for (const x of [3, 42]) { px(g, K, x, 8, 3, 8); px(g, '#8a92a0', x + 1, 9, 1, 6); }
  px(g, K, 0, 3, 48, 7);
  for (let y = 4; y < 9; y += 2) { px(g, '#c08a5a', 1, y, 46, 1); px(g, '#9a6a42', 1, y + 1, 46, 1); }
  return c;
}

// 墙面上的拉门（从走廊正面看）
function drawWallDoor(g, x0, w, metal) {
  const top = 16, bottom = 48;
  px(g, PAL.k, x0 - 1, top - 1, w + 2, bottom - top + 1);
  const halves = metal ? 1 : 2, hw = w / halves;
  for (let i = 0; i < halves; i++) {
    const dx = x0 + i * hw;
    px(g, metal ? '#9aa0ac' : '#b08050', dx, top, hw - (halves > 1 ? 1 : 0), bottom - top);
    px(g, metal ? '#b8bec8' : '#c89a64', dx, top, 2, bottom - top);
    px(g, PAL.k, dx + 3, top + 3, hw - 7, 13);
    px(g, '#f4ecc8', dx + 4, top + 4, hw - 9, 11);                       // 窗里透出教室的光
    px(g, 'rgba(255,255,255,0.6)', dx + 5, top + 5, 2, 6);
  }
  px(g, '#4a3a2a', x0 + (w >> 1) - (metal ? 8 : 3), top + 20, 2, 5);     // 把手
}

// 班级牌：从门框上方伸出来的小牌子
function drawSign(g, cx, label) {
  const w = Math.max(28, Math.round(textW(g, label)) + 10), x = Math.round(cx - w / 2);
  px(g, PAL.k, x, 1, w, 14); px(g, '#f4efe4', x + 1, 2, w - 2, 12); px(g, '#d8d0bc', x + 1, 12, w - 2, 2);
  px(g, '#8a8e9a', cx - 1, 0, 2, 2);
  g.font = FONT; g.textBaseline = 'top'; g.fillStyle = '#2a2e48';
  g.fillText(label, x + ((w - textW(g, label)) >> 1), 2);
}

// 拉在墙上的红底白字横幅
function drawBanner(g, x0, w, label) {
  const y = 1, h = 13;
  px(g, PAL.k, x0 - 1, y - 1, w + 2, h + 2);
  px(g, '#a82424', x0, y, w, h); px(g, '#c83434', x0, y, w, 2); px(g, '#7a1818', x0, y + h - 2, w, 2);
  for (let i = 0; i < w; i += 3) px(g, 'rgba(255,255,255,0.05)', x0 + i, y, 1, h);   // 布纹
  px(g, '#e0b040', x0 + 1, y + 1, 2, h - 2); px(g, '#e0b040', x0 + w - 3, y + 1, 2, h - 2);
  g.font = FONT; g.textBaseline = 'top';
  const tw = textW(g, label), tx = Math.round(x0 + (w - tw) / 2);
  g.fillStyle = '#7a1818'; g.fillText(label, tx + 1, y + 1);
  g.fillStyle = '#ffffff'; g.fillText(label, tx, y);
}

function drawBoard(g, x0, w, seed) {   // 走廊公告栏
  const r = makeRng(seed);
  px(g, PAL.k, x0, 14, w, 24); px(g, '#c8945a', x0 + 1, 15, w - 2, 22);
  const cols = ['#d4443c', '#3e6ab0', '#4a9a52', '#f2d24a', '#f6a8c4'];
  for (let x = x0 + 4; x < x0 + w - 12; x += 13 + ((r() * 4) | 0)) {
    const h = 10 + ((r() * 8) | 0), y = 17 + ((r() * (18 - h)) | 0);
    px(g, r() < 0.3 ? '#fff4c8' : '#f4efe4', x, y, 11, h);
    px(g, '#b8b0a0', x + 2, y + 3, 7, 1); px(g, '#b8b0a0', x + 2, y + 5, 5, 1);
    px(g, cols[(r() * cols.length) | 0], x + 5, y, 2, 2);
  }
}

// 楼梯：上半往上（越往上越亮），下半往下（越往下越暗）；到顶/到底的那一半用链子拦住
function drawStairs(g, col, side, floor, upLabel) {
  const x = col * 16, w = 48, yMid = STAIR_DOWN[0] * 16, yTop = STAIR_UP[0] * 16, yBot = (STAIR_DOWN[2] + 1) * 16;
  for (let y = yTop; y < yMid; y += 4) {                 // 往上的台阶
    const k = (yMid - y) / (yMid - yTop), shade = Math.round(196 + k * 40);
    g.fillStyle = `rgb(${shade},${shade + 4},${shade - 12})`; g.fillRect(x, y, w, 3);
    g.fillStyle = `rgb(${shade - 36},${shade - 32},${shade - 48})`; g.fillRect(x, y + 3, w, 1);
  }
  for (let y = yMid; y < yBot; y += 4) {                 // 往下的台阶
    const k = (y - yMid) / (yBot - yMid), shade = Math.round(170 - k * 80);
    g.fillStyle = `rgb(${shade},${shade + 6},${shade - 10})`; g.fillRect(x, y, w, 3);
    g.fillStyle = `rgb(${shade - 40},${shade - 34},${shade - 50})`; g.fillRect(x, y + 3, w, 1);
  }
  // 中间的隔墙 + 扶手，靠墙一侧也有扶手
  px(g, PAL.k, x, yMid - 1, w, 3); px(g, '#9aa0ac', x, yMid, w, 1);
  const rx = side === 'L' ? x : x + w - 3;
  px(g, PAL.k, rx, yTop, 3, yBot - yTop); px(g, '#9aa0ac', rx + 1, yTop, 1, yBot - yTop);
  px(g, PAL.k, x, yBot - 1, w, 2);
  // 地上的箭头和楼层
  const arrow = (cx, cy, up, label) => {
    g.fillStyle = 'rgba(255,255,255,0.75)';
    for (let i = 0; i < 4; i++) g.fillRect(cx - i, up ? cy + i : cy + 3 - i, i * 2 + 1, 1);
    g.fillRect(cx - 1, up ? cy + 4 : cy - 3, 3, 3);
    g.font = FONT; g.textBaseline = 'top'; g.fillStyle = 'rgba(255,255,255,0.85)'; g.fillText(label, cx + 6, cy - 4);
  };
  const cx = x + (side === 'L' ? 18 : 14);
  const chain = (y) => {                                  // 拦路的链子
    px(g, PAL.k, x + 4, y - 6, 3, 12); px(g, PAL.k, x + w - 7, y - 6, 3, 12);
    for (let i = x + 7; i < x + w - 7; i += 4) px(g, (i >> 2) % 2 ? '#d4443c' : '#f4efe4', i, y - 1, 4, 2);
  };
  if (upLabel) arrow(cx, yTop + 18, true, upLabel); else chain(yTop + 24);
  if (floor > 1) arrow(cx, yMid + 20, false, (floor - 1) + 'F'); else chain(yMid + 24);
}

function renderHallway(A, floor) {
  const c = makeCanvas(HW * 16, HH * 16), g = c.getContext('2d'), r = makeRng(99);
  const FLOOR_Y0 = 48, FLOOR_Y1 = HALL_WIN_ROW * 16;

  // 地板
  for (let y = 3; y < HALL_WIN_ROW; y++) for (let x = 1; x < HW - 1; x++) g.drawImage(A.floor[(r() * 3) | 0], x * 16, y * 16);
  // 地板上窗户的倒影（亮条）
  for (let x = 24; x < HW * 16; x += 64) { px(g, 'rgba(255,255,255,0.18)', x, FLOOR_Y1 - 30, 24, 26); px(g, 'rgba(255,255,255,0.12)', x + 4, FLOOR_Y1 - 60, 16, 28); }

  // ---- 两头的楼梯 ----
  drawStairs(g, STAIRS.L, 'L', floor, stairsUp(floor, 'L') && stairsUp(floor, 'L').label);
  drawStairs(g, STAIRS.R, 'R', floor, stairsUp(floor, 'R') && stairsUp(floor, 'R').label);

  // ---- 上墙 ----
  px(g, WALL, 0, 0, HW * 16, 48);
  px(g, TRIM, 0, 0, HW * 16, 2);
  px(g, HALL_LOWER, 0, 30, HW * 16, 14); px(g, '#a0ac98', 0, 30, HW * 16, 1);
  px(g, TRIM, 0, 44, HW * 16, 4);
  const F = FLOORS[floor];
  // 气窗（门、牌子、公告栏以外的地方）
  const taken = new Set([30, 31, ...PAINTING_COLS, ...PAINTING_COLS_L, ...(BANNER_COLS[floor] || []), ...(HALL_EXTRA[floor] ? HALL_EXTRA[floor].cols : [])]);
  for (const rm of F.rooms) for (const pair of roomDoors(rm)) for (const x of pair) taken.add(x);
  for (const [a0, b0] of F.boards) for (let x = a0; x <= b0; x++) taken.add(x);
  for (let x = 6; x < STAIRS.R - 1; x++) {
    if (taken.has(x)) continue;
    px(g, '#9aa0ac', x * 16 + 1, 5, 14, 9); px(g, '#cfe8f2', x * 16 + 2, 6, 12, 7); px(g, '#ffffff', x * 16 + 3, 7, 3, 1);
  }
  // 门 + 房间牌子
  for (const rm of F.rooms) {
    for (const pair of roomDoors(rm)) drawWallDoor(g, pair[0] * 16, 32, rm.metal);
    drawSign(g, roomDoors(rm)[0][1] * 16, roomSign(rm));
  }
  // 公告栏
  F.boards.forEach(([a0, b0], i) => drawBoard(g, a0 * 16 + 4, (b0 - a0 + 1) * 16 - 8, i + 1));
  // 右边楼梯旁的挂画（每层一幅，按《奥德赛》的航程）
  drawPainting(g, PAINTING_COLS[0] * 16 + 2, 6, 60, 34, ODYSSEY[floor].kind);
  if (ODYSSEY_BACK[floor]) drawPainting(g, PAINTING_COLS_L[0] * 16 + 2, 6, 60, 34, ODYSSEY_BACK[floor].kind);
  const ex = HALL_EXTRA[floor];
  if (ex) drawPainting(g, ex.cols[0] * 16 + 2, 6, 60, 34, ex.art.kind);
  if (BANNER[floor]) drawBanner(g, BANNER_COLS[floor][0] * 16, BANNER_COLS[floor].length * 16, BANNER[floor]);
  // 洗手台上方的镜子
  px(g, PAL.k, 30 * 16 + 3, 8, 26, 20); px(g, '#c8dce4', 30 * 16 + 4, 9, 24, 18); px(g, '#eef6fa', 30 * 16 + 6, 11, 3, 10);
  // ---- 左右墙 ----
  px(g, WALL_SIDE, 0, FLOOR_Y0, 16, FLOOR_Y1 - FLOOR_Y0); px(g, '#b8ae98', 15, FLOOR_Y0, 1, FLOOR_Y1 - FLOOR_Y0);
  const RX = (HW - 1) * 16;
  px(g, WALL_SIDE, RX, FLOOR_Y0, 16, FLOOR_Y1 - FLOOR_Y0); px(g, '#b8ae98', RX, FLOOR_Y0, 1, FLOOR_Y1 - FLOOR_Y0);

  // ---- 下墙：朝中庭的窗户（只看得到窗台和一条玻璃）----
  px(g, '#5a4a3a', 0, FLOOR_Y1, HW * 16, 16);
  px(g, '#d8d0bc', 16, FLOOR_Y1, (HW - 2) * 16, 3);
  px(g, '#a8d8ee', 16, FLOOR_Y1 + 3, (HW - 2) * 16, 8);
  for (let x = 16; x < (HW - 1) * 16; x += 48) { px(g, '#9aa0ac', x, FLOOR_Y1 + 3, 2, 8); px(g, '#d8f0fa', x + 6, FLOOR_Y1 + 4, 10, 1); }

  // ---- 窗外的中庭：草地、花坛、樱花树 ----
  const CY0 = FLOOR_Y1 + 16;
  for (let y = HALL_WIN_ROW + 1; y < HH; y++) for (let x = 0; x < HW; x++) g.drawImage(A.grass[(r() * 4) | 0], x * 16, y * 16);
  px(g, 'rgba(20,40,10,0.3)', 0, CY0, HW * 16, 4);                           // 墙的影子
  for (const [bx, bw] of [[8, 12], [36, 14], [58, 8]]) {                       // 砖砌花坛 + 郁金香
    const X = bx * 16, Y = CY0 + 10, W2 = bw * 16, H2 = 22;
    px(g, PAL.k, X - 1, Y - 1, W2 + 2, H2 + 2); px(g, '#b0643c', X, Y, W2, H2);
    for (let i = X; i < X + W2; i += 8) px(g, '#8a4a2a', i, Y, 1, H2);
    px(g, '#6a4430', X + 3, Y + 3, W2 - 6, H2 - 6);
    for (let i = X + 5; i < X + W2 - 5; i += 5) {
      const col = ['#e04858', '#f2d24a', '#f6a8c4', '#f4efe4'][(r() * 4) | 0], ty = Y + 6 + ((r() * 8) | 0);
      px(g, PAL.leafDark, i + 1, ty + 2, 1, 4); px(g, PAL.leaf, i + 2, ty + 3, 1, 2);
      px(g, col, i, ty, 3, 3); px(g, 'rgba(0,0,0,0.2)', i, ty + 2, 3, 1);
    }
  }
  for (const [tx, seed] of [[3, 1], [26, 2], [53, 3], [68, 1], [74, 2]]) {             // 中庭的樱花树
    const t = spriteTree(900 + seed, 'sakura');
    px(g, 'rgba(20,40,10,0.25)', tx * 16 - 4, HH * 16 - 6, 24, 4);
    g.drawImage(t, tx * 16 - 8, HH * 16 - t.height + 2);
  }

  // 窗外照进来的阳光（从下往右上斜）
  g.fillStyle = 'rgba(255,236,170,0.16)';
  for (let x = 40; x < HW * 16; x += 96) {
    g.beginPath();
    g.moveTo(x, FLOOR_Y1); g.lineTo(x + 40, FLOOR_Y1); g.lineTo(x + 90, FLOOR_Y1 - 90); g.lineTo(x + 50, FLOOR_Y1 - 90);
    g.closePath(); g.fill();
  }
  return c;
}

// 每层楼的文字和人物
const HALL_TEXT = {
  1: {
    boards: ['公告栏：『新生欢迎会』\n『高一是基础，现在松一天，高三补十天』', '公告栏：『月考成绩排名（全年级）』\n红笔在最后十名下面划了线。',
      '保健室前的公告栏：『轻伤不下火线』\n『课间十分钟，也是别人在追赶你的十分钟』'],
  },
  2: {
    boards: ['公告栏：『文化祭实行委员 募集中』\n旁边压着一张更大的：『两眼一睁，开始竞争』', '公告栏：『期中考试倒计时 12 天』\n『今天不为学习买单，明天就为生活买单』',
      '职员室前的公告栏：『月考光荣榜』『月考耻辱榜』\n两张纸并排贴着，同样大。'],
  },
  3: {
    boards: ['公告栏：『第三次模拟考试 成绩分布』\n『提高一分，干掉一万人』', '公告栏：『毕业旅行 意见征集』——被一张纸盖住了：\n『高考结束前，一切活动暂停』',
      '图书室前的公告栏：『本月推荐图书：〈五年高考三年模拟〉』\n『宁可血流成河，也不落榜一个』'],
  },
  4: {
    boards: ['公告栏：『电脑室使用守则：进门请换拖鞋』\n下面贴着：『学不死，就往死里学』', '公告栏：『校长致辞：把青春献给分数，把分数献给未来』\n『本月优秀班级：2年A班』'],
  },
};

const HALL_NPCS = {
  1: [
    { name: '一年级·健一', look: LOOK.gakuran('#6a4430', '#4a2c20'), x: 20, y: 6, dir: 'right', area: [8, 4, 56, 8],
      lines: ['学、学长好！', '我刚入学，学校太大了，老是迷路……'] },
    { name: '一年级·千鹤', look: LOOK.sailor('#2a2438', '#1a1428'), x: 60, y: 4, dir: 'up',
      lines: ['保健室的老师好像去职员室了……', '我只是想要一个创可贴而已嘛。'] },
  ],
  2: [
    { name: '体育老师·田中', look: LOOK.jersey, x: 20, y: 7, dir: 'left', area: [8, 5, 56, 7],
      lines: ['喂！走廊里不许跑！……哦，是转学生啊。', '我是教体育的田中。有空来参观一下篮球部吧！'] },
    { name: '翔太', look: LOOK.gakuran('#2a2424', '#1a1414'), x: 44, y: 8, dir: 'right',
      lines: ['听说职员室的森老师特别严格。', '上次有人在走廊吃炒面面包，被罚抄了十遍校规……'] },
    { name: '由美', look: LOOK.sailor('#8a4a2a', '#6a3418'), x: 45, y: 8, dir: 'left',
      lines: ['2B 的人去上体育课了，走廊好安静呢。', '你是 2A 的转学生吧？以后在走廊见啦～'] },
    { name: '齐木', look: { ...LOOK.gakuran('#f07aa8', '#c04a80'), pins: '#ff8ec0' }, x: 17, y: 3, dir: 'up',
      lines: ['……', '（他只是看了公告栏一眼，什么也没说。）', '你刚才在心里想的，我都听见了。\n……别说出去。'] },
  ],
  4: [
    { name: '信息老师·北村', look: { hair: '#3a3a3a', hairDark: '#242424', cloth: '#4a7a6a', clothDark: '#36584e', pants: '#3e4250', collar: '#f4efe4', shoes: '#2e2a2a' },
      x: 20, y: 6, dir: 'down', area: [10, 4, 40, 7],
      lines: ['电脑室的钥匙……我明明放在口袋里的。', '四楼很安静吧？这层都是专用教室和办公室。'] },
    { name: '校工·大叔', look: { hair: '#8a8a8a', hairDark: '#5e5e5e', cloth: '#6a6a4a', clothDark: '#4e4e34', pants: '#4a4a3a', collar: '#d8d4c0', shoes: '#3a3028' },
      x: 50, y: 8, dir: 'left',
      lines: ['校长室要打扫了，学生别乱进去啊。', '天台的钥匙？那个不归我管哦。'] },
  ],
  3: [
    { name: '三年级·真司', look: LOOK.gakuran('#3a3a4a', '#24242e'), x: 44, y: 6, dir: 'down',
      lines: ['……单词……单词……', '啊，二年级的？趁现在好好玩吧，到了三年级就只剩考试了。'] },
    { name: '三年级·凛', look: LOOK.sailor('#1a1a2a', '#0e0e18'), x: 66, y: 4, dir: 'up',
      lines: ['图书室今天居然闭馆……我的参考书还在里面。', '你知道吗？天台的门一直是锁着的。\n听说……以前发生过什么事。'] },
  ],
};

function buildHallway(floor) {
  const F = FLOORS[floor], T = HALL_TEXT[floor];
  const A = { floor: [0, 1, 2].map(i => hallFloorTile(40 + i)), grass: [0, 1, 2, 3].map(i => tileGrass(100 + i)) };
  const d = sceneBuilder(HW, HH);
  d.id = F.id; d.name = F.name; d.bg = renderHallway(A, floor);
  d.camY = 'top';   // 上墙有班级牌，镜头贴顶

  for (let x = 0; x < HW; x++) { d.setSolid(x, 0); d.setSolid(x, 1); d.setSolid(x, 2); for (let y = HALL_WIN_ROW; y < HH; y++) d.setSolid(x, y); }
  for (let y = 0; y < HH; y++) { d.setSolid(0, y); d.setSolid(HW - 1, y); }

  // ---- 门 ----
  for (const rm of F.rooms) {
    if (rm.cls) {                       // 教室：前后两扇门，开放了才能进
      const C = CLASSES[rm.cls];
      d.entries[rm.cls + '_front'] = { x: rm.pos.front[0], y: 3, dir: 'down' };
      d.entries[rm.cls + '_back'] = { x: rm.pos.back[1], y: 3, dir: 'down' };
      for (const [xs, entry] of [[rm.pos.front, 'front'], [rm.pos.back, 'back']]) for (const x of xs) {
        if (C.open) d.exit(x, 2, classSceneId(rm.cls), entry);
        else d.spot(x, 2, '', C.locked);
      }
    } else {                            // 只有一扇门的房间
      const door = rm.doors[0];
      d.entries[rm.key + '_door'] = { x: door[0], y: 3, dir: 'down' };
      for (const x of door) {
        if (rm.scene) d.exit(x, 2, rm.scene, 'door');
        else d.spot(x, 2, '', rm.locked);
      }
    }
  }

  // ---- 楼梯：上半往上、下半往下 ----
  for (const side of ['L', 'R']) {
    const col = STAIRS[side], nearX = side === 'L' ? col + 3 : col - 1, face = side === 'L' ? 'right' : 'left';
    d.entries[side + '_fromBelow'] = { x: nearX, y: STAIR_DOWN[1], dir: face };   // 从楼下上来：站在“往下”那一半旁边
    d.entries[side + '_fromAbove'] = { x: nearX, y: STAIR_UP[1], dir: face };     // 从楼上下来：站在“往上”那一半旁边
    for (let x = col; x < col + 3; x++) {
      const up = stairsUp(floor, side);
      for (const y of STAIR_UP) {
        if (up) d.exit(x, y, up.to, up.entry);
        else { d.setSolid(x, y); d.spot(x, y, '', '这道楼梯上不去了。\n拦着链子，挂着“禁止入内”的牌子。'); }
      }
      for (const y of STAIR_DOWN) {
        if (floor > 1) d.exit(x, y, FLOORS[floor - 1].id, side + '_fromAbove');
        else { d.setSolid(x, y); d.spot(x, y, '', '往下走出去就是操场（室外）。\n（操场还没做）'); }
      }
      d.spot(x, 2, '', `楼梯。现在是 ${floor} 楼。`);
    }
  }

  // ---- 墙上的东西 ----
  F.boards.forEach(([a0, b0], i) => { for (let x = a0; x <= b0; x++) d.spot(x, 2, '', T.boards[i]); });
  for (const x of PAINTING_COLS) d.spot(x, 2, '', paintingText(ODYSSEY[floor]));
  if (ODYSSEY_BACK[floor]) for (const x of PAINTING_COLS_L) d.spot(x, 2, '', paintingText(ODYSSEY_BACK[floor]));
  if (HALL_EXTRA[floor]) for (const x of HALL_EXTRA[floor].cols) d.spot(x, 2, '', paintingText(HALL_EXTRA[floor].art));
  if (BANNER[floor]) for (const x of BANNER_COLS[floor]) d.spot(x, 2, '', `拉在墙上的红色横幅：『${BANNER[floor]}』\n数字是用白纸贴上去的，每天换一张。\n下面那张的边角还露在外面。`);
  for (let x = 6; x < STAIRS.R - 1; x++) if (!d.spots.has(x + ',2')) d.spot(x, 2, '', '房间的气窗。能听到里面隐约的说话声。');
  for (let x = 1; x < HW - 1; x++) d.spot(x, HALL_WIN_ROW, '', '窗外是中庭。花坛里的郁金香开了，\n几个一年级生在长椅上吃便当。');

  // ---- 家具 ----
  const ext = spriteExtinguisher();
  for (const x of [5, 66]) { d.prop(x, 3, ext); d.setSolid(x, 3); d.spot(x, 3, '', '灭火器。上面贴着上次检查的日期。'); }
  const sink = spriteSink();
  d.props.push({ img: sink, x: 30 * 16, y: 4 * 16 - sink.height, base: 4 * 16 - 1 });
  for (const x of [30, 31]) { d.setSolid(x, 3); d.spot(x, 3, '', '洗手台。水龙头上挂着一个柠檬形状的肥皂网。'); d.spot(x, 2, '', '镜子。你整理了一下衣领。'); }
  const bench = spriteBench();
  d.props.push({ img: bench, x: 40 * 16, y: 10 * 16 - bench.height, base: 10 * 16 - 1 });
  for (const x of [40, 41, 42]) { d.setSolid(x, 9); d.spot(x, 9, '', '走廊的长椅。坐上去会发出嘎吱声。'); }
  const plant = spritePlant(), trash = spriteTrash();
  for (const x of [15, 34, 57]) { d.prop(x, 9, plant); d.setSolid(x, 9); d.spot(x, 9, '', '走廊里的盆栽。叶子擦得亮亮的。'); }
  d.prop(29, 9, trash); d.setSolid(29, 9); d.spot(29, 9, '', '垃圾桶。旁边贴着“请垃圾分类”。');

  d.npcs = HALL_NPCS[floor];
  return d;
}
