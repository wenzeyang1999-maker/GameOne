// ============================================================
//  五楼：只有右边的楼梯能上来
//    landing5  —— 楼梯口的小平台，上面只有一扇门
//    auditorium —— 门后面的小礼堂（舞台 + 观众席）
// ============================================================

const L5W = 24, L5H = 14;
const L5_X0 = 6, L5_X1 = 17, L5_Y0 = 3, L5_Y1 = 12;   // 平台的范围
const L5_DOOR = [10, 11];                              // 上墙的门（通往小礼堂）
const L5_STAIR = [15, 16, 17];                         // 往下回四楼的楼梯

const AW = 24, AH = 14;
const A_X0 = 2, A_X1 = 21, A_Y0 = 3, A_Y1 = 12;
const A_DOOR = [11, 12];                               // 下墙的门（回到平台）
const SEAT_ROWS = [8, 10, 12], SEAT_COLS = [4, 5, 6, 7, 9, 10, 13, 14, 16, 17, 18, 19];

// ---------------- 家具 ----------------
function spriteHallSeat() {          // 礼堂的折叠椅（朝上，面对舞台）16x18
  const c = makeCanvas(16, 18), g = c.getContext('2d'), K = PAL.k;
  px(g, K, 2, 2, 12, 6); px(g, '#8a4a52', 3, 3, 10, 4); px(g, '#a45e66', 3, 3, 10, 1);   // 座面
  px(g, K, 2, 7, 12, 8); px(g, '#6a343c', 3, 8, 10, 6); px(g, '#8a4a52', 3, 8, 10, 1);   // 椅背
  px(g, K, 3, 14, 2, 4); px(g, K, 11, 14, 2, 4);
  return c;
}

function spritePodium() {            // 讲台 16x24
  const c = makeCanvas(16, 24), g = c.getContext('2d'), K = PAL.k;
  px(g, K, 1, 0, 14, 8); px(g, '#a8744c', 2, 1, 12, 6); px(g, '#c08a5a', 2, 1, 12, 1);
  px(g, '#f4efe4', 5, 3, 6, 3);                                              // 讲稿
  px(g, K, 3, 8, 10, 16); px(g, '#8a5a3a', 4, 9, 8, 14); px(g, '#6a4428', 4, 9, 8, 2);
  px(g, '#e0b040', 6, 14, 4, 3);                                             // 校徽
  return c;
}

// 三角钢琴 48x44（从斜上方看：弯曲的琴身 + 打开的琴盖 + 前面的琴凳）
function spritePiano() {
  const c = makeCanvas(48, 44), g = c.getContext('2d'), K = PAL.k;
  const BODY = '#241f2a', TOP = '#342d3c', LIT = '#4e455a';
  // 琴身：每一行的右边界，拼出三角钢琴的弧形轮廓
  const edge = [28, 30, 33, 36, 39, 41, 43, 44, 45, 45, 45, 44, 43, 42, 40, 38, 35, 32, 29, 27];
  edge.forEach((w, i) => {
    const y = 4 + i;
    px(g, K, 3, y, w - 2, 1);
    px(g, i < 3 ? TOP : BODY, 4, y, w - 4, 1);
    if (i > 1 && i < 16) px(g, LIT, 6, y, 2, 1);                 // 侧面的高光
  });
  px(g, K, 3, 3, 27, 1);                                          // 上边缘
  // 琴盖的接缝和金色合页
  for (let i = 2; i < 18; i++) px(g, '#171320', 8 + i, 6 + i, 1, 1);
  px(g, '#e0b040', 10, 8, 2, 1); px(g, '#e0b040', 24, 22, 2, 1);
  // 琴键（前方，稍微探出琴身）
  px(g, K, 2, 24, 28, 9);
  px(g, '#f4efe4', 3, 25, 26, 6); px(g, '#d8d2c4', 3, 30, 26, 1);
  for (let x = 5; x < 28; x += 3) px(g, '#141018', x, 25, 1, 4);  // 黑键
  px(g, K, 2, 33, 28, 2);
  // 支起来的琴盖（沿着上边缘的一条亮带 + 支撑杆）
  px(g, K, 5, 1, 26, 3); px(g, LIT, 6, 2, 24, 1);
  for (let i = 0; i < 12; i++) px(g, i % 2 ? LIT : TOP, 30 + i, 2 + ((i * 0.6) | 0), 1, 2);
  px(g, '#8a7a60', 34, 6, 1, 7);                                  // 支撑杆
  // 琴腿和踏板
  px(g, K, 6, 32, 3, 5); px(g, K, 33, 21, 3, 5);
  px(g, '#e0b040', 14, 35, 3, 3); px(g, K, 13, 34, 5, 1);
  px(g, 'rgba(20,10,20,0.22)', 6, 36, 32, 2);                     // 地上的影子
  // 琴凳
  px(g, K, 8, 38, 18, 6); px(g, '#6a4a34', 9, 39, 16, 3); px(g, '#8a6446', 9, 39, 16, 1);
  px(g, K, 10, 42, 2, 2); px(g, K, 22, 42, 2, 2);
  return c;
}

// 舞台后墙上的巨幅古典挂画：《最后的晚餐》
function drawLastSupper(g, X, Y, W, H) {
  const K = PAL.k;
  // 画框（金色，带一圈内衬）
  px(g, K, X - 2, Y - 2, W + 4, H + 4);
  px(g, '#8a6a22', X - 1, Y - 1, W + 2, H + 2);
  px(g, '#d8b048', X, Y, W, H); px(g, '#f0d488', X, Y, W, 1); px(g, '#f0d488', X, Y, 1, H);
  px(g, '#a07c26', X, Y + H - 1, W, 1); px(g, '#a07c26', X + W - 1, Y, 1, H);
  for (let x = X + 3; x < X + W - 3; x += 6) { px(g, '#a07c26', x, Y + 1, 2, 1); px(g, '#a07c26', x, Y + H - 2, 2, 1); }
  px(g, K, X + 4, Y + 4, W - 8, H - 8);
  // 画面本体
  const x0 = X + 5, y0 = Y + 5, w = W - 10, h = H - 10, cx = x0 + (w >> 1);
  px(g, '#33291f', x0, y0, w, h);                                  // 昏暗的餐厅
  px(g, '#241c16', x0, y0, w, 3);
  for (let i = 0; i < 3; i++) {                                    // 天花板的透视线
    px(g, '#453626', x0 + 6 + i * 5, y0 + 2 + i * 2, w - 12 - i * 10, 1);
  }
  for (let i = 0; i < 12; i++) {                                   // 两侧墙壁的透视
    px(g, '#3d3024', x0 + i, y0 + 2 + i, 1, h - 6 - i * 2);
    px(g, '#3d3024', x0 + w - 1 - i, y0 + 2 + i, 1, h - 6 - i * 2);
  }
  px(g, '#2b2219', x0, y0 + h - 12, w, 12);                        // 前景的暗部
  // 后墙的三扇窗（中间那扇最大，耶稣就在窗前）
  const win = (wx, ww, wh) => {
    const wy = y0 + 4;
    px(g, '#1d1710', wx - 1, wy - 1, ww + 2, wh + 2);
    px(g, '#8fb2c2', wx, wy, ww, wh);
    px(g, '#c2dae2', wx, wy, ww, 2); px(g, '#6e94a6', wx, wy + wh - 2, ww, 2);
    px(g, '#1d1710', wx, wy, 1, 1); px(g, '#1d1710', wx + ww - 1, wy, 1, 1);           // 圆拱的角
    px(g, '#7aa08a', wx + 1, wy + wh - 4, ww - 2, 2);                                   // 窗外的风景
    px(g, '#5a7a6a', wx + 2, wy + wh - 5, 3, 1); px(g, '#5a7a6a', wx + ww - 6, wy + wh - 5, 3, 1);
  };
  win(cx - 9, 18, 14); win(cx - 26, 11, 11); win(cx + 15, 11, 11);
  // 桌子
  const ty = y0 + h - 9;
  px(g, K, x0 + 4, ty, w - 8, 7);
  px(g, '#e6dfcc', x0 + 5, ty + 1, w - 10, 5); px(g, '#f4efe0', x0 + 5, ty + 1, w - 10, 1);
  px(g, '#bfb6a0', x0 + 5, ty + 5, w - 10, 1);
  for (let x = x0 + 9; x < x0 + w - 9; x += 7) { px(g, '#cfc7b0', x, ty + 2, 3, 2); px(g, '#a89e86', x + 1, ty + 3, 1, 1); }
  // 13 个人：中间是耶稣，两边各两组三人
  const person = (px0, robe, cloak, lean) => {
    const top = ty - 13;
    px(g, '#2a2018', px0 - 1, top, 6, 13);
    px(g, robe, px0, top + 4, 4, 9); px(g, cloak, px0 + (lean > 0 ? 2 : 0), top + 4, 2, 9);
    px(g, '#3a2a1e', px0, top, 4, 3);                               // 头发
    px(g, '#e0bb92', px0 + 1, top + 1, 2, 3);                       // 脸
    px(g, robe, px0 - 1 + (lean < 0 ? -1 : 3), top + 6, 2, 3);      // 伸出去的手臂
  };
  const ROBES = [['#8a4a2a', '#4a6a5a'], ['#4a5a8a', '#8a7a3a'], ['#6a3a4a', '#3a5a4a'], ['#7a6a3a', '#4a3a5a'],
    ['#3a5a6a', '#8a5a3a'], ['#8a3a3a', '#4a4a6a'], ['#5a4a3a', '#6a6a4a'], ['#4a6a4a', '#7a4a3a'],
    ['#6a5a7a', '#3a4a5a'], ['#7a3a4a', '#5a6a3a'], ['#3a4a6a', '#7a5a4a'], ['#6a4a5a', '#4a5a3a']];
  const spots = [-64, -58, -52, -38, -32, -26, 26, 32, 38, 52, 58, 64];   // 像原画一样，三人一组分成四组
  spots.forEach((dx, i) => person(cx + dx, ROBES[i][0], ROBES[i][1], dx < 0 ? -1 : 1));
  // 耶稣：红袍蓝披风，双手摊开
  const jt = ty - 14;
  px(g, '#2a2018', cx - 4, jt, 8, 14);
  px(g, '#a8323c', cx - 3, jt + 4, 6, 10);
  px(g, '#3a5a9a', cx - 3, jt + 4, 2, 10); px(g, '#3a5a9a', cx + 1, jt + 4, 2, 10);
  px(g, '#5a4028', cx - 3, jt, 6, 4); px(g, '#e8c49a', cx - 2, jt + 1, 4, 4);
  px(g, '#a8323c', cx - 6, jt + 7, 3, 2); px(g, '#a8323c', cx + 3, jt + 7, 3, 2);
  px(g, 'rgba(255,240,190,0.25)', cx - 6, jt - 2, 12, 6);           // 头顶淡淡的光
}

// ---------------- 五楼平台 ----------------
function renderLanding5() {
  const c = makeCanvas(L5W * 16, L5H * 16), g = c.getContext('2d'), r = makeRng(17);
  const X0 = L5_X0 * 16, X1 = (L5_X1 + 1) * 16, Y0 = L5_Y0 * 16, Y1 = (L5_Y1 + 1) * 16;
  px(g, '#141019', 0, 0, L5W * 16, L5H * 16);
  const tiles = [0, 1, 2].map(i => hallFloorTile(120 + i));
  for (let y = L5_Y0; y <= L5_Y1; y++) for (let x = L5_X0; x <= L5_X1; x++) g.drawImage(tiles[(r() * 3) | 0], x * 16, y * 16);

  // 往下回四楼的楼梯（越往下越暗）
  const sx = L5_STAIR[0] * 16, sw = 48, sy0 = 4 * 16, sy1 = 10 * 16;
  for (let y = sy0; y < sy1; y += 4) {
    const k = (y - sy0) / (sy1 - sy0), shade = Math.round(170 - k * 80);
    g.fillStyle = `rgb(${shade},${shade + 6},${shade - 10})`; g.fillRect(sx, y, sw, 3);
    g.fillStyle = `rgb(${shade - 40},${shade - 34},${shade - 50})`; g.fillRect(sx, y + 3, sw, 1);
  }
  px(g, PAL.k, sx + sw - 3, sy0, 3, sy1 - sy0); px(g, '#9aa0ac', sx + sw - 2, sy0, 1, sy1 - sy0);
  px(g, PAL.k, sx, sy0 - 1, sw, 2); px(g, PAL.k, sx, sy1 - 1, sw, 2);
  const ay = sy0 + 26;                                   // 地上的“↓4F”
  g.fillStyle = 'rgba(255,255,255,0.75)';
  g.fillRect(sx + 17, ay - 4, 3, 4);
  for (let i = 3; i >= 0; i--) g.fillRect(sx + 18 - i, ay + 3 - i, i * 2 + 1, 1);
  g.font = FONT; g.textBaseline = 'top'; g.fillStyle = 'rgba(255,255,255,0.85)'; g.fillText('4F', sx + 24, ay - 4);

  // 上墙 + 门 + 牌子
  px(g, WALL, X0 - 16, 0, X1 - X0 + 32, 48);
  px(g, TRIM, X0 - 16, 0, X1 - X0 + 32, 2);
  px(g, HALL_LOWER, X0 - 16, 30, X1 - X0 + 32, 14); px(g, '#a0ac98', X0 - 16, 30, X1 - X0 + 32, 1);
  px(g, TRIM, X0 - 16, 44, X1 - X0 + 32, 4);
  drawWallDoor(g, L5_DOOR[0] * 16, 32, false);
  drawSign(g, L5_DOOR[1] * 16, '小礼堂');
  // 侧墙、下墙
  px(g, WALL_SIDE, X0 - 16, Y0, 16, Y1 - Y0); px(g, '#b8ae98', X0 - 1, Y0, 1, Y1 - Y0);
  px(g, '#5a4a3a', X0 - 16, Y1, X1 - X0 + 32, 16); px(g, '#7a6a58', X0 - 16, Y1, X1 - X0 + 32, 2);
  // 楼梯旁的第五幅画：冥府问亡
  drawPainting(g, 13 * 16, 6, 60, 32, ODYSSEY[5].kind);
  // 原本这里开着一扇窗，现在被一幅画堵上了
  drawPainting(g, X0 - 10, 6, 58, 34, MURAL.kind);   // 稍微往左，别挤着门
  return c;
}

function buildLanding5() {
  const d = sceneBuilder(L5W, L5H);
  d.id = 'landing5'; d.name = '五楼 楼梯平台'; d.bg = renderLanding5();
  d.camY = 'top';

  for (let y = 0; y < L5H; y++) for (let x = 0; x < L5W; x++)
    if (x < L5_X0 || x > L5_X1 || y < L5_Y0 || y > L5_Y1) d.setSolid(x, y);

  // 门 -> 小礼堂
  for (const x of L5_DOOR) d.exit(x, L5_Y0 - 1, 'auditorium', 'door');
  // 楼梯 -> 四楼（右边那道）
  for (const x of L5_STAIR) for (let y = 4; y <= 9; y++) d.exit(x, y, 'hall4', 'R_fromAbove');
  d.entries.stairs = { x: L5_STAIR[0] - 1, y: 6, dir: 'left' };   // 从四楼上来站在楼梯旁边
  d.entries.door = { x: L5_DOOR[0], y: L5_Y0, dir: 'down' };      // 从小礼堂出来站在门口

  for (let x = L5_X0; x <= L5_X1; x++) d.spot(x, L5_Y0 - 1, '', '五楼只有这一间小礼堂。\n门上的牌子有点旧了。');
  for (let x = 13; x <= 16; x++) d.spot(x, L5_Y0 - 1, '', paintingText(ODYSSEY[5]));
  for (const x of L5_DOOR) d.spots.delete(x + ',' + (L5_Y0 - 1));
  for (const x of [6, 7, 8, 9]) d.spot(x, L5_Y0 - 1, '', paintingText(MURAL));
  for (let y = L5_Y0; y <= L5_Y1; y++) d.spot(L5_X0 - 1, y, '', '墙上有一道细长的裂缝，从地板一直延伸到天花板。\n这一层好像没有窗户。');

  d.prop(L5_X1, L5_Y1, spritePlant()); d.setSolid(L5_X1, L5_Y1); d.spot(L5_X1, L5_Y1, '', '平台角落的盆栽。叶子上积了一层薄灰——\n这里好像很久没人来了。');
  d.prop(L5_X0, L5_Y1, spriteTrash()); d.setSolid(L5_X0, L5_Y1); d.spot(L5_X0, L5_Y1, '', '空荡荡的垃圾桶。');

  d.npcs = [];
  return d;
}

// ---------------- 小礼堂 ----------------
function renderAuditorium() {
  const c = makeCanvas(AW * 16, AH * 16), g = c.getContext('2d'), r = makeRng(23);
  const X0 = A_X0 * 16, X1 = (A_X1 + 1) * 16, Y0 = A_Y0 * 16, Y1 = (A_Y1 + 1) * 16;
  px(g, '#141019', 0, 0, AW * 16, AH * 16);
  // 观众席的地板（深色木地板）
  const floorP = { base: '#9a6a44', dark: '#7a5030', light: '#b07c52', grain: '#8a5c3c' };
  const tiles = [0, 1, 2].map(i => floorTile(130 + i, floorP));
  for (let y = A_Y0; y <= A_Y1; y++) for (let x = A_X0; x <= A_X1; x++) g.drawImage(tiles[(r() * 3) | 0], x * 16, y * 16);
  // 中间的红地毯通道
  px(g, '#7a2230', 11 * 16, Y0, 32, Y1 - Y0); px(g, '#9a2e3c', 11 * 16 + 3, Y0, 26, Y1 - Y0);

  // 舞台（3~6 行，比观众席亮）
  const stY0 = A_Y0 * 16, stY1 = 7 * 16;
  const stageP = { base: '#c89a62', dark: '#a87a46', light: '#dcb07a', grain: '#b88a52' };
  const st = [0, 1, 2].map(i => floorTile(140 + i, stageP));
  for (let y = A_Y0; y < 7; y++) for (let x = 4; x <= 19; x++) g.drawImage(st[(r() * 3) | 0], x * 16, y * 16);
  // 舞台灯光：从上方打下来的两束暖光
  for (const lx of [8 * 16, 15 * 16]) {
    const lg = g.createRadialGradient(lx, stY0 + 6, 4, lx, stY0 + 6, 70);
    lg.addColorStop(0, 'rgba(255,236,170,0.35)'); lg.addColorStop(1, 'rgba(255,236,170,0)');
    g.fillStyle = lg; g.fillRect(lx - 70, stY0, 140, stY1 - stY0);
  }
  px(g, PAL.k, 4 * 16, stY1 - 3, 16 * 16, 3);                       // 舞台前沿
  px(g, '#6a4428', 4 * 16, stY1, 16 * 16, 3);
  px(g, 'rgba(40,20,10,0.25)', 4 * 16, stY1 + 3, 16 * 16, 4);
  for (let x = 10 * 16; x < 14 * 16; x += 16) { px(g, '#b08050', x, stY1, 14, 3); px(g, '#8a5a3a', x, stY1 + 3, 14, 2); }   // 上台的台阶

  // 上墙 + 幕布
  px(g, WALL, X0 - 16, 0, X1 - X0 + 32, 48);
  px(g, TRIM, X0 - 16, 0, X1 - X0 + 32, 4);
  px(g, '#3a2430', X0, 4, X1 - X0, 10);                              // 幕布的横杆
  for (let x = X0; x < X1; x += 6) px(g, '#8a2230', x, 6, 4, 8);
  for (const side of [0, 1]) {                                        // 两侧拉开的幕布
    const bx = side ? X1 - 72 : X0;
    px(g, PAL.k, bx, 4, 72, 44);
    for (let i = 0; i < 72; i += 6) {
      px(g, '#8a2230', bx + i, 5, 4, 42);
      px(g, '#6a1a26', bx + i + 4, 5, 2, 42);
      px(g, '#a83442', bx + i + 1, 5, 1, 42);
    }
    px(g, '#e0b040', bx + (side ? 0 : 66), 26, 6, 4);                 // 系带
  }
  // 幕布中间：后墙 + 巨幅挂画
  px(g, '#4a3a44', X0 + 72, 4, X1 - X0 - 144, 44);
  px(g, '#5e4a58', X0 + 72, 4, X1 - X0 - 144, 2);
  drawLastSupper(g, X0 + 78, 8, X1 - X0 - 156, 38);
  // 侧墙、下墙、门
  px(g, WALL_SIDE, X0 - 16, Y0, 16, Y1 - Y0); px(g, '#b8ae98', X0 - 1, Y0, 1, Y1 - Y0);
  px(g, WALL_SIDE, X1, Y0, 16, Y1 - Y0); px(g, '#b8ae98', X1, Y0, 1, Y1 - Y0);
  px(g, '#5a4a3a', X0 - 16, Y1, X1 - X0 + 32, 16); px(g, '#7a6a58', X0 - 16, Y1, X1 - X0 + 32, 2);
  const dx = A_DOOR[0] * 16;
  px(g, '#8a8e9a', dx, Y1 - 1, 32, 1); px(g, PAL.k, dx, Y1, 32, 16);
  px(g, '#a87a4a', dx + 1, Y1 + 1, 30, 14); px(g, '#c09060', dx + 1, Y1 + 1, 30, 2);
  px(g, '#a8d8ee', dx + 6, Y1 + 5, 20, 5); px(g, '#4a3a2a', dx + 24, Y1 + 8, 2, 4);
  return c;
}

function buildAuditorium() {
  const d = sceneBuilder(AW, AH);
  d.id = 'auditorium'; d.name = '小礼堂'; d.bg = renderAuditorium();

  for (let y = 0; y < AH; y++) for (let x = 0; x < AW; x++)
    if (x < A_X0 || x > A_X1 || y < A_Y0 || y > A_Y1) d.setSolid(x, y);

  // 门 -> 五楼平台
  for (const x of A_DOOR) d.exit(x, A_Y1 + 1, 'landing5', 'door');
  d.entries.door = { x: A_DOOR[0], y: A_Y1, dir: 'up' };

  // 舞台上的东西
  d.prop(11, 5, spritePodium()); d.setSolid(11, 5); d.spot(11, 5, '', '讲台。校长在全校集会时就是站在这里。\n话筒的开关还开着。');
  const piano = spritePiano();
  d.props.push({ img: piano, x: 5 * 16, y: 6 * 16 - piano.height, base: 6 * 16 - 1 });
  for (const x of [5, 6, 7]) { d.setSolid(x, 5); d.spot(x, 5, '', '一架三角钢琴。琴盖开着，琴键上没有灰——\n最近还有人在这里弹过。'); }
  for (const x of [5, 6, 7]) d.spot(x, 4, '', '一架三角钢琴。琴盖开着，琴键上没有灰——\n最近还有人在这里弹过。');
  for (const x of [17, 18]) { d.setSolid(x, 4); d.spot(x, 4, '', '堆在舞台角落的折叠椅和一块旧幕布。'); }
  for (let x = 4; x <= 19; x++) d.spot(x, A_Y0 - 1, '', '舞台的幕布。红色的布有点褪色了，\n拉开的地方露出后面的墙。');
  for (let x = 7; x <= 16; x++) d.spot(x, A_Y0 - 1, '', '舞台后墙上挂着一幅巨大的古典油画——《最后的晚餐》。\n画里的十三个人围着长桌，中间那位摊开双手。\n画框是金色的，边角已经有些发乌了。');

  // 观众席
  const seat = spriteHallSeat();
  for (const y of SEAT_ROWS) for (const x of SEAT_COLS) {
    d.prop(x, y, seat); d.setSolid(x, y);
    d.spot(x, y, '', '礼堂的折叠椅。坐垫已经被坐得有点塌了。');
  }
  d.prop(A_X0, A_Y1, spritePlant()); d.setSolid(A_X0, A_Y1); d.spot(A_X0, A_Y1, '', '礼堂门口的盆栽。');

  d.npcs = [
    { name: '轻音部·遥', look: LOOK.sailor('#6a4a8a', '#4a3060'), x: 8, y: 7, dir: 'right',
      lines: ['诶，有人上来了？五楼平时根本没人来的。', '这里音响效果特别好，我们社团总偷偷来这儿练习。', '……这件事，别告诉老师哦？'] },
  ];
  return d;
}
