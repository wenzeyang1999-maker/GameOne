// ============================================================
//  学校通用美术：木地板、课桌椅、储物格、盆栽、垃圾桶、时钟…
//  依赖 art.js 里的 makeCanvas / fromStrings / blob / makeRng / PAL / px
// ============================================================
const WOOD = { base: '#c8965e', dark: '#a8784a', light: '#d8aa72', grain: '#b88650' };
const WOOD_STAGE = { base: '#d8ac74', dark: '#b08050', light: '#e8c08a', grain: '#c89660' };
const WALL = '#ece4d0', WALL_SIDE = '#ddd4c0', TRIM = '#6a4a32';

function floorTile(seed, P) {
  const c = makeCanvas(16, 16), g = c.getContext('2d'), r = makeRng(seed);
  px(g, P.base, 0, 0, 16, 16);
  for (let j = 0; j < 4; j++) {
    const y = j * 4;
    px(g, P.light, 0, y, 16, 1);
    px(g, P.dark, 0, y + 3, 16, 1);
    px(g, P.dark, (r() * 16) | 0, y, 1, 3);                 // 木板接缝
    for (let i = 0; i < 3; i++) px(g, P.grain, (r() * 15) | 0, y + 1 + ((r() * 2) | 0), 2, 1);
  }
  return c;
}

function spriteDesk(r) {        // 学生课桌 16x20
  const c = makeCanvas(16, 20), g = c.getContext('2d'), K = PAL.k;
  // 金属桌腿
  px(g, K, 1, 12, 3, 8); px(g, K, 12, 12, 3, 8);
  px(g, '#9aa0ac', 2, 12, 1, 7); px(g, '#9aa0ac', 13, 12, 1, 7);
  // 抽屉（书箱）
  px(g, K, 1, 10, 14, 5); px(g, '#6a707e', 2, 11, 12, 3); px(g, '#3a3e4a', 3, 12, 10, 1);
  // 桌面
  px(g, K, 0, 1, 16, 11);
  px(g, '#dcb888', 1, 2, 14, 8); px(g, '#ecd0a4', 1, 2, 14, 1); px(g, '#b08a5c', 1, 9, 14, 1);
  px(g, '#c8a070', 3, 5, 5, 1); px(g, '#c8a070', 9, 7, 4, 1);   // 木纹
  // 桌上的东西
  const v = r();
  if (v < 0.3) {          // 课本
    const col = ['#d4443c', '#3e6ab0', '#4a9a52', '#e0a030'][(r() * 4) | 0];
    px(g, K, 3, 3, 7, 6); px(g, col, 4, 4, 5, 4); px(g, '#f4efe4', 4, 7, 5, 1);
  } else if (v < 0.5) {   // 笔袋
    px(g, K, 8, 4, 6, 3); px(g, ['#f6a8c4', '#6aa8d8', '#f2d24a'][(r() * 3) | 0], 9, 5, 4, 1);
  } else if (v < 0.6) {   // 便当
    px(g, K, 4, 3, 8, 6); px(g, '#d4443c', 5, 4, 6, 4); px(g, '#f4efe4', 5, 5, 6, 1);
  }
  return c;
}

function spriteChair() {        // 学生椅 16x20（侧面：朝左坐，椅背在右边）
  const c = makeCanvas(16, 20), g = c.getContext('2d'), K = PAL.k;
  px(g, K, 2, 12, 2, 8); px(g, K, 11, 12, 2, 8);                       // 腿
  px(g, '#8a92a0', 3, 12, 1, 7); px(g, '#8a92a0', 12, 12, 1, 7);
  px(g, K, 1, 8, 13, 5); px(g, '#c8a070', 2, 9, 11, 3); px(g, '#dab888', 2, 9, 11, 1);   // 座面
  px(g, K, 10, 0, 5, 13); px(g, '#b88c5c', 11, 1, 3, 11); px(g, '#d0a470', 11, 1, 1, 11); // 椅背
  return c;
}

function spriteTeacherDesk() {  // 讲台桌 16x40（竖着放，占 1x2 格）
  const c = makeCanvas(16, 40), g = c.getContext('2d'), K = PAL.k;
  px(g, K, 0, 1, 16, 39);
  px(g, '#9a6a42', 1, 2, 14, 27); px(g, '#b8845a', 1, 2, 14, 1); px(g, '#b8845a', 1, 2, 1, 27);  // 桌面
  px(g, '#7a5232', 1, 29, 14, 10); px(g, '#6a4428', 1, 29, 14, 2);                                // 前挡板
  // 出席簿、粉笔盒
  px(g, K, 3, 5, 10, 8); px(g, '#2e4a8a', 4, 6, 8, 6); px(g, '#f4efe4', 4, 10, 8, 1);
  px(g, K, 4, 18, 8, 6); px(g, '#f4efe4', 5, 19, 6, 4); px(g, '#f6a8c4', 5, 19, 1, 1); px(g, '#f2d24a', 7, 19, 1, 1); px(g, '#6aa8d8', 9, 19, 1, 1);
  return c;
}

function spriteShelf(r) {       // 后排储物格 16x20
  const c = makeCanvas(16, 20), g = c.getContext('2d'), K = PAL.k;
  px(g, K, 0, 0, 16, 20);
  px(g, '#b8845a', 1, 1, 14, 2);
  for (const y of [3, 11]) {
    px(g, '#4a3424', 1, y, 14, 7);
    if (r() < 0.75) {           // 书包
      const col = ['#2a2e48', '#6a3a2a', '#3a5a3a', '#8a2a3a'][(r() * 4) | 0];
      const x = 2 + ((r() * 4) | 0);
      px(g, K, x, y + 1, 9, 6); px(g, col, x + 1, y + 2, 7, 4); px(g, '#e0b040', x + 4, y + 3, 1, 1);
    }
    px(g, '#9a6a42', 1, y + 7, 14, 1);
  }
  return c;
}

function spritePlant() {        // 盆栽 16x26
  const c = makeCanvas(16, 26), g = c.getContext('2d'), K = PAL.k;
  const leaves = blob(16, 16, [[8, 8, 6], [4, 10, 4], [12, 10, 4], [8, 4, 4]],
    { light: PAL.leafLight, mid: PAL.leaf, dark: PAL.leafDark }, 31);
  g.drawImage(leaves, 0, 0);
  px(g, K, 3, 15, 10, 11); px(g, '#c8643c', 4, 16, 8, 9); px(g, '#e0845a', 4, 16, 8, 2); px(g, '#a04a2a', 4, 23, 8, 2);
  return c;
}

function spriteTrash() {        // 垃圾桶 16x16
  const c = makeCanvas(16, 16), g = c.getContext('2d'), K = PAL.k;
  px(g, K, 3, 2, 10, 14); px(g, '#6a8ab0', 4, 5, 8, 10); px(g, '#8aaad0', 4, 5, 2, 10);
  px(g, K, 2, 1, 12, 4); px(g, '#4a6a90', 3, 2, 10, 2); px(g, '#f4efe4', 6, 3, 3, 1);
  return c;
}

const CLOCK = [
  '...kkkkk...',
  '.kkwwwwwkk.',
  '.kwwwkwwwk.',
  'kwwwwkwwwwk',
  'kwwwwkwwwwk',
  'kwwwwkkkwwk',
  'kwwwwwwwwwk',
  'kwwwwwwwwwk',
  '.kwwwwwwwk.',
  '.kkwwwwwkk.',
  '...kkkkk...',
];
