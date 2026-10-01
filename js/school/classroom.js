// ============================================================
//  场景：教室模板（1-A ~ 3-B 六间教室共用，buildClassroom('2A') 这样调用）
//  视角：从教室一侧看向另一侧（左 = 前 / 黑板，右 = 后，上 = 窗，下 = 走廊）
// ============================================================

const CW = 24, CH = 14;   // 教室大小（格）

// 预渲染整个教室的静态背景。视角：从教室一侧看向另一侧
//   上墙 = 窗户（外面是樱花）  左墙 = 前面（黑板、讲台）
//   右墙 = 后面（储物柜）      下墙 = 走廊一侧（左边前门、右边后门）
const CR_FRONT_DOOR = [4, 5], CR_BACK_DOOR = [19, 20];   // 门在下墙上占的列

function renderClassroom(A, seed, artKind) {
  const c = makeCanvas(CW * 16, CH * 16), g = c.getContext('2d'), r = makeRng(88 + seed);
  const FLOOR_Y0 = 48, FLOOR_Y1 = (CH - 1) * 16;
  // 地板（左边 1~3 列是讲台）
  for (let y = 3; y < CH - 1; y++) for (let x = 1; x < CW - 1; x++) {
    g.drawImage((x <= 3 ? A.stage : A.floor)[(r() * 3) | 0], x * 16, y * 16);
  }
  // 讲台边缘的台阶阴影
  px(g, '#8a5e38', 4 * 16 - 2, FLOOR_Y0, 2, FLOOR_Y1 - FLOOR_Y0);
  px(g, 'rgba(60,30,10,0.25)', 4 * 16, FLOOR_Y0, 3, FLOOR_Y1 - FLOOR_Y0);

  // ---- 上墙：一排大窗户 ----
  px(g, WALL, 0, 0, CW * 16, 48);
  px(g, TRIM, 0, 0, CW * 16, 4); px(g, '#8a6a4a', 0, 3, CW * 16, 1);
  px(g, '#b08a5c', 0, 43, CW * 16, 5); px(g, TRIM, 0, 43, CW * 16, 1);   // 踢脚板
  const panes = [];
  for (let x = 40; x + 52 <= 300; x += 58) panes.push(x);
  for (const x0 of panes) {
    const y0 = 9, w = 52, h = 30;
    px(g, PAL.k, x0 - 2, y0 - 2, w + 4, h + 5);
    px(g, '#9aa0ac', x0 - 1, y0 - 1, w + 2, h + 3);
    // 天空渐变
    const sky = g.createLinearGradient(0, y0, 0, y0 + h);
    sky.addColorStop(0, '#7cc4ec'); sky.addColorStop(1, '#d4eef8');
    g.fillStyle = sky; g.fillRect(x0, y0, w, h);
    // 云
    px(g, '#ffffff', x0 + 6 + ((r() * 20) | 0), y0 + 4, 12, 3); px(g, '#ffffff', x0 + 10 + ((r() * 20) | 0), y0 + 3, 6, 1);
    // 窗外的樱花树冠
    for (let i = 0; i < 7; i++) {
      const cx = x0 + ((r() * w) | 0), cy = y0 + h - 4 - ((r() * 8) | 0), rr = 4 + ((r() * 4) | 0);
      g.fillStyle = r() < 0.5 ? PAL.pink : PAL.pinkLight;
      g.beginPath(); g.arc(cx, cy, rr, 0, Math.PI * 2); g.fill();
    }
    // 窗框竖梃和高光
    px(g, '#9aa0ac', x0 + (w >> 1) - 1, y0, 2, h);
    px(g, 'rgba(255,255,255,0.45)', x0 + 4, y0 + 2, 2, 12); px(g, 'rgba(255,255,255,0.45)', x0 + (w >> 1) + 4, y0 + 2, 2, 12);
    px(g, '#d8d0bc', x0 - 3, y0 + h + 2, w + 6, 3);                // 窗台
  }
  // 窗户之间的窗帘
  for (const x0 of panes) {
    for (const cx of [x0 - 7, x0 + 53]) { px(g, PAL.k, cx, 6, 6, 36); px(g, '#f0e8d0', cx + 1, 7, 4, 34); px(g, '#d8ceb4', cx + 3, 7, 1, 34); }
  }
  // 时钟（靠前面）
  g.drawImage(fromStrings(CLOCK, { k: PAL.k, w: '#f4efe4' }), 16, 14);
  // 窗户和公告栏之间的空墙上，挂一幅小的竖画
  drawScroll(g, 276, 7, 26, 32, artKind);
  // 公告栏（靠后面）
  px(g, PAL.k, 312, 8, 48, 32); px(g, '#c8945a', 313, 9, 46, 30);
  for (const [x, y, w, h, pin] of [[316, 12, 12, 16, '#d4443c'], [331, 11, 14, 10, '#3e6ab0'], [332, 24, 10, 12, '#4a9a52'], [347, 14, 10, 14, '#f2d24a']]) {
    px(g, '#f4efe4', x, y, w, h); px(g, '#b8b0a0', x + 2, y + 3, w - 4, 1); px(g, '#b8b0a0', x + 2, y + 6, w - 5, 1);
    px(g, pin, x + (w >> 1), y, 2, 2);
  }

  // 窗外照进来的阳光（往右下斜）
  g.fillStyle = 'rgba(255,236,170,0.2)';
  for (const x0 of panes) {
    g.beginPath();
    g.moveTo(x0 + 2, FLOOR_Y0); g.lineTo(x0 + 50, FLOOR_Y0); g.lineTo(x0 + 110, FLOOR_Y0 + 96); g.lineTo(x0 + 62, FLOOR_Y0 + 96);
    g.closePath(); g.fill();
  }

  // ---- 左墙（前面）：侧面看到的黑板 ----
  px(g, WALL_SIDE, 0, FLOOR_Y0, 16, FLOOR_Y1 - FLOOR_Y0);
  px(g, '#b8ae98', 15, FLOOR_Y0, 1, FLOOR_Y1 - FLOOR_Y0);
  const by0 = 4 * 16 - 4, by1 = 11 * 16 + 4;
  px(g, PAL.k, 1, by0 - 2, 12, by1 - by0 + 4);
  px(g, '#7a5232', 2, by0 - 1, 10, by1 - by0 + 2);
  px(g, '#2f5a44', 3, by0, 8, by1 - by0);
  for (let i = 0; i < 26; i++) {       // 从侧面看，粉笔字就是一道道短横线
    const col = r() < 0.15 ? '#f6c8d8' : r() < 0.2 ? '#f2d24a' : '#dfe8df';
    px(g, col, 4 + ((r() * 4) | 0), by0 + 4 + ((r() * (by1 - by0 - 8)) | 0), 2 + ((r() * 3) | 0), 1);
  }
  px(g, PAL.k, 12, by0 - 1, 3, by1 - by0 + 2); px(g, '#5a3a22', 12, by0, 2, by1 - by0);   // 粉笔槽
  for (const [y, col] of [[20, '#f4efe4'], [26, '#f6a8c4'], [80, '#f2d24a']]) px(g, col, 12, by0 + y, 1, 4);

  // ---- 右墙（后面） ----
  const RX = (CW - 1) * 16;
  px(g, WALL_SIDE, RX, FLOOR_Y0, 16, FLOOR_Y1 - FLOOR_Y0);
  px(g, '#b8ae98', RX, FLOOR_Y0, 1, FLOOR_Y1 - FLOOR_Y0);

  // ---- 下墙（走廊一侧，只看得到墙顶），前门 / 后门 ----
  px(g, '#5a4a3a', 0, FLOOR_Y1, CW * 16, 16);
  px(g, '#7a6a58', 0, FLOOR_Y1, CW * 16, 2);
  for (const [a, b] of [CR_FRONT_DOOR, CR_BACK_DOOR]) {
    const x0 = a * 16, w = (b - a + 1) * 16;
    px(g, '#8a8e9a', x0, FLOOR_Y1 - 1, w, 1);                       // 门轨
    px(g, PAL.k, x0, FLOOR_Y1, w, 16);
    for (const half of [0, 1]) {                                     // 两扇拉门
      const dx = x0 + 1 + half * (w >> 1);
      px(g, '#a87a4a', dx, FLOOR_Y1 + 1, (w >> 1) - 2, 14); px(g, '#c09060', dx, FLOOR_Y1 + 1, (w >> 1) - 2, 2);
      px(g, '#a8d8ee', dx + 4, FLOOR_Y1 + 5, (w >> 1) - 10, 5);      // 门上的小窗
    }
    px(g, '#5a3a22', x0 + (w >> 1) - 3, FLOOR_Y1 + 8, 2, 4);        // 把手
  }
  return c;
}

function buildClassroomArt(seed, artKind) {
  const A = {};
  A.floor = [0, 1, 2].map(i => floorTile(10 + i, WOOD));
  A.stage = [0, 1, 2].map(i => floorTile(20 + i, WOOD_STAGE));
  const r = makeRng(seed);
  A.desks = Array.from({ length: 20 }, () => spriteDesk(r));
  A.chair = spriteChair();
  A.teacherDesk = spriteTeacherDesk();
  A.shelves = Array.from({ length: 8 }, () => spriteShelf(r));
  A.plant = spritePlant();
  A.trash = spriteTrash();
  A.room = renderClassroom(A, seed, artKind);
  return A;
}

// ============================================================
//  六间教室（1-A ~ 3-B）共用同一个模板：大小、格局完全一样，
//  只有班名、黑板/公告栏内容、桌上的小东西、同学和老师不同。
//  open: true 的教室才能从走廊进去（现在只开放 2-A）
// ============================================================
const CLASSES = {
  '1A': { open: false, seed: 11,
    locked: '1年A班。门上贴着“美术课中，请保持安静”。',
    board: '黑板上画着一幅粉笔静物画——苹果和花瓶。',
    notice: '公告栏。新生欢迎会的照片被压在下面，\n上面那张写着：“高一不狠，高三无分”。',
    window: '窗外就是操场，离地面很近，能听到足球部的喊声。',
    npcs: [
      { name: '美术老师·冈本', look: LOOK.teacher, x: 2, y: 7, dir: 'right', lines: ['素描要先观察，再动笔哦。'] },
      { name: '一年级·小春', look: LOOK.sailor('#c89a4a', '#9a723a'), x: 13, y: 7, dir: 'left', lines: ['苹果怎么画都像土豆……'] },
    ] },
  '1B': { open: false, seed: 12,
    locked: '1年B班。里面传出合唱的声音。',
    board: '黑板上写着合唱比赛的曲目和声部分配。',
    notice: '公告栏。合唱比赛的时间表旁边贴着一张：\n“唱得再好听，不如多考十分”。',
    window: '窗外就是操场，离地面很近，能听到足球部的喊声。',
    npcs: [
      { name: '音乐老师·藤井', look: LOOK.teacher, x: 2, y: 7, dir: 'right', lines: ['女高音再大声一点！'] },
      { name: '一年级·大树', look: LOOK.gakuran('#6a4430', '#4a2c20'), x: 14, y: 7, dir: 'left', lines: ['我是男低音……其实根本唱不出来。'] },
    ] },
  '2A': { open: true, seed: 55,
    board: '黑板上写着“欢迎新同学！”\n旁边还有谁用粉笔画的小樱花。',
    notice: '公告栏。社团招新的海报角上，\n压着一张更大的红纸：“距离高考还有 664 天”。',
    window: '窗外是操场，樱花正开得热闹。\n风一吹，花瓣就飘进了教室。',
    seat: { x: 18, y: 4, text: '你的座位——靠窗最后一排。\n据说这是“主角专属座位”。' },
    npcs: [
      { name: '班主任·森老师', look: LOOK.teacher, x: 2, y: 7, dir: 'right', lines: ['早上好。你就是今天转来的同学吧？', '你的座位在靠窗那排的最后面。\n上课铃响之前，先和大家打个招呼吧。'] },
      { name: '美咲', look: LOOK.sailor('#6a3a2a', '#4a2418'), x: 13, y: 7, dir: 'right', lines: ['啊，你就是转学生？我是美咲，班长哦。', '有什么不懂的尽管问我！'] },
      { name: '健太', look: LOOK.gakuran('#c89a4a', '#9a723a'), x: 14, y: 7, dir: 'left', lines: ['哟！新来的？放学后要不要一起去小卖部？', '听说今天炒面面包会打折！'] },
      { name: '雪乃', look: LOOK.sailor('#2a2438', '#1a1428'), x: 6, y: 3, dir: 'up', lines: ['……', '（她一直望着窗外，好像没注意到你。）'] },
      { name: '千夏', look: LOOK.sailor('#e0b040', '#b08a30'), x: 20, y: 9, dir: 'left', lines: ['嘿嘿，要不要看我新买的发卡？', '……啊，老师在看这边，一会儿再说！'] },
    ] },
  '2B': { open: false, seed: 22,
    locked: '2年B班。现在好像在上体育课，门锁着。',
    board: '黑板上写着“体育课：操场集合！”，下面画了个哭脸。',
    notice: '公告栏。球技大会的对战表上，\n有人用红笔写了一行：“打球的时间，别人在做题”。',
    window: '窗外是操场，2B 的同学正在跑八百米。',
    npcs: [] },
  '3A': { open: false, seed: 31,
    locked: '3年A班。里面安静得可怕——大家都在自习备考。',
    board: '黑板上写满了数学公式，角落写着\n“熬过高三，你想睡多久睡多久”。',
    notice: '公告栏。模拟考试的成绩条贴成一整面墙，\n最上面一行写着：“提高一分，干掉一万人”。',
    window: '从三楼的窗户能看到整个小镇，远处还有海。',
    npcs: [
      { name: '三年级·真理', look: LOOK.sailor('#4a3a2a', '#2e2418'), x: 13, y: 7, dir: 'left', lines: ['嘘——大家都在复习呢。'] },
    ] },
  '3B': { open: false, seed: 32,
    locked: '3年B班。黑板上写着“距离高考还有 300 天”。',
    board: '黑板角上写着“距离高考还有 264 天”，\n数字被擦了又写，那块黑板都磨白了。',
    notice: '公告栏。毕业旅行的意见征集表是空白的。\n旁边写着：“六月之前，哪儿也别想去”。',
    window: '从三楼的窗户能看到整个小镇，远处还有海。',
    npcs: [] },
};

// 每个班散落的课本：两三本，放在储物格和课桌抽屉里
// pos 是格子坐标；desc 是书包里显示的一句小字
const CLASS_BOOKS = {
  '1A': [
    { pos: [22, 6], id: '1a_art', name: '美术课本', color: '#4a7a8a', desc: '一年级',
      text: '储物格里塞着一本美术课本。\n翻开的那页夹着一张速写：窗外的樱花树，\n右下角写着“画不像，但感觉是有的”。' },
    { pos: [9, 6], id: '1a_word', name: '崭新的单词本', color: '#8a7a3a', desc: '只写了一页',
      text: '抽屉里是一本崭新的单词本。\n第一页工工整整地写着名字和日期，\n后面全是空白。' },
  ],
  '1B': [
    { pos: [22, 7], id: '1b_score', name: '合唱谱', color: '#6a8a4a', desc: '背面有涂鸦',
      text: '一本卷了角的合唱谱。\n背面有人用铅笔写：“唱得再好听，不如多考十分”，\n下面又被另一个笔迹划掉了。' },
    { pos: [12, 8], id: '1b_math', name: '数学练习册', color: '#8a4a3a', desc: '只做到第三页',
      text: '抽屉里的数学练习册，只做到第三页。\n第四页开始，答案栏全是空的。' },
  ],
  '2A': [
    { pos: [22, 5], id: '2a_math', name: '数学课本', color: '#3a5a8a', desc: '写满批注',
      text: '储物格里的数学课本，页边写满了批注。\n最后一页只有一行字：\n“今天也没能听懂。明天再来。”' },
    { pos: [15, 8], id: '2a_manga', name: '夹在课本里的漫画', color: '#c86a8a', desc: '第 3 卷',
      text: '抽屉深处藏着一本漫画，外面套着课本的书皮。\n扉页写着“健太的，看完还我”。' },
    { pos: [6, 10], id: '2a_bio', name: '旧生物图鉴', color: '#4a7a4a', desc: '缺了一页',
      text: '一本很旧的生物图鉴，借书卡还夹在里面。\n目录上“寄生”那一节被人整页撕掉了，\n撕口很新。' },
  ],
  '2B': [
    { pos: [22, 6], id: '2b_pe', name: '体育课笔记', color: '#8a6a3a', desc: '全是圈数',
      text: '储物格里的笔记本，每一页都只记着跑了几圈。\n最后一页写着：“今天又是最后一名。”' },
    { pos: [12, 4], id: '2b_wuyear', name: '《五年高考三年模拟》', color: '#b03a3a', desc: '扉页有字',
      text: '很厚的一本习题集，书脊已经裂开。\n扉页上写着：“妈妈买的，说这本最有用。”' },
  ],
  '3A': [
    { pos: [22, 8], id: '3a_wrong', name: '错题本', color: '#a03a3a', desc: '红笔写满',
      text: '一本被翻烂的错题本，红笔写得密密麻麻。\n越到后面，字迹越乱，\n最后几页只剩下潦草的“再来一遍”。' },
    { pos: [18, 6], id: '3a_guide', name: '志愿填报指南', color: '#3a6a5a', desc: '折角很多',
      text: '抽屉里的志愿填报指南，折了很多角。\n被折起来的那几页，学校都在很远的地方。' },
  ],
  '3B': [
    { pos: [22, 9], id: '3b_count', name: '倒计时手账', color: '#5a4a7a', desc: '最近三天空白',
      text: '一本倒计时手账，每天一行。\n“还有 267 天”“还有 266 天”“还有 265 天”……\n最近三天是空的。' },
    { pos: [9, 10], id: '3b_album', name: '毕业纪念册', color: '#8a8a4a', desc: '还没人写',
      text: '崭新的毕业纪念册，一个字都还没人写。\n第一页印着：“愿你前程似锦”。' },
  ],
};

const DESK_COLS = [6, 9, 12, 15, 18], DESK_ROWS = [4, 6, 8, 10];
const NAMES = ['佐藤', '铃木', '高桥', '田中', '伊藤', '渡边', '山本', '中村', '小林', '加藤', '吉田', '山田', '松本', '井上', '木村', '林', '清水', '森', '池田'];
const classSceneId = key => 'class' + key;            // '2A' -> 'class2A'
const classLabel = key => key[0] + '年' + key[1] + '班'; // '2A' -> '2年A班'

function buildClassroom(key) {
  const C = CLASSES[key], floor = +key[0];
  const art = buildClassroomArt(C.seed, CLASS_ART[key].kind);
  const d = sceneBuilder(CW, CH);
  d.id = classSceneId(key); d.name = classLabel(key) + ' 教室'; d.bg = art.room;

  for (let x = 0; x < CW; x++) { d.setSolid(x, 0); d.setSolid(x, 1); d.setSolid(x, 2); d.setSolid(x, CH - 1); }
  for (let y = 0; y < CH; y++) { d.setSolid(0, y); d.setSolid(CW - 1, y); }

  for (let x = 2; x <= 18; x++) d.spot(x, 2, '', C.window);
  d.spot(1, 2, '', '墙上的时钟。离上课还有一会儿。');
  for (const x of [19, 20, 21, 22]) d.spot(x, 2, '', C.notice);
  for (const x of [17, 18]) d.spot(x, 2, '', paintingText(CLASS_ART[key]));
  for (let y = 3; y < CH - 1; y++) d.spot(0, y, '', C.board);

  // 门 -> 对应楼层的走廊
  const hall = FLOORS[floor].id;
  for (const x of CR_FRONT_DOOR) d.exit(x, CH - 1, hall, key + '_front');
  for (const x of CR_BACK_DOOR) d.exit(x, CH - 1, hall, key + '_back');
  d.entries.start = { x: 4, y: 12, dir: 'up' };
  d.entries.front = { x: 4, y: 12, dir: 'up' };
  d.entries.back = { x: 20, y: 12, dir: 'up' };

  // 课桌 + 椅子（椅子在右边）
  const r = makeRng(C.seed);
  let n = 0;
  for (const dy of DESK_ROWS) for (const dx of DESK_COLS) {
    const mine = C.seat && dx === C.seat.x && dy === C.seat.y;
    const who = NAMES[(n + C.seed) % NAMES.length];
    d.prop(dx, dy, art.desks[n]); d.setSolid(dx, dy);
    d.prop(dx + 1, dy, art.chair); d.setSolid(dx + 1, dy);
    const t = mine ? C.seat.text
      : `${who}的座位。${['课桌里塞满了讲义。', '桌角刻着一个小小的涂鸦。', '桌上摆得整整齐齐。', '抽屉里好像藏着漫画……'][((r() * 4) | 0)]}`;
    d.spot(dx, dy, '', t); d.spot(dx + 1, dy, '', t);
    n++;
  }
  // 讲台桌（竖放，占 1x2 格）
  d.props.push({ img: art.teacherDesk, x: 3 * 16, y: 9 * 16 - art.teacherDesk.height, base: 9 * 16 - 1 });
  for (const y of [7, 8]) { d.setSolid(3, y); d.spot(3, y, '', '讲台桌。上面放着出席簿和一盒彩色粉笔。'); }
  // 教室后面：储物柜靠右墙竖着排
  for (let y = 4; y <= 11; y++) { d.prop(22, y, art.shelves[y - 4]); d.setSolid(22, y); d.spot(22, y, '', '储物格。大家的书包和运动服都塞在这里。'); }
  d.prop(22, 3, art.plant); d.setSolid(22, 3); d.spot(22, 3, '', '教室角落的盆栽。好像是值日生在浇水。');
  d.prop(22, 12, art.trash); d.setSolid(22, 12); d.spot(22, 12, '', '垃圾桶。分类贴纸已经有点翘起来了。');

  // 散落的课本
  for (const b of CLASS_BOOKS[key] || []) d.item(b.pos[0], b.pos[1], b);

  d.npcs = C.npcs;

  // 从上面的窗户飘进来的花瓣
  d.overlay = (g, cx, cy, time) => {
    for (let i = 0; i < 6; i++) {
      const t = (time * 0.15 + i / 6) % 1;
      const X = 50 + i * 42 + t * 60 + Math.sin(time * 2 + i) * 6 - cx, Y = 44 + t * 120 - cy;
      g.fillStyle = i % 2 ? PAL.pink : PAL.pinkLight;
      g.fillRect(Math.round(X), Math.round(Y), 2, 1);
    }
  };
  return d;
}
