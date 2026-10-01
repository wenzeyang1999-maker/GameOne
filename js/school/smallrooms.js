// ============================================================
//  场景：四楼的小房间（电脑室、实验室、校长室、教导主任办公室）
//  四间共用同一个外壳：比教室小、只有一扇门（下墙正中），
//  只有地板、墙上的东西和里面的家具不一样。配置见 SMALL_ROOMS
// ============================================================

const RW = 24, RH = 14;              // 画布和教室一样大，房间只占中间一块（两边是墙外的暗处）
const RX0 = 3, RX1 = 20;             // 房间内部的列
const RY0 = 3, RY1 = 12;             // 房间内部的行
const R_DOOR = [11, 12];             // 下墙正中的门

// ---------------- 这一层特有的家具 ----------------
function spriteLabBench() {          // 实验台 32x24：黑色台面 + 水槽 + 燃气开关
  const c = makeCanvas(32, 24), g = c.getContext('2d'), K = PAL.k;
  px(g, K, 0, 1, 32, 23);
  px(g, '#3a3e44', 1, 2, 30, 10); px(g, '#4e545c', 1, 2, 30, 1);        // 台面
  px(g, '#8a7a5a', 1, 12, 30, 11); px(g, '#6a5a42', 1, 12, 30, 2);      // 柜体
  px(g, '#5a4a36', 4, 16, 10, 5); px(g, '#5a4a36', 18, 16, 10, 5);
  px(g, K, 3, 4, 9, 6); px(g, '#b8c0c8', 4, 5, 7, 4); px(g, '#8a9098', 5, 7, 5, 1);   // 水槽
  px(g, K, 6, 2, 2, 3); px(g, '#d8dde2', 6, 2, 1, 3);                                  // 水龙头
  px(g, K, 20, 5, 2, 5); px(g, '#c8783c', 20, 5, 2, 2);                                // 燃气开关
  px(g, K, 25, 4, 4, 6); px(g, '#a8d8ee', 26, 5, 2, 4);                                // 烧杯
  return c;
}

function spriteStool() {             // 圆凳 14x16
  const c = makeCanvas(14, 16), g = c.getContext('2d'), K = PAL.k;
  px(g, K, 6, 8, 2, 6); px(g, K, 3, 13, 8, 2);
  px(g, K, 1, 3, 12, 6); px(g, '#8a5a3a', 2, 4, 10, 4); px(g, '#a8744c', 2, 4, 10, 1);
  return c;
}

function spriteSofa(w) {             // 沙发（朝下坐）w x 24
  const c = makeCanvas(w, 24), g = c.getContext('2d'), K = PAL.k;
  px(g, K, 0, 0, w, 24);
  px(g, '#5a4a6a', 1, 1, w - 2, 8); px(g, '#6e5c80', 1, 1, w - 2, 2);       // 靠背
  px(g, '#4a3c58', 1, 9, w - 2, 11); px(g, '#6e5c80', 1, 9, w - 2, 1);      // 坐垫
  for (let x = 1 + ((w - 2) >> 1); x < w - 2; x += w) px(g, K, x, 9, 1, 11);
  px(g, '#6e5c80', 1, 9, 5, 11); px(g, '#6e5c80', w - 6, 9, 5, 11);         // 扶手
  px(g, K, 2, 20, 3, 4); px(g, K, w - 5, 20, 3, 4);
  return c;
}

function spriteLowTable() {          // 茶几 32x16
  const c = makeCanvas(32, 16), g = c.getContext('2d'), K = PAL.k;
  px(g, K, 0, 2, 32, 10); px(g, '#a8744c', 1, 3, 30, 7); px(g, '#c08a5a', 1, 3, 30, 1);
  px(g, K, 3, 11, 3, 5); px(g, K, 26, 11, 3, 5);
  px(g, K, 12, 4, 8, 4); px(g, '#f4efe4', 13, 5, 6, 2);                     // 茶杯托盘
  return c;
}

function spriteBookshelf(seed) {     // 书架 16x30
  const c = makeCanvas(16, 30), g = c.getContext('2d'), K = PAL.k, r = makeRng(seed);
  px(g, K, 0, 0, 16, 30); px(g, '#7a5232', 1, 1, 14, 28);
  for (const y of [2, 11, 20]) {
    px(g, '#4a3220', 2, y, 12, 8);
    for (let x = 2; x < 14; x += 2) {
      if (r() < 0.2) continue;
      px(g, ['#d4443c', '#3e6ab0', '#4a9a52', '#e0b040', '#8a4a9a'][(r() * 5) | 0], x, y + 1 + ((r() * 2) | 0), 2, 7);
    }
    px(g, '#9a6a42', 1, y + 8, 14, 1);
  }
  return c;
}

function spriteSkeleton() {          // 人体骨骼模型 16x34
  const c = makeCanvas(16, 34), g = c.getContext('2d'), K = PAL.k, W = '#eae6d8';
  px(g, K, 4, 0, 8, 8); px(g, W, 5, 1, 6, 6); px(g, K, 6, 3, 2, 2); px(g, K, 9, 3, 2, 2);
  px(g, W, 7, 8, 2, 2);
  px(g, K, 3, 10, 10, 12); px(g, W, 4, 11, 8, 10);
  for (let y = 12; y < 21; y += 2) px(g, '#c8c4b4', 4, y, 8, 1);
  px(g, W, 2, 11, 2, 9); px(g, W, 12, 11, 2, 9);                     // 手臂
  px(g, W, 5, 22, 2, 8); px(g, W, 9, 22, 2, 8);                      // 腿
  px(g, K, 3, 30, 10, 2); px(g, '#8a8e9a', 6, 32, 4, 2);             // 底座
  return c;
}

const ALIEN = [
  '................',
  '......kkkkk.....',
  '....kkDDDDDkk...',
  '...kDDMMMMMDDkk.',
  '..kDMMLLLLMMMDDk',
  '..kDMMMMMMMMMDDk',
  '..kDDMMMMMMMDDk.',
  '...kDDDDDDDkkk..',
  '...kTTkDDDkk....',
  '....kDDkk.......',
  '.....kDk........',
  '....kDMDk.......',
  '...kDMMMDk......',
  '..kDMLLLMDk.....',
  '.kDMMLLLMMDk....',
  'kkDMMLLLMMDkk...',
  'kDkMMLLLMMkDk...',
  'kDkMMLLLMMkDk...',
  'kDkMMLLLMMkDk...',
  'kDkMMMMMMMkDk...',
  'kDkMMMMMMMkDkk..',
  '.kkMMMMMMMkkDDk.',
  '..kMMMMMMMk.kDDk',
  '..kDMMMMMDk..kDk',
  '..kDMM.MMDk..kDk',
  '..kDMk.kMDk..kDk',
  '..kDMk.kMDk.kDk.',
  '..kDMk.kMDkkDk..',
  '..kDMk.kMDkDk...',
  '..kDMk.kMDkk....',
  '..kDMk.kMDk.....',
  '.kDDMk.kMDDk....',
  '.kDkk...kkDk....',
  '.kkk.....kkk....',
  '................',
  '..kkkkkkkkkkk...',
  '..kSSSSSSSSSk...',
  '..kSSSSSSSSSk...',
  '...kkkkkkkkk....',
];
// 异形模型（理科部的文化祭作品）：细长的头、肋骨、长尾巴，立在展示底座上
function spriteAlien() {
  return fromStrings(ALIEN, { k: '#12121a', D: '#24243c', M: '#383854', L: '#56567c', T: '#e8e4d8', S: '#8a8e9a' });
}

function spriteFlag() {              // 校旗 16x34
  const c = makeCanvas(16, 34), g = c.getContext('2d'), K = PAL.k;
  px(g, K, 7, 0, 2, 30); px(g, '#c8a860', 7, 0, 1, 30); px(g, '#e0b040', 6, 0, 4, 2);
  px(g, K, 9, 3, 7, 16); px(g, '#8a2a3a', 10, 4, 5, 14); px(g, '#e0b040', 11, 8, 3, 3);
  px(g, K, 4, 30, 8, 4); px(g, '#5a4a3a', 5, 31, 6, 2);
  return c;
}

function spriteServerRack() {        // 电脑室角落的机柜 16x28
  const c = makeCanvas(16, 28), g = c.getContext('2d'), K = PAL.k;
  px(g, K, 1, 0, 14, 28); px(g, '#3a3e4a', 2, 1, 12, 26);
  for (let y = 3; y < 25; y += 4) {
    px(g, '#54596a', 3, y, 10, 3);
    px(g, y % 8 ? '#6ac8f0' : '#6ade7a', 4, y + 1, 1, 1); px(g, '#e04858', 6, y + 1, 1, 1);
  }
  return c;
}

// ---------------- 房间外壳 ----------------
function renderSmallRoom(cfg) {
  const c = makeCanvas(RW * 16, RH * 16), g = c.getContext('2d'), r = makeRng(cfg.seed);
  const X0 = RX0 * 16, X1 = (RX1 + 1) * 16, Y0 = RY0 * 16, Y1 = (RY1 + 1) * 16;
  px(g, '#141019', 0, 0, RW * 16, RH * 16);                       // 房间外面的暗处
  // 地板
  const tiles = cfg.floorTiles();
  for (let y = RY0; y <= RY1; y++) for (let x = RX0; x <= RX1; x++) g.drawImage(tiles[(r() * tiles.length) | 0], x * 16, y * 16);
  if (cfg.rug) {                                                   // 地毯：[颜色, 深色, 左列, 上行, 宽, 高]
    const [c1, c2, rx, ry, rw, rh] = cfg.rug;
    px(g, c2, rx * 16, ry * 16, rw * 16, rh * 16);
    px(g, c1, rx * 16 + 3, ry * 16 + 3, rw * 16 - 6, rh * 16 - 6);
  }
  // 上墙
  px(g, WALL, X0 - 16, 0, X1 - X0 + 32, 48);
  px(g, TRIM, X0 - 16, 0, X1 - X0 + 32, 4); px(g, '#8a6a4a', X0 - 16, 3, X1 - X0 + 32, 1);
  px(g, '#b08a5c', X0 - 16, 43, X1 - X0 + 32, 5); px(g, TRIM, X0 - 16, 43, X1 - X0 + 32, 1);
  // 侧墙
  px(g, WALL_SIDE, X0 - 16, Y0, 16, Y1 - Y0); px(g, '#b8ae98', X0 - 1, Y0, 1, Y1 - Y0);
  px(g, WALL_SIDE, X1, Y0, 16, Y1 - Y0); px(g, '#b8ae98', X1, Y0, 1, Y1 - Y0);
  if (cfg.wall) cfg.wall(g, X0, X1, r);                            // 墙上的东西（每间不同）
  // 下墙 + 门
  px(g, '#5a4a3a', X0 - 16, Y1, X1 - X0 + 32, 16); px(g, '#7a6a58', X0 - 16, Y1, X1 - X0 + 32, 2);
  const dx = R_DOOR[0] * 16, dw = 32;
  px(g, '#8a8e9a', dx, Y1 - 1, dw, 1);
  px(g, PAL.k, dx, Y1, dw, 16);
  px(g, cfg.metalDoor ? '#9aa0ac' : '#a87a4a', dx + 1, Y1 + 1, dw - 2, 14);
  px(g, cfg.metalDoor ? '#b8bec8' : '#c09060', dx + 1, Y1 + 1, dw - 2, 2);
  px(g, '#a8d8ee', dx + 6, Y1 + 5, dw - 12, 5);
  px(g, '#4a3a2a', dx + dw - 8, Y1 + 8, 2, 4);
  return c;
}

// 墙上常用的小东西
function wallPoster(g, x, y, w, h, bg, lines) {
  px(g, PAL.k, x - 1, y - 1, w + 2, h + 2); px(g, bg, x, y, w, h);
  for (let j = y + 3; j < y + h - 2; j += 3) px(g, 'rgba(40,40,60,0.45)', x + 2, j, w - 4, 1);
  if (lines) for (const [lx, ly, lw, col] of lines) px(g, col, x + lx, y + ly, lw, 2);
}
function wallBoard(g, x, y, w, h) {   // 白板
  px(g, PAL.k, x - 2, y - 2, w + 4, h + 4); px(g, '#b8bcc4', x - 1, y - 1, w + 2, h + 2);
  px(g, '#f8f8fa', x, y, w, h); px(g, '#8a8e9a', x, y + h, w, 2);
}
function wallWindow(g, x, y, w, h) {
  px(g, PAL.k, x - 2, y - 2, w + 4, h + 5); px(g, '#9aa0ac', x - 1, y - 1, w + 2, h + 3);
  const sky = g.createLinearGradient(0, y, 0, y + h);
  sky.addColorStop(0, '#7cc4ec'); sky.addColorStop(1, '#d4eef8');
  g.fillStyle = sky; g.fillRect(x, y, w, h);
  px(g, '#ffffff', x + 8, y + 5, 12, 3);
  px(g, '#9aa0ac', x + (w >> 1) - 1, y, 2, h);
  px(g, '#d8d0bc', x - 3, y + h + 2, w + 6, 3);
}

// ---------------- 四个房间 ----------------
const SMALL_ROOMS = {
  pc: {
    id: 'room_pc', name: '电脑室', seed: 3, metalDoor: true,
    floorTiles: () => [0, 1, 2].map(i => officeFloorTile(70 + i)),
    wall: (g, X0, X1) => {
      wallWindow(g, X0 + 8, 9, 52, 30); wallWindow(g, X0 + 72, 9, 52, 30);
      wallBoard(g, X0 + 150, 8, 96, 32);
      wallPoster(g, X1 - 46, 10, 34, 28, '#e8e4d0', [[4, 4, 24, '#3a78c8']]);
    },
    items: (d, A) => {
      const r = makeRng(5);
      // 两排电脑桌，椅子在桌子前面
      for (const row of [5, 9]) {
        for (const x of [5, 6, 7, 10, 11, 12, 15, 16, 17]) {
          d.prop(x, row, spriteDeskSouth(r)); d.setSolid(x, row);
          d.prop(x, row + 1, spriteOfficeChair(false)); d.setSolid(x, row + 1);
          const t = '学校的电脑。屏幕上是登录界面，\n贴纸上写着“用完请关机”。';
          d.spot(x, row, '', t); d.spot(x, row + 1, '', t);
        }
      }
      d.prop(19, 4, spriteServerRack()); d.setSolid(19, 4); d.spot(19, 4, '', '服务器机柜。指示灯一闪一闪，嗡嗡作响。');
      d.prop(4, 4, spriteCabinet()); d.setSolid(4, 4); d.spot(4, 4, '', '柜子里放着投影仪和一堆网线。');
      d.prop(19, 12, spriteTrash()); d.setSolid(19, 12); d.spot(19, 12, '', '垃圾桶。里面全是打印失败的纸。');
      for (let x = RX0; x <= RX1; x++) d.spot(x, 2, '', '白板上写着“上机注意事项”，\n旁边的窗外能看到天空。');
    },
    npcs: [{ name: '电脑室值日生·凉', look: LOOK.gakuran('#4a3a6a', '#2e2444'), x: 9, y: 12, dir: 'up',
      lines: ['这台电脑又死机了……', '老师说钥匙丢了，所以今天门一直开着。'] }],
  },

  lab: {
    id: 'room_lab', name: '实验室', seed: 4, metalDoor: true,
    floorTiles: () => [0, 1, 2].map(i => hallFloorTile(80 + i)),
    wall: (g, X0, X1) => {
      wallWindow(g, X0 + 8, 9, 52, 30);
      wallPoster(g, X0 + 74, 8, 60, 32, '#f4efe4', [[4, 4, 50, '#3aa860'], [4, 22, 40, '#d4443c']]);   // 元素周期表
      drawSketchSheet(g, X0 + 142, 8, 54, 32);                                                          // 钉在墙上的素描
      wallBoard(g, X1 - 80, 8, 68, 32);
    },
    items: (d, A) => {
      const bench = spriteLabBench(), stool = spriteStool();
      for (const row of [5, 8, 11]) for (const x of [5, 9, 13]) {
        d.props.push({ img: bench, x: x * 16, y: (row + 1) * 16 - bench.height, base: (row + 1) * 16 - 1 });
        d.setSolid(x, row); d.setSolid(x + 1, row);
        const t = '实验台。台面上有水槽和燃气开关，\n还留着上次实验的烧杯。';
        d.spot(x, row, '', t); d.spot(x + 1, row, '', t);
        if (row < 11) for (const sx of [x, x + 1]) { d.prop(sx, row + 1, stool); d.setSolid(sx, row + 1); d.spot(sx, row + 1, '', '圆凳。坐上去会转来转去。'); }
      }
      d.prop(17, 4, spriteSkeleton()); d.setSolid(17, 4); d.spot(17, 4, '', '人体骨骼模型。\n据说晚上会自己换姿势……当然是假的。');
      d.prop(19, 4, spriteAlien()); d.setSolid(19, 4); d.spot(19, 4, '', '……为什么实验室里会有异形的模型？\n底座的标签上写着：“理科部 文化祭作品”。');
      d.prop(19, 7, spriteCabinet()); d.setSolid(19, 7); d.spot(19, 7, '', '药品柜。玻璃门上锁了，里面的瓶子贴着奇怪的标签。');
      d.prop(19, 11, spriteTrash()); d.setSolid(19, 11); d.spot(19, 11, '', '垃圾桶。旁边贴着“玻璃器皿请勿丢入”。');
      d.prop(4, 11, spritePlant()); d.setSolid(4, 11); d.spot(4, 11, '', '不知道是谁的观察日记用的植物，长得很精神。');
      for (let x = RX0; x <= RX1; x++) d.spot(x, 2, '', '墙上贴着元素周期表和实验安全须知。');
      for (const x of [12, 13, 14, 15]) d.spot(x, 2, '', '钉在墙上的一叠素描：蜷曲的幼体、细长的头骨、多关节的手。\n有几处被红笔划掉重画过。\n角落用铅笔写着“生物部 资料 · 请勿取走”。');
    },
    npcs: [{ name: '理科老师·绿川', look: { hair: '#3a5a4a', hairDark: '#24382e', cloth: '#f4f4f8', clothDark: '#cfd0dc', pants: '#4a5058', collar: '#f4f4f8', shoes: '#2e2a2a' },
      x: 17, y: 9, dir: 'left', lines: ['小心点，那边的药品别乱碰。', '下周要做的实验很有意思哦——会烧出漂亮的颜色。'] }],
  },

  principal: {
    id: 'room_principal', name: '校长室', seed: 5, metalDoor: false,
    floorTiles: () => [0, 1, 2].map(i => floorTile(90 + i, WOOD)),
    rug: ['#8a3a4a', '#5a2430', 5, 8, 9, 5],
    wall: (g, X0, X1) => {
      wallWindow(g, X0 + 100, 9, 52, 30);
      wallPoster(g, X0 + 12, 8, 40, 30, '#e8e4d0', [[4, 4, 30, '#8a2a3a']]);       // 校训
      for (let i = 0; i < 3; i++) wallPoster(g, X0 + 170 + i * 30, 12, 24, 24, '#d8cfc0', [[3, 3, 16, '#4a4a5a']]);   // 历代校长照片
    },
    items: (d, A) => {
      const desk = spriteVPDesk();
      d.props.push({ img: desk, x: 11 * 16, y: 6 * 16 - desk.height, base: 6 * 16 - 1 });
      for (const x of [11, 12]) { d.setSolid(x, 5); d.spot(x, 5, '', '校长的办公桌。桌上放着一枚刻着校徽的印章。'); }
      d.prop(11, 4, spriteOfficeChair(true)); d.setSolid(11, 4); d.spot(11, 4, '', '校长的椅子。看起来比别的椅子高级很多。');
      const sofa = spriteSofa(48), table = spriteLowTable();
      d.props.push({ img: sofa, x: 6 * 16, y: 10 * 16 - sofa.height, base: 10 * 16 - 1 });
      for (const x of [6, 7, 8]) { d.setSolid(x, 9); d.spot(x, 9, '', '待客用的沙发。坐下去会陷进去一大截。'); }
      d.props.push({ img: table, x: 6 * 16, y: 12 * 16 - table.height, base: 12 * 16 - 1 });
      for (const x of [6, 7]) { d.setSolid(x, 11); d.spot(x, 11, '', '茶几。上面的茶还冒着热气——有客人刚来过。'); }
      const sofa2 = spriteSofa(32);
      d.props.push({ img: sofa2, x: 10 * 16, y: 12 * 16 - sofa2.height, base: 12 * 16 - 1 });
      for (const x of [10, 11]) { d.setSolid(x, 11); d.spot(x, 11, '', '另一张沙发。校长和客人就是隔着茶几谈话的吧。'); }
      for (const y of [4, 5, 6]) { d.prop(19, y, spriteBookshelf(y)); d.setSolid(19, y); d.spot(19, y, '', '书架。摆满了厚厚的教育学书籍和学校的纪念册。'); }
      d.prop(4, 4, spriteFlag()); d.setSolid(4, 4); d.spot(4, 4, '', '校旗。金线绣着校徽，看起来有些年头了。');
      d.prop(19, 11, spritePlant()); d.setSolid(19, 11); d.spot(19, 11, '', '很大的一盆观叶植物，叶子擦得发亮。');
      for (let x = RX0; x <= RX1; x++) d.spot(x, 2, '', '墙上挂着历代校长的照片，还有写着校训的匾额。');
    },
    npcs: [{ name: '校长·久保田', look: { hair: '#1c1a1a', hairDark: '#0d0c0c', cloth: '#3a3a4a', clothDark: '#26262e', shirt: '#e6e2d6', pants: '#3a3a4a', collar: '#e6e2d6', shoes: '#2e2a2a', suit: true, bald: true },   // 地中海 + 黑发
      x: 12, y: 4, dir: 'down',
      lines: ['哦，是学生啊。进来的时候记得敲门。', '我们学校不大，但每个学生我都记得名字。\n……你的名字，我也很快就会记住的。'] }],
  },

  dean: {
    id: 'room_dean', name: '教导主任办公室', seed: 6, metalDoor: false,
    floorTiles: () => [0, 1, 2].map(i => officeFloorTile(95 + i)),
    wall: (g, X0, X1) => {
      wallWindow(g, X0 + 8, 9, 52, 30);
      wallBoard(g, X0 + 80, 8, 104, 32);                                            // 值日/巡查表
      drawPainting(g, X1 - 64, 6, 58, 34, SUFFER.saturn.kind);                       // 《农神吞噬其子》
    },
    items: (d, A) => {
      const desk = spriteVPDesk();
      d.props.push({ img: desk, x: 9 * 16, y: 7 * 16 - desk.height, base: 7 * 16 - 1 });
      for (const x of [9, 10]) { d.setSolid(x, 6); d.spot(x, 6, '', '鬼头主任的桌子。\n桌角堆着一摞“反省文”的格子纸。'); }
      d.prop(9, 5, spriteOfficeChair(true)); d.setSolid(9, 5); d.spot(9, 5, '', '主任的椅子。扶手已经磨得发亮。');
      d.prop(12, 6, spriteOfficeChair(false)); d.setSolid(12, 6); d.spot(12, 6, '', '被叫来谈话的学生坐的椅子。\n看着就让人紧张。');
      for (const x of [15, 16, 17, 18]) { d.prop(x, 4, spriteCabinet()); d.setSolid(x, 4); d.spot(x, 4, '', '文件柜。标签写着“违纪记录”“社团申请”。'); }
      const sofa = spriteSofa(48);
      d.props.push({ img: sofa, x: 5 * 16, y: 11 * 16 - sofa.height, base: 11 * 16 - 1 });
      for (const x of [5, 6, 7]) { d.setSolid(x, 10); d.spot(x, 10, '', '旧沙发。据说被训话的学生要先在这里等着。'); }
      d.prop(19, 11, spriteTrash()); d.setSolid(19, 11); d.spot(19, 11, '', '垃圾桶。里面是撕碎的迟到条。');
      d.prop(4, 4, spritePlant()); d.setSolid(4, 4); d.spot(4, 4, '', '盆栽。叶子上一点灰都没有。');
      const low = spriteLowTable();
      d.props.push({ img: low, x: 5 * 16, y: 13 * 16 - low.height, base: 13 * 16 - 1 });
      for (const x of [5, 6]) { d.setSolid(x, 12); d.spot(x, 12, '', '茶几。上面摆着一叠《校规手册》，\n最上面那本被翻得卷了边。'); }
      for (const y of [7, 8]) { d.prop(18, y, spriteBookshelf(y + 9)); d.setSolid(18, y); d.spot(18, y, '', '书架。塞满了历年的学籍簿和活动记录。'); }
      d.prop(14, 9, spriteOfficeChair(true)); d.setSolid(14, 9); d.spot(14, 9, '', '多出来的一把椅子。开会的时候会搬走吧。');
      for (let x = RX0; x <= RX1; x++) d.spot(x, 2, '', '白板上是这周的值日和巡查安排。');
      for (const x of [17, 18, 19, 20]) d.spot(x, 2, '', paintingText(SUFFER.saturn));
    },
    npcs: [{ name: '鬼头主任', look: { hair: '#c9c5bb', hairDark: '#948f85', cloth: '#6e5134', clothDark: '#4b3522', shirt: '#ece6d8', pants: '#5c4228', collar: '#ece6d8', shoes: '#3a2a1e', suit: true },   // 灰白头发 + 棕色西装
      x: 10, y: 5, dir: 'down',
      lines: ['站住。校服的扣子扣好。', '……嗯，还算整齐。没事的话就回教室去吧。'] }],
  },
};

function buildSmallRoom(key) {
  const C = SMALL_ROOMS[key];
  const d = sceneBuilder(RW, RH);
  d.id = C.id; d.name = C.name; d.bg = renderSmallRoom(C);

  // 房间以外全是墙
  for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) if (x < RX0 || x > RX1 || y < RY0 || y > RY1) d.setSolid(x, y);

  // 门 -> 四楼走廊
  for (const x of R_DOOR) d.exit(x, RY1 + 1, FLOORS[4].id, key + '_door');
  d.entries.door = { x: R_DOOR[0], y: RY1, dir: 'up' };

  C.items(d, C);
  d.npcs = C.npcs;
  return d;
}
