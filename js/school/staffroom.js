// ============================================================
//  场景：职员室
//  和教室同一个视角：上墙 = 窗户 + 日程白板，下墙 = 走廊一侧（左下是门）
//  两组“岛型”办公桌：上排老师面朝下坐，下排面朝上坐，每张桌子一台电脑
// ============================================================

const SW = 24, SH = 14;
const SR_DOOR = [4, 5];
const ISLANDS = [[5, 6, 7], [11, 12, 13]];   // 每组办公桌占的列
const ISLAND_ROW = 7;                          // 上排桌子在第 7 行，下排在第 8 行，椅子在 6 / 9 行

// ---------------- 美术 ----------------
function officeFloorTile(seed) {   // 蓝灰色地毯块
  const c = makeCanvas(16, 16), g = c.getContext('2d'), r = makeRng(seed);
  px(g, '#9aa2b0', 0, 0, 16, 16);
  for (let i = 0; i < 26; i++) px(g, r() < 0.5 ? '#8e96a4' : '#a8b0bc', (r() * 16) | 0, (r() * 16) | 0);
  return c;
}

function spriteOfficeChair(backAtTop) {   // 办公转椅 16x20
  const c = makeCanvas(16, 20), g = c.getContext('2d'), K = PAL.k;
  px(g, K, 7, 13, 2, 4);                                              // 气压杆
  px(g, K, 2, 16, 12, 2); px(g, '#4a4e5a', 3, 16, 10, 1);             // 五星脚
  px(g, K, 2, 18, 2, 2); px(g, K, 12, 18, 2, 2); px(g, K, 7, 18, 2, 2);
  if (backAtTop) {        // 老师面朝下坐：椅背在上
    px(g, K, 3, 0, 10, 9); px(g, '#3a3e4a', 4, 1, 8, 7); px(g, '#5a5e6c', 4, 1, 8, 1);
    px(g, K, 2, 8, 12, 6); px(g, '#4a4e5a', 3, 9, 10, 4); px(g, '#62667a', 3, 9, 10, 1);
  } else {                // 老师面朝上坐：看到的是椅背的背面
    px(g, K, 2, 3, 12, 6); px(g, '#4a4e5a', 3, 4, 10, 4);
    px(g, K, 3, 6, 10, 9); px(g, '#3a3e4a', 4, 7, 8, 7); px(g, '#5a5e6c', 4, 7, 8, 1);
  }
  return c;
}

const SCREENS = ['desktop', 'sheet', 'doc', 'saver'];
function drawScreen(g, x, y, w, h, kind, r) {
  if (kind === 'desktop') {
    px(g, '#3a78c8', x, y, w, h);
    for (let i = 0; i < 3; i++) px(g, '#f4efe4', x + 1, y + 1 + i * 2, 1, 1);
    px(g, '#2a4a8a', x, y + h - 1, w, 1);
  } else if (kind === 'sheet') {           // 成绩表
    px(g, '#f4f6f8', x, y, w, h);
    for (let j = y + 1; j < y + h; j += 2) px(g, '#b8c8d8', x, j, w, 1);
    px(g, '#3aa860', x, y, w, 1);
    px(g, '#d4443c', x + 2 + ((r() * (w - 4)) | 0), y + 3, 1, 1);
  } else if (kind === 'doc') {             // 文档
    px(g, '#f4f6f8', x, y, w, h);
    for (let j = y + 1; j < y + h - 1; j += 2) px(g, '#8a94a8', x + 1, j, 3 + ((r() * (w - 5)) | 0), 1);
  } else {                                 // 屏保
    px(g, '#1a1a3a', x, y, w, h);
    for (let i = 0; i < 4; i++) px(g, ['#f2d24a', '#f6a8c4', '#a6ddf2'][i % 3], x + ((r() * w) | 0), y + ((r() * h) | 0), 1, 1);
  }
}

// 上排桌子：老师在北边，显示器屏幕朝北，镜头只看到显示器背面
function spriteDeskNorth(r) {
  const c = makeCanvas(16, 20), g = c.getContext('2d'), K = PAL.k;
  px(g, '#c8ccd2', 0, 0, 16, 20); px(g, '#dde0e4', 0, 0, 16, 1); px(g, '#aab0b8', 0, 0, 1, 20);
  px(g, K, 3, 1, 10, 3); px(g, '#5a5e6c', 4, 2, 8, 1);                 // 键盘
  px(g, K, 2, 4, 12, 11); px(g, '#7a808e', 3, 5, 10, 9); px(g, '#8e94a2', 3, 5, 10, 1);   // 显示器背面
  if (r() < 0.5) { px(g, '#f4efe4', 13, 1, 3, 4); px(g, '#d8d4c8', 13, 4, 3, 1); }         // 文件
  return c;
}

// 下排桌子：老师在南边，镜头能看到屏幕
function spriteDeskSouth(r) {
  const c = makeCanvas(16, 30), g = c.getContext('2d'), K = PAL.k;
  // 桌面 + 前挡板
  px(g, '#c8ccd2', 0, 10, 16, 12); px(g, '#aab0b8', 0, 10, 1, 12); px(g, '#b4b8c0', 0, 21, 16, 1);
  px(g, K, 0, 22, 16, 8); px(g, '#8e94a0', 0, 22, 16, 7); px(g, '#a4aab4', 0, 22, 16, 1);
  px(g, '#6a707c', 2, 25, 5, 1); px(g, '#6a707c', 9, 25, 5, 1);                      // 抽屉
  // 显示器
  px(g, K, 7, 11, 2, 3); px(g, K, 5, 13, 6, 1);                                        // 支架
  px(g, K, 2, 1, 12, 11); px(g, '#2a2e38', 3, 2, 10, 9);
  drawScreen(g, 4, 3, 8, 7, SCREENS[(r() * SCREENS.length) | 0], r);
  // 键盘、鼠标、杯子
  px(g, K, 3, 16, 9, 3); px(g, '#5a5e6c', 4, 17, 7, 1);
  px(g, K, 13, 16, 2, 3); px(g, '#e8ecf0', 13, 17, 1, 1);
  if (r() < 0.5) { px(g, K, 0, 14, 3, 4); px(g, ['#d4443c', '#f4efe4', '#3e6ab0'][(r() * 3) | 0], 1, 15, 1, 2); }
  return c;
}

function spriteVPDesk() {   // 教头的大桌子 32x28（木头，面朝下）
  const c = makeCanvas(32, 28), g = c.getContext('2d'), K = PAL.k;
  px(g, K, 0, 1, 32, 27);
  px(g, '#8a5a3a', 1, 2, 30, 13); px(g, '#a8744c', 1, 2, 30, 1);
  px(g, '#6a4428', 1, 15, 30, 12); px(g, '#5a3a22', 1, 15, 30, 2); px(g, '#7a5232', 4, 19, 24, 6);
  // 名牌、文件、电脑（屏幕朝上，看到背面）
  px(g, K, 11, 11, 10, 4); px(g, '#e0b040', 12, 12, 8, 2);
  px(g, K, 3, 4, 7, 6); px(g, '#f4efe4', 4, 5, 5, 4);
  px(g, K, 20, 2, 10, 8); px(g, '#7a808e', 21, 3, 8, 6);
  return c;
}

function spriteCabinet() {  // 灰色文件柜 16x26
  const c = makeCanvas(16, 26), g = c.getContext('2d'), K = PAL.k;
  px(g, K, 0, 0, 16, 26); px(g, '#b8bcc4', 1, 1, 14, 3); px(g, '#9aa0aa', 1, 4, 14, 21);
  for (const y of [5, 12, 19]) { px(g, '#8a909a', 2, y, 12, 6); px(g, '#c8ccd2', 6, y + 2, 4, 1); px(g, '#f4efe4', 3, y + 1, 3, 2); }
  return c;
}

function spriteCopier() {   // 复印机 16x26
  const c = makeCanvas(16, 26), g = c.getContext('2d'), K = PAL.k;
  px(g, K, 0, 4, 16, 22); px(g, '#e8e8ec', 1, 5, 14, 20); px(g, '#c8c8d0', 1, 12, 14, 1);
  px(g, K, 1, 1, 14, 5); px(g, '#d8d8e0', 2, 2, 12, 3);                // 盖子
  px(g, '#3a3e4a', 2, 7, 6, 3); px(g, '#6ac8f0', 3, 8, 3, 1); px(g, '#f2d24a', 10, 8, 2, 1);
  px(g, '#b8b8c0', 2, 15, 12, 3); px(g, '#b8b8c0', 2, 20, 12, 3);      // 纸盒
  return c;
}

function spriteWaterServer() {   // 饮水机 16x28
  const c = makeCanvas(16, 28), g = c.getContext('2d'), K = PAL.k;
  px(g, K, 4, 0, 8, 10); px(g, '#8ac8ec', 5, 1, 6, 8); px(g, '#c8ecfa', 6, 2, 2, 5);
  px(g, K, 2, 9, 12, 19); px(g, '#f4f4f8', 3, 10, 10, 17);
  px(g, '#d4443c', 5, 14, 2, 2); px(g, '#3e6ab0', 9, 14, 2, 2); px(g, '#b8bcc4', 4, 20, 8, 3);
  return c;
}

function spriteTeaTable() {   // 泡茶的小桌 32x22：电热水壶、茶杯
  const c = makeCanvas(32, 22), g = c.getContext('2d'), K = PAL.k;
  px(g, K, 0, 6, 32, 16); px(g, '#b8845a', 1, 7, 30, 6); px(g, '#8a5a3a', 1, 13, 30, 8);
  px(g, K, 4, 0, 8, 9); px(g, '#e8e8ec', 5, 1, 6, 7); px(g, '#d4443c', 6, 3, 2, 1);   // 热水壶
  for (const x of [15, 20, 25]) { px(g, K, x, 5, 4, 4); px(g, '#f4efe4', x + 1, 6, 2, 2); }   // 茶杯
  return c;
}

function renderStaffroom(A) {
  const c = makeCanvas(SW * 16, SH * 16), g = c.getContext('2d'), r = makeRng(77);
  const FLOOR_Y0 = 48, FLOOR_Y1 = (SH - 1) * 16;
  for (let y = 3; y < SH - 1; y++) for (let x = 1; x < SW - 1; x++) g.drawImage(A.floor[(r() * 3) | 0], x * 16, y * 16);
  // 地毯的接缝（每 2 格一块）
  for (let x = 16; x < (SW - 1) * 16; x += 32) px(g, 'rgba(60,64,80,0.25)', x, FLOOR_Y0, 1, FLOOR_Y1 - FLOOR_Y0);
  for (let y = FLOOR_Y0; y < FLOOR_Y1; y += 32) px(g, 'rgba(60,64,80,0.25)', 16, y, (SW - 2) * 16, 1);

  // ---- 上墙 ----
  px(g, WALL, 0, 0, SW * 16, 48);
  px(g, TRIM, 0, 0, SW * 16, 4); px(g, '#8a6a4a', 0, 3, SW * 16, 1);
  px(g, '#b08a5c', 0, 43, SW * 16, 5); px(g, TRIM, 0, 43, SW * 16, 1);
  // 窗户
  for (const x0 of [40, 98]) {
    const y0 = 9, w = 52, h = 30;
    px(g, PAL.k, x0 - 2, y0 - 2, w + 4, h + 5); px(g, '#9aa0ac', x0 - 1, y0 - 1, w + 2, h + 3);
    const sky = g.createLinearGradient(0, y0, 0, y0 + h);
    sky.addColorStop(0, '#7cc4ec'); sky.addColorStop(1, '#d4eef8');
    g.fillStyle = sky; g.fillRect(x0, y0, w, h);
    px(g, '#ffffff', x0 + 8 + ((r() * 20) | 0), y0 + 5, 12, 3);
    px(g, '#9aa0ac', x0 + (w >> 1) - 1, y0, 2, h);
    for (let x = x0; x < x0 + w; x += 3) px(g, '#e8e4d8', x, y0, 2, 6);          // 百叶窗拉起来的一截
    px(g, '#b8b4a8', x0, y0 + 6, w, 1);
    px(g, '#d8d0bc', x0 - 3, y0 + h + 2, w + 6, 3);
  }
  // 日程白板（本月行事历）
  const bx = 172, by = 7, bw = 124, bh = 34;
  px(g, PAL.k, bx - 2, by - 2, bw + 4, bh + 5); px(g, '#b8bcc4', bx - 1, by - 1, bw + 2, bh + 2);
  px(g, '#f8f8fa', bx, by, bw, bh);
  g.font = FONT; g.textBaseline = 'top'; g.fillStyle = '#2a3a6a'; g.fillText('4月 行事', bx + 3, by + 1);
  for (let i = 0; i <= 7; i++) px(g, '#b8c0d0', bx + 2 + i * 17, by + 14, 1, bh - 16);
  for (let j = 0; j < 3; j++) px(g, '#b8c0d0', bx + 2, by + 14 + j * 7, bw - 4, 1);
  for (let i = 0; i < 9; i++) {
    const col = ['#d4443c', '#3e6ab0', '#3aa860'][(r() * 3) | 0];
    px(g, col, bx + 4 + ((r() * 7) | 0) * 17, by + 16 + ((r() * 3) | 0) * 7, 6 + ((r() * 8) | 0), 1);
  }
  for (const [x, col] of [[60, '#d4443c'], [96, '#f2d24a'], [110, '#3e6ab0']]) px(g, col, bx + x, by + 3, 4, 4);   // 磁铁
  px(g, '#8a8e9a', bx, by + bh + 1, bw, 2);                                                               // 笔槽
  // 时钟
  g.drawImage(fromStrings(CLOCK, { k: PAL.k, w: '#f4efe4' }), 318, 10);
  // 标语
  px(g, PAL.k, 340, 8, 28, 22); px(g, '#f4efe4', 341, 9, 26, 20);
  px(g, '#d4443c', 344, 12, 20, 2); px(g, '#8a94a8', 344, 17, 18, 1); px(g, '#8a94a8', 344, 20, 14, 1); px(g, '#8a94a8', 344, 23, 16, 1);

  // ---- 左右墙 ----
  px(g, WALL_SIDE, 0, FLOOR_Y0, 16, FLOOR_Y1 - FLOOR_Y0); px(g, '#b8ae98', 15, FLOOR_Y0, 1, FLOOR_Y1 - FLOOR_Y0);
  const RX = (SW - 1) * 16;
  px(g, WALL_SIDE, RX, FLOOR_Y0, 16, FLOOR_Y1 - FLOOR_Y0); px(g, '#b8ae98', RX, FLOOR_Y0, 1, FLOOR_Y1 - FLOOR_Y0);

  // ---- 下墙 + 门 ----
  px(g, '#5a4a3a', 0, FLOOR_Y1, SW * 16, 16); px(g, '#7a6a58', 0, FLOOR_Y1, SW * 16, 2);
  const x0 = SR_DOOR[0] * 16, w = 32;
  px(g, '#8a8e9a', x0, FLOOR_Y1 - 1, w, 1);
  px(g, PAL.k, x0, FLOOR_Y1, w, 16);
  px(g, '#9aa0ac', x0 + 1, FLOOR_Y1 + 1, w - 2, 14); px(g, '#b8bec8', x0 + 1, FLOOR_Y1 + 1, w - 2, 2);   // 金属门
  px(g, '#a8d8ee', x0 + 6, FLOOR_Y1 + 5, w - 12, 5);
  px(g, '#4a3a2a', x0 + w - 8, FLOOR_Y1 + 8, 2, 4);
  return c;
}

// ---------------- 布局 ----------------
const TEACHERS = ['森', '小野', '佐佐木', '白石', '高田', '中岛', '冈本', '西村', '藤井', '青木', '村上', '石川'];

function buildStaffroom() {
  const A = { floor: [0, 1, 2].map(i => officeFloorTile(60 + i)) };
  const d = sceneBuilder(SW, SH);
  d.id = 'staffroom'; d.name = '职员室'; d.bg = renderStaffroom(A);

  for (let x = 0; x < SW; x++) { d.setSolid(x, 0); d.setSolid(x, 1); d.setSolid(x, 2); d.setSolid(x, SH - 1); }
  for (let y = 0; y < SH; y++) { d.setSolid(0, y); d.setSolid(SW - 1, y); }

  // 门 -> 走廊
  for (const x of SR_DOOR) d.exit(x, SH - 1, 'hallway', 'staff');
  d.entries.door = { x: SR_DOOR[0], y: SH - 2, dir: 'up' };

  // 墙上的东西
  for (let x = 2; x <= 9; x++) d.spot(x, 2, '', '窗外能看到操场。\n棒球部的人正在练习接球。');
  for (let x = 11; x <= 18; x++) d.spot(x, 2, '', '本月行事白板：\n“8日 开学典礼　15日 家长会　28日 期中考试”');
  d.spot(19, 2, '', '墙上的时钟。职员室的钟好像快了两分钟。');
  for (const x of [20, 21, 22]) d.spot(x, 2, '', '墙上贴着标语：“以学生为本，以身作则”。');

  // 两组岛型办公桌
  const r = makeRng(33), chairN = spriteOfficeChair(true), chairS = spriteOfficeChair(false);
  let n = 0;
  for (const cols of ISLANDS) for (const x of cols) {
    const yN = ISLAND_ROW, yS = ISLAND_ROW + 1;
    const nameN = TEACHERS[n++ % TEACHERS.length], nameS = TEACHERS[n++ % TEACHERS.length];
    d.prop(x, yN - 1, chairN); d.setSolid(x, yN - 1);
    d.prop(x, yN, spriteDeskNorth(r)); d.setSolid(x, yN);
    d.prop(x, yS, spriteDeskSouth(r)); d.setSolid(x, yS);
    d.prop(x, yS + 1, chairS); d.setSolid(x, yS + 1);
    const tN = `${nameN}老师的桌子。显示器背面贴着一张便利贴：“别忘了交出勤表”。`;
    const tS = `${nameS}老师的桌子。电脑屏幕亮着……\n还是别偷看了。`;
    d.spot(x, yN - 1, '', tN); d.spot(x, yN, '', tN);
    d.spot(x, yS, '', tS); d.spot(x, yS + 1, '', tS);
  }
  // 教头的桌子（面朝门口）
  const vp = spriteVPDesk();
  d.props.push({ img: vp, x: 18 * 16, y: 9 * 16 - vp.height, base: 9 * 16 - 1 });
  for (const x of [18, 19]) { d.setSolid(x, 8); d.spot(x, 8, '', '教头的办公桌。桌上的名牌擦得闪闪发亮。'); }

  // 靠墙的东西
  d.prop(1, 3, spriteWaterServer()); d.setSolid(1, 3); d.spot(1, 3, '', '饮水机。旁边放着一摞纸杯。');
  const tea = spriteTeaTable();
  d.props.push({ img: tea, x: 2 * 16, y: 4 * 16 - tea.height, base: 4 * 16 - 1 });
  for (const x of [2, 3]) { d.setSolid(x, 3); d.spot(x, 3, '', '泡茶的角落。热水壶里的水刚烧开。\n茶杯上都写着老师们的名字。'); }
  const cab = spriteCabinet();
  for (const x of [15, 16, 17]) { d.prop(x, 3, cab); d.setSolid(x, 3); d.spot(x, 3, '', '文件柜。标签上写着“学生档案”——上了锁。'); }
  d.prop(22, 3, spriteCopier()); d.setSolid(22, 3); d.spot(22, 3, '', '复印机。正一闪一闪地提示：缺纸。');
  const plant = spritePlant();
  for (const [x, y] of [[1, 12], [22, 12]]) { d.prop(x, y, plant); d.setSolid(x, y); d.spot(x, y, '', '职员室的盆栽。花盆上贴着“请勿浇太多水”。'); }

  d.npcs = [
    { name: '教头·山口', look: { hair: '#b8b4ac', hairDark: '#8a8680', cloth: '#5a4a3a', clothDark: '#42362a', pants: '#3a3030', collar: '#f4efe4', shoes: '#2e2a2a' },
      x: 19, y: 7, dir: 'down', lines: ['嗯？你是 2A 的转学生吧。', '职员室不是随便进来玩的地方哦。\n……不过，有事的话随时可以来找老师商量。', '要去四楼的话，先敲门。\n鬼头主任最讨厌别人直接推门进去。'] },
    { name: '数学老师·小野', look: { hair: '#4a3a2a', hairDark: '#2e2418', cloth: '#6a8aa8', clothDark: '#4e6a88', pants: '#3e4250', collar: '#f4efe4', shoes: '#2e2a2a' },
      x: 9, y: 8, dir: 'left', lines: ['啊，别看我屏幕！是……是期中考试的题目。', '转学生是吧？数学跟得上吗？\n有不会的可以来问我。'] },
    { name: '保健老师·白石', look: { hair: '#6a3a4a', hairDark: '#4a2434', cloth: '#f4f4f8', clothDark: '#cfd0dc', pants: '#8a8e9a', collar: '#f4f4f8', shoes: '#f4f4f8' },
      x: 3, y: 4, dir: 'up', lines: ['要喝杯茶吗？……开玩笑的，学生不能在这里喝茶哦。', '身体不舒服的话，就来一楼的保健室找我吧。'] },
    { name: '英语老师·佐佐木', look: { hair: '#c89a4a', hairDark: '#9a723a', cloth: '#b84a5a', clothDark: '#8a3442', pants: '#2a2e48', collar: '#f4efe4', shoes: '#6a3a2a' },
      x: 15, y: 11, dir: 'up', lines: ['Good morning! 你就是转学生吧？', '明天的英语课要小测验哦，See you!'] },
  ];
  return d;
}
