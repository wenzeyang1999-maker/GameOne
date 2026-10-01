// ============================================================
//  序章：上学路上 —— 只有 Miss Ren 会走这一段，别人直接从教室开始
//
//  流程：捡起地上散落的东西 -> 还给老奶奶 -> 拿到【物理学圣剑·撬棍】
//        -> 校门放行 -> 2-A 教室（之后和普通开局一样）
//
//  所有台词在 story.js，这里只管流程、布局和画面
//
//  ⚠️ 「怎么帮老奶奶」现在是占位做法：东西掉了一地，捡起来还给她。
//     要换成别的（扶她过马路、帮她搬箱子……）改 d.item 那一段就行，
//     流程的其余部分不用动
// ============================================================

const PW = 24, PH = 14;
const ROAD_X0 = 9, ROAD_X1 = 14;     // 柏油路的范围
const GATE = [11, 12];               // 校门（上墙）
const GRANNY = [7, 8];               // 老奶奶站的位置
const WALLET = [18, 11];             // 钱包掉的地方（答应帮忙之后才出现，在路对面）

// ---------------- 美术 ----------------

// 学校的围墙（上方）：水泥墙 + 压顶，带一点斑驳
function drawWall(g, x, y, w, h) {
  const K = PAL.k;
  px(g, K, x, y, w, h);
  px(g, '#b9b2a2', x + 1, y + 1, w - 2, h - 2);
  px(g, '#cdc7b8', x + 1, y + 1, w - 2, 2);          // 压顶受光
  px(g, '#8e8779', x + 1, y + h - 4, w - 2, 3);      // 墙根的灰
  for (let i = x + 4; i < x + w - 4; i += 24) {      // 伸缩缝
    px(g, '#9a9384', i, y + 3, 1, h - 7);
  }
  for (let i = 0; i < w; i += 7) {                    // 斑驳的水渍
    if ((i * 7919) % 5) continue;
    px(g, '#a39c8d', x + i, y + 6, 3, h - 10);
  }
}

// 校门：两扇对开的铁栅栏门，开着
function spriteGate() {
  const c = makeCanvas(32, 34), g = c.getContext('2d'), K = PAL.k;
  for (const side of [0, 1]) {
    const bx = side ? 20 : 0;
    px(g, K, bx, 0, 12, 34);
    px(g, '#4a5058', bx + 1, 1, 10, 32);
    for (let i = 1; i < 10; i += 3) px(g, '#6a7280', bx + i, 2, 1, 30);   // 竖栅栏
    px(g, '#7a8290', bx + 1, 3, 10, 1); px(g, '#7a8290', bx + 1, 28, 10, 1);
  }
  px(g, K, 12, 0, 8, 6); px(g, '#5a6068', 13, 1, 6, 4);                   // 门楣
  return c;
}

// 门柱 + 校牌
function spriteGatePost() {
  const c = makeCanvas(14, 40), g = c.getContext('2d'), K = PAL.k;
  px(g, K, 0, 0, 14, 40);
  px(g, '#c2bcad', 1, 1, 12, 38);
  px(g, '#d8d2c4', 1, 1, 12, 2);
  px(g, '#9a9384', 1, 36, 12, 3);
  px(g, K, 2, 10, 10, 18); px(g, '#e8e2d4', 3, 11, 8, 16);                // 校牌
  for (let y = 13; y < 26; y += 4) px(g, '#5a5448', 5, y, 4, 2);          // 牌子上的字（看不清）
  return c;
}

// 掉在草里的钱包：半开着，露出一角
function spriteWallet() {
  const c = makeCanvas(12, 9), g = c.getContext('2d'), K = PAL.k;
  px(g, K, 0, 1, 12, 8);
  px(g, '#6a3a2a', 1, 2, 10, 6);                                          // 皮面
  px(g, '#8a5038', 1, 2, 10, 2);                                          // 受光的一面
  px(g, '#4a2418', 1, 6, 10, 1);
  px(g, '#c8a84a', 5, 4, 3, 2);                                           // 搭扣
  px(g, '#e8e2d4', 2, 1, 4, 1);                                           // 露出来的一角
  px(g, 'rgba(20,10,20,0.25)', 1, 8, 10, 1);
  return c;
}

// 钱包。auto: 走到旁边就触发，不用按键；ask: 先问一句「拾取 / 放弃」
function walletItem() {
  return {
    id: 'wallet', name: T('item.钱包.名字'), desc: T('item.钱包.说明'),
    color: '#6a3a2a', auto: true, ask: true,
  };
}

// 老奶奶：驼背、灰白头发、深色和服外套
const GRANNY_LOOK = {
  hair: '#c8c4bc', hairDark: '#9a968e', cloth: '#5a4a52', clothDark: '#3e333a',
  collar: '#d8d2c4', pants: '#4a3e44', shoes: '#4a3a2a',
};

// ---------------- 背景 ----------------
function renderPrologue() {
  const c = makeCanvas(PW * 16, PH * 16), g = c.getContext('2d'), r = makeRng(71);
  const grass = [0, 1, 2, 3].map(i => tileGrass(200 + i));
  const path = [0, 1, 2, 3].map(i => tilePath(210 + i));

  for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) {
    const onRoad = x >= ROAD_X0 && x <= ROAD_X1;
    g.drawImage((onRoad ? path : grass)[(r() * 4) | 0], x * 16, y * 16);
  }
  // 路两边的牙石
  for (let y = 0; y < PH; y++) {
    px(g, '#b8b2a4', ROAD_X0 * 16 - 2, y * 16, 2, 16);
    px(g, '#8e8779', ROAD_X0 * 16 - 2, y * 16 + 14, 2, 2);
    px(g, '#b8b2a4', (ROAD_X1 + 1) * 16, y * 16, 2, 16);
    px(g, '#8e8779', (ROAD_X1 + 1) * 16, y * 16 + 14, 2, 2);
  }
  // 路中间的虚线
  for (let y = 3 * 16; y < PH * 16; y += 24) px(g, '#d8d2c0', 11 * 16 + 14, y, 3, 12);

  // 上方：学校围墙 + 校门
  drawWall(g, 0, 0, PW * 16, 44);
  const gate = spriteGate(), post = spriteGatePost();
  g.drawImage(gate, GATE[0] * 16, 12);
  g.drawImage(post, GATE[0] * 16 - 14, 6);
  g.drawImage(post, (GATE[1] + 1) * 16, 6);
  // 门里面露出来的一截路
  px(g, '#9a9484', GATE[0] * 16, 0, 32, 14);

  return c;
}

// ---------------- 场景 ----------------
function buildPrologue() {
  const d = sceneBuilder(PW, PH);
  d.id = 'prologue'; d.name = '上学路上'; d.bg = renderPrologue();
  d.camY = 'bottom';

  // 围墙挡住上面三行，左右两边也走不出去
  for (let x = 0; x < PW; x++) for (let y = 0; y < 3; y++) d.setSolid(x, y);
  for (let y = 0; y < PH; y++) { d.setSolid(0, y); d.setSolid(PW - 1, y); }

  // 校门：踩上去才判断能不能进（见下面的 onExit）
  for (const x of GATE) { d.setSolid(x, 2, 0); d.setSolid(x, 1, 0); }
  d.entries.start = { x: 11, y: 12, dir: 'up' };

  // 树（放在路两边，别挡住走的地方）
  const TREES = [[3, 4, 3], [5, 7, 7], [3, 11, 11], [17, 4, 4], [19, 8, 8], [17, 12, 12]];
  TREES.forEach(([tx, ty, seed], i) => {
    const img = spriteTree(seed, 'sakura');
    d.props.push({ img, x: tx * 16 + 8 - img.width / 2, y: (ty + 1) * 16 - img.height, base: (ty + 1) * 16 - 1 });
    d.setSolid(tx, ty);
    d.spot(tx, ty, '', T(i % 2 ? 'prologue.樱花.2' : 'prologue.樱花.1'));   // 一半一半
  });

  // 校牌（门柱上）
  for (const x of [GATE[0] - 1, GATE[1] + 1]) d.spot(x, 2, '', T('prologue.校牌'));
  // 路面
  for (const x of [ROAD_X0, ROAD_X1]) for (const y of [6, 9]) d.spot(x, y, '', T('prologue.路'));

  // 校门一直开着 —— 可以不理老奶奶，直接去上学
  for (const x of GATE) d.exit(x, 2, 'class2A', 'start');

  // 指路的小箭头：一个指老奶奶，一个指校门，钱包出现之后也给一个
  d.hints = [
    { x: GRANNY[0], y: GRANNY[1], when: game => !game.flags.has('拿到撬棍') },
    { x: GATE[0], y: 2 },
    // 用 taken（捡过没有）而不是 bag（现在手里有没有）：
    // 钱包还给老奶奶之后会从书包里消失，用 bag 判断的话箭头会重新冒出来
    { x: WALLET[0], y: WALLET[1], when: game => game.flags.has('答应帮忙') && !game.taken.has('wallet') },
  ];

  d.npcs = [
    {
      name: '老奶奶', look: GRANNY_LOOK, x: GRANNY[0], y: GRANNY[1], dir: 'right', lines: [],
      linesFor(game) {
        // 已经给过礼物 -> 闲聊
        if (game.flags.has('拿到撬棍')) return [T('prologue.奶奶.之后')];
        // 钱包找到了 -> 道谢、给礼物，最后 Miss Ren 自己一句
        if (game.bag.includes('wallet')) return [
          T('prologue.奶奶.道谢'),
          T('prologue.奶奶.给'),
          { name: game.playerName, text: T('prologue.ren.收下') },
        ];
        // 答应了还没找到 -> 催一下
        if (game.flags.has('答应帮忙')) return [T('prologue.奶奶.还没找到')];
        return [];   // 第一次说话走 pagesFor，有选项
      },
      // 第一次搭话：求助 + 两个选择
      pagesFor(game) {
        if (game.flags.has('答应帮忙') || game.bag.includes('wallet') || game.flags.has('拿到撬棍')) return null;
        return [
          { name: '老奶奶', text: T('prologue.奶奶.求助') },
          {
            name: '老奶奶', text: T('prologue.奶奶.求助2'),
            choices: [
              { label: T('prologue.选项.帮'), onPick: game => {
                game.flags.add('答应帮忙');
                // 答应了，钱包这时才出现在草丛里
                game.dropItem(WALLET[0], WALLET[1], walletItem(), spriteWallet());
                game.save();
              } },
              { label: T('prologue.选项.无视'), onPick: () => {} },
            ],
          },
        ];
      },
      // 把钱包还给她 -> 收下钱包，给撬棍
      onTalk(game) {
        if (game.flags.has('拿到撬棍') || !game.bag.includes('wallet')) return;
        game.flags.add('拿到撬棍');
        game.bag = game.bag.filter(id => id !== 'wallet');   // 钱包还回去了
        game.giveItem({
          id: 'crowbar', name: T('item.撬棍.名字'), desc: T('item.撬棍.说明'),
          text: T('item.撬棍.入手'), color: '#9a5a3a',
        });
      },
    },
  ];
  return d;
}
