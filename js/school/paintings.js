// ============================================================
//  挂画：两边楼梯旁各一幅
//    右边 = 去程（启航 → 塞壬 → 独眼巨人 → 两难 → 冥府问亡）
//    左边 = 归途（织布 → 喀耳刻 → 卡吕普索 → 射箭试炼）
//  画得不求像，求那个味道：剪影 + 昏暗的底色 + 金色画框 + 一块铜牌
//  走近按 E 会念出画名和铜牌上的校训
// ============================================================

const ODYSSEY = {
  1: { kind: 'sail', title: '启航', motto: '拼一载春秋，搏一生无悔',
    desc: '船离开港口，岸上的人挥着手。' },
  2: { kind: 'siren', title: '塞壬', motto: '手机一响，前途泡汤',
    desc: '水手把自己绑在桅杆上，堵住耳朵。礁石上有人在唱歌。' },
  3: { kind: 'cyclops', title: '独眼巨人', motto: '能吃苦吃半辈子苦，不吃苦吃一辈子苦',
    desc: '洞里的巨人抓起了一个水手。' },
  4: { kind: 'strait', title: '两难', motto: '除了高考，你别无选择',
    desc: '小船夹在漩涡和六头怪之间。' },
  5: { kind: 'nekyia', title: '冥府问亡', motto: '学长学姐的今天，就是你的明天',
    desc: '他站在坑边，亡魂一个个围上来说话。' },
};

// 左边楼梯：归途。都是“熬”和“等”的题材
const ODYSSEY_BACK = {
  1: { kind: 'weaving', title: '织布', motto: '今天多流一滴汗，明天少流一滴泪',
    desc: '她白天织，夜里又把织好的拆掉，日复一日。' },
  2: { kind: 'circe', title: '喀耳刻的宴席', motto: '贪一时安逸，毁一生前程',
    desc: '喝下那杯酒的人，都变成了猪。' },
  3: { kind: 'calypso', title: '卡吕普索之岛', motto: '舒服是留给死人的',
    desc: '仙女许他永生，他却每天坐在海边望着家的方向。' },
  4: { kind: 'bowtest', title: '射箭试炼', motto: '多拿一分，干掉一万人',
    desc: '那张弓只有他拉得开，一箭穿过十二把斧头。' },
};

// 走廊和房间里的受难系挂画
const SUFFER = {
  sisyphus: { kind: 'sisyphus', title: '西西弗斯', motto: '只要学不死，就往死里学',
    desc: '他把石头推上山顶，石头又滚了下去。' },
  prometheus: { kind: 'prometheus', title: '普罗米修斯', motto: '掉皮掉肉不掉队，流血流汗不流泪',
    desc: '他被锁在岩石上，鹰每天飞来啄食他的肝，夜里又长回去。' },
  saturn: { kind: 'saturn', title: '农神吞噬其子', motto: '严师出高徒',
    desc: '他怕孩子有一天取代自己，于是先把他们吃掉了。' },
  pieta: { kind: 'pieta', title: '圣母怜子', motto: '老师永远等你回来',
    desc: '她抱着从十字架上取下来的孩子，一句话也没有说。' },
};

// 五楼平台：原本开窗的位置，换成这一幅
const MURAL = { kind: 'relief', title: '壁画', motto: '奉献者，终将被铭记',
  desc: '石板上刻着一个张开双臂的身影，下面跪着一排人。\n那轮廓不太像人——头太长了，背后还拖着什么。' };
// 备用：海难（船员偷宰了太阳神的牛，全船覆没）
const WRECK = { kind: 'wreck', title: '海难', motto: '一人犯错，全体连坐',
  desc: '船员偷宰了太阳神的牛。一道雷劈下来，整条船都没了，只有他一个人活着。' };

// 教室里那幅小的竖画（不装框，细杆挂着，纸面发黄）
const SCROLL_PLATE = '纸的下方印着一行字';
const CLASS_ART = {
  '1A': { kind: 'ladder', plate: SCROLL_PLATE, title: '天梯', motto: '现在不努力，将来徒伤悲',
    desc: '一架梯子一直通到云里，梯子上爬着两个很小的人。' },
  '1B': { kind: 'vanitas', plate: SCROLL_PLATE, title: '烛', motto: '两眼一睁，开始竞争；两眼一闭，还在竞争',
    desc: '一支快烧到底的蜡烛，蜡油堆在下面的骷髅上。' },
  '2A': { kind: 'sebastian', plate: SCROLL_PLATE, title: '圣塞巴斯蒂安', motto: '不为失败找理由，只为成功找方法',
    desc: '他被绑在柱子上，身上插满了箭，表情却很平静。' },
  '2B': { kind: 'icarus', plate: SCROLL_PLATE, title: '伊卡洛斯', motto: '没有伞的孩子，必须努力奔跑',
    desc: '翅膀化了，少年头朝下坠向海面，羽毛散了一路。' },
  '3A': { kind: 'flagellation', plate: SCROLL_PLATE, title: '鞭笞', motto: '累死你一个，幸福你全家',
    desc: '他被绑在石柱上，两条鞭子正落下来。' },
  '3B': { kind: 'babel', plate: SCROLL_PLATE, title: '巴别塔', motto: '不积跬步，无以至千里',
    desc: '一座越修越高的塔，塔顶已经伸进了乌云里。' },
};

// 细杆 + 两根挂绳 + 发黄的纸
function drawScroll(g, X, Y, W, H, kind) {
  const K = PAL.k;
  px(g, K, X - 2, Y, W + 4, 2); px(g, '#8a6a42', X - 2, Y, W + 4, 1);          // 上面的横杆
  px(g, '#8a8070', X + 3, Y - 3, 1, 3); px(g, '#8a8070', X + W - 4, Y - 3, 1, 3);   // 挂绳
  px(g, K, X - 1, Y + 2, W + 2, H);
  px(g, '#e8e0c8', X, Y + 3, W, H - 2); px(g, '#d8cfb0', X, Y + H, W, 1);
  (SCROLL_ART[kind] || (() => {}))(g, X + 2, Y + 5, W - 4, H - 8);
  px(g, K, X - 2, Y + H + 2, W + 4, 2); px(g, '#8a6a42', X - 2, Y + H + 2, W + 4, 1);   // 下面的横杆
}

const SCROLL_ART = {
  // 天梯：一直通到云里的梯子
  ladder: (g, x, y, w, h) => {
    px(g, '#2a3550', x, y, w, h);
    px(g, '#e8e4d0', x, y, w, 5); px(g, '#c8c8c0', x + 2, y + 4, w - 4, 2);            // 云
    const lx = x + (w >> 1) - 3;
    px(g, '#8a6a42', lx, y + 4, 2, h - 4); px(g, '#8a6a42', lx + 5, y + 4, 2, h - 4);
    for (let j = y + 7; j < y + h; j += 4) px(g, '#a8845a', lx, j, 7, 1);
    px(g, '#14121a', lx + 1, y + 11, 3, 4); px(g, '#14121a', lx + 3, y + 20, 3, 4);     // 两个爬梯子的人
    px(g, '#e0bb92', lx + 2, y + 10, 2, 2); px(g, '#e0bb92', lx + 4, y + 19, 2, 2);
  },
  // 烛：快烧完的蜡烛和底下的骷髅
  vanitas: (g, x, y, w, h) => {
    px(g, '#241f22', x, y, w, h);
    const cx = x + (w >> 1);
    px(g, '#f6d060', cx - 1, y + 2, 2, 4); px(g, '#fff0b0', cx, y + 3, 1, 2);           // 火苗
    px(g, '#e8e0c8', cx - 3, y + 6, 6, 9); px(g, '#c8bfa0', cx + 1, y + 6, 2, 9);       // 蜡烛
    px(g, '#d8cfb0', cx - 4, y + 14, 8, 2);
    const sy = y + h - 10;
    px(g, '#ded6c4', cx - 5, sy, 10, 7); px(g, '#241f22', cx - 3, sy + 2, 2, 2); px(g, '#241f22', cx + 1, sy + 2, 2, 2);
    px(g, '#241f22', cx - 1, sy + 5, 2, 2); px(g, '#c0b8a4', cx - 4, sy + 7, 8, 2);     // 骷髅
  },
  // 圣塞巴斯蒂安：绑在柱子上，满身是箭
  sebastian: (g, x, y, w, h) => {
    px(g, '#2e2620', x, y, w, h);
    const cx = x + (w >> 1);
    px(g, '#6a6258', cx - 3, y, 6, h); px(g, '#8a8278', cx - 3, y, 2, h);               // 柱子
    px(g, '#e8c8a0', cx - 3, y + 6, 6, 14); px(g, '#e0bb92', cx - 2, y + 2, 4, 4);      // 人
    px(g, '#c8a880', cx - 5, y + 7, 2, 5); px(g, '#c8a880', cx + 3, y + 7, 2, 5);
    px(g, '#9a8a70', cx - 4, y + 5, 8, 1);                                               // 绑着的绳
    for (const [ax, ay, dx] of [[-6, 9, 1], [4, 12, -1], [-5, 15, 1], [3, 17, -1]]) {    // 箭
      px(g, '#8a6a42', cx + ax, y + ay, 4, 1);
      px(g, '#d8d4c8', cx + ax + (dx > 0 ? 0 : 3), y + ay - 1, 1, 3);
      px(g, '#8a2a2a', cx + ax + (dx > 0 ? 4 : -1), y + ay, 1, 1);
    }
  },
  // 伊卡洛斯：翅膀化了，头朝下坠向海
  icarus: (g, x, y, w, h) => {
    const sky = g.createLinearGradient(0, y, 0, y + h);
    sky.addColorStop(0, '#f0c070'); sky.addColorStop(1, '#8ab0d0');
    g.fillStyle = sky; g.fillRect(x, y, w, h);
    px(g, '#fff0b0', x + w - 7, y + 1, 5, 5);                                            // 太阳
    px(g, '#2a5a8a', x, y + h - 6, w, 6); px(g, '#4a7aa8', x, y + h - 6, w, 1);          // 海
    const cx = x + (w >> 1) - 2;
    px(g, '#14121a', cx, y + 12, 3, 6); px(g, '#e0bb92', cx, y + 17, 3, 3);              // 头朝下的人
    px(g, '#14121a', cx - 3, y + 13, 3, 2); px(g, '#14121a', cx + 3, y + 14, 3, 2);
    for (const [fx, fy] of [[-5, 6], [4, 4], [-2, 2], [6, 9]]) px(g, '#f4efe4', cx + fx, y + fy, 2, 1);   // 散落的羽毛
  },
  // 鞭笞：绑在石柱上，两条鞭子
  flagellation: (g, x, y, w, h) => {
    px(g, '#2a2420', x, y, w, h);
    const cx = x + (w >> 1) - 1;
    px(g, '#7a7268', cx - 2, y, 5, h); px(g, '#9a9288', cx - 2, y, 2, h);                // 石柱
    px(g, '#e8c8a0', cx - 2, y + 8, 5, 13); px(g, '#e0bb92', cx - 1, y + 4, 3, 4);       // 被绑的人
    px(g, '#9a8a70', cx - 3, y + 7, 7, 1); px(g, '#9a8a70', cx - 3, y + 14, 7, 1);
    for (const [ax, ay] of [[-8, 6], [5, 10]]) {                                          // 抽下来的鞭子
      for (let i = 0; i < 5; i++) px(g, '#5a4a3a', cx + ax + (ax < 0 ? i : -i), y + ay + i, 1, 1);
    }
    px(g, '#8a2a2a', cx, y + 12, 2, 1); px(g, '#8a2a2a', cx + 1, y + 16, 1, 1);
  },
  // 巴别塔：越修越高，塔顶伸进乌云
  babel: (g, x, y, w, h) => {
    px(g, '#c8b48a', x, y, w, h);
    px(g, '#4a4450', x, y, w, 7); px(g, '#5e586a', x, y + 6, w, 2);                      // 乌云
    const cx = x + (w >> 1);
    for (let i = 0; i < 6; i++) {                                                         // 一层层收窄的塔身
      const tw = w - 4 - i * 2, ty = y + h - 4 - i * 4;
      px(g, '#8a6a4a', cx - (tw >> 1), ty, tw, 4);
      px(g, '#a8845a', cx - (tw >> 1), ty, tw, 1);
      px(g, '#6a4a30', cx - (tw >> 1) + 1 + ((i * 3) % 4), ty + 1, 2, 2);                // 盘旋的坡道
    }
    px(g, '#3a3428', x, y + h - 2, w, 2);
  },
};

function paintingText(n) {
  return `《${n.title}》——${n.desc}\n${n.plate || '铜牌上写着'}：『${n.motto}』`;
}

// 细金框：外面一圈描边，两像素金色，里面再一圈描边
function drawPainting(g, X, Y, W, H, kind) {
  const K = PAL.k;
  px(g, K, X - 1, Y - 1, W + 2, H + 2);
  px(g, '#d8b048', X, Y, W, H);
  px(g, '#f0d488', X, Y, W, 1); px(g, '#f0d488', X, Y, 1, H);
  px(g, '#a07c26', X, Y + H - 1, W, 1); px(g, '#a07c26', X + W - 1, Y, 1, H);
  px(g, K, X + 2, Y + 2, W - 4, H - 4);
  const x = X + 3, y = Y + 3, w = W - 6, h = H - 6;
  (SCENES_ART[kind] || (() => {}))(g, x, y, w, h);
}

// 钉在墙上的一叠素描（大卫的手稿）：不装框，直接钉在墙上
function drawSketchSheet(g, X, Y, W, H) {
  const K = PAL.k, INK = '#3a3428';
  px(g, K, X - 1, Y - 1, W + 2, H + 2);
  px(g, '#e8e0c8', X, Y, W, H); px(g, '#d8cfb0', X, Y + H - 3, W, 3);
  px(g, '#f4eeda', X + 1, Y + 1, W - 2, 1);
  // 蜷曲的幼体
  const ax = X + 8, ay = Y + H - 12;
  px(g, INK, ax, ay - 6, 7, 2); px(g, INK, ax - 2, ay - 4, 2, 5); px(g, INK, ax + 6, ay - 5, 2, 6);
  px(g, INK, ax, ay + 1, 8, 2); px(g, INK, ax + 3, ay - 3, 2, 4);
  // 细长的头骨侧面
  const bx = X + (W >> 1) + 2, by = Y + 6;
  px(g, INK, bx, by, 14, 2); px(g, INK, bx - 2, by + 1, 4, 4); px(g, INK, bx + 12, by + 1, 4, 3);
  px(g, INK, bx + 2, by + 4, 9, 1); px(g, INK, bx + 1, by + 2, 1, 1);
  // 多关节的手
  const hx = X + W - 14, hy = Y + H - 13;
  px(g, INK, hx, hy + 6, 6, 2);
  for (let i = 0; i < 4; i++) px(g, INK, hx + i * 2, hy + 1 + (i % 2), 1, 5);
  // 批注和被划掉的一处
  for (let i = 0; i < 4; i++) px(g, '#9a9280', X + 4, Y + 4 + i * 3, 10 + (i % 2) * 6, 1);
  px(g, '#8a3a3a', X + W - 20, Y + 3, 12, 1); px(g, '#8a3a3a', X + W - 18, Y + 6, 9, 1);
  // 图钉
  px(g, '#d4443c', X + 3, Y + 1, 2, 2); px(g, '#3e6ab0', X + W - 5, Y + 1, 2, 2);
}

// 每幅画的内容。x,y,w,h 是画框里面的范围
const SCENES_ART = {
  // 启航：朝阳、海面、离港的船，岸上有人挥手
  sail: (g, x, y, w, h) => {
    const sea = y + h - 9;
    const sky = g.createLinearGradient(0, y, 0, sea);
    sky.addColorStop(0, '#f0b070'); sky.addColorStop(1, '#f6e0b0');
    g.fillStyle = sky; g.fillRect(x, y, w, sea - y);
    px(g, '#f8e8a0', x + w - 14, y + 3, 7, 7); px(g, '#fff4c8', x + w - 13, y + 4, 4, 4);   // 朝阳
    px(g, '#3a6a94', x, sea, w, h - (sea - y)); px(g, '#5a8ab0', x, sea, w, 1);
    for (let i = 0; i < 4; i++) px(g, '#78a4c4', x + 3 + i * 9, sea + 3 + (i % 2) * 3, 5, 1);
    // 船
    const bx = x + w - 24, by = sea - 1;
    px(g, PAL.k, bx, by, 13, 4); px(g, '#3a2a20', bx + 1, by, 11, 2);
    px(g, PAL.k, bx + 6, by - 12, 1, 12);
    px(g, '#f4efe4', bx + 7, by - 11, 6, 8); px(g, '#d8cdb8', bx + 7, by - 5, 6, 2);
    // 码头和挥手的人
    px(g, '#5a4a3a', x, sea - 2, 12, 4);
    for (const dx of [2, 6, 9]) { px(g, PAL.k, x + dx, sea - 7, 2, 5); px(g, PAL.k, x + dx + 2, sea - 9, 1, 2); }
  },

  // 塞壬：夜航，水手绑在桅杆上，礁石上的歌声
  siren: (g, x, y, w, h) => {
    const sea = y + h - 10;
    const sky = g.createLinearGradient(0, y, 0, sea);
    sky.addColorStop(0, '#1a2038'); sky.addColorStop(1, '#3a4260');
    g.fillStyle = sky; g.fillRect(x, y, w, sea - y);
    px(g, '#e8e4c0', x + 5, y + 3, 5, 5); px(g, '#1a2038', x + 4, y + 2, 4, 4);             // 弯月
    px(g, '#24304a', x, sea, w, h - (sea - y));
    for (let i = 0; i < 5; i++) px(g, '#3c4c6c', x + 2 + i * 8, sea + 3 + (i % 2) * 4, 6, 1);
    // 船和绑在桅杆上的人
    const bx = x + 8, by = sea - 1;
    px(g, PAL.k, bx, by, 14, 4); px(g, '#2a2018', bx + 1, by, 12, 2);
    px(g, PAL.k, bx + 7, by - 14, 1, 14);
    px(g, '#8a6a4a', bx + 5, by - 11, 5, 6); px(g, '#e0bb92', bx + 6, by - 13, 3, 3);       // 被绑的人
    px(g, '#c8b48a', bx + 4, by - 9, 7, 1);                                                  // 绳子
    for (const dx of [2, 11]) { px(g, PAL.k, bx + dx, by - 6, 2, 5); }                        // 划桨的人
    // 礁石和塞壬
    px(g, PAL.k, x + w - 16, sea - 6, 15, 10); px(g, '#2a2a34', x + w - 15, sea - 5, 13, 8);
    for (const [dx, dy] of [[3, -12], [8, -10]]) {
      px(g, '#0e0e16', x + w - 16 + dx, sea + dy, 3, 8);
      px(g, '#0e0e16', x + w - 16 + dx, sea + dy - 3, 2, 3);
      px(g, '#6a7a9a', x + w - 16 + dx + 3, sea + dy - 2, 1, 1);                              // 歌声
      px(g, '#6a7a9a', x + w - 16 + dx + 5, sea + dy - 4, 1, 1);
    }
  },

  // 独眼巨人：山洞、火堆、巨人手里拎着一个人
  cyclops: (g, x, y, w, h) => {
    px(g, '#241c18', x, y, w, h);
    px(g, '#3a2c22', x, y + h - 6, w, 6);
    // 洞口的微光
    const glow = g.createRadialGradient(x + 8, y + h - 6, 2, x + 8, y + h - 6, 22);
    glow.addColorStop(0, 'rgba(240,150,60,0.55)'); glow.addColorStop(1, 'rgba(240,150,60,0)');
    g.fillStyle = glow; g.fillRect(x, y, w, h);
    px(g, '#e07a3a', x + 5, y + h - 8, 7, 3); px(g, '#f6c060', x + 6, y + h - 9, 4, 2);       // 火堆
    // 巨人
    const gx = x + w - 20, gy = y + 2;
    px(g, '#14100e', gx, gy + 5, 15, h - 10);
    px(g, '#14100e', gx + 3, gy, 9, 7);
    px(g, '#f2d24a', gx + 6, gy + 2, 3, 3); px(g, '#fff0a0', gx + 7, gy + 3, 1, 1);           // 独眼
    px(g, '#14100e', gx - 6, gy + 8, 7, 3);                                                   // 伸出的手臂
    // 手里的小人
    px(g, '#0e0c0a', gx - 9, gy + 7, 3, 6); px(g, '#e0bb92', gx - 9, gy + 6, 3, 2);
    px(g, '#0e0c0a', gx - 11, gy + 9, 2, 1); px(g, '#0e0c0a', gx - 6, gy + 12, 2, 2);
  },

  // 两难：左边漩涡，右边六头怪，船夹在中间
  strait: (g, x, y, w, h) => {
    const sea = y + 6;
    px(g, '#1e2a3e', x, y, w, sea - y);
    px(g, '#2a4460', x, sea, w, h - (sea - y));
    px(g, '#14100e', x, y, 10, h); px(g, '#14100e', x + w - 11, y, 11, h);                   // 两侧的崖壁
    px(g, '#241c18', x + 1, y, 7, h); px(g, '#241c18', x + w - 9, y, 7, h);
    // 漩涡：一圈圈越收越小的椭圆
    const cx = x + 16, cy = y + h - 10;
    for (let i = 5; i > 0; i--) {
      const rw = i * 3, rh = i * 1.6, col = i % 2 ? '#0d1520' : '#42648a';
      g.fillStyle = col;
      g.fillRect(cx - rw, cy - rh, rw * 2, 1); g.fillRect(cx - rw, cy + rh - 1, rw * 2, 1);
      g.fillRect(cx - rw, cy - rh + 1, 1, rh * 2 - 2); g.fillRect(cx + rw - 1, cy - rh + 1, 1, rh * 2 - 2);
    }
    px(g, '#0d1520', cx - 2, cy - 1, 4, 2);
    // 六头怪
    const mx = x + w - 16;
    px(g, '#0e0c12', mx, y + h - 12, 12, 12);
    for (let i = 0; i < 4; i++) {
      px(g, '#0e0c12', mx + 1 + i * 3, y + h - 12 - 7 - (i % 2) * 3, 2, 8 + (i % 2) * 3);
      px(g, '#0e0c12', mx + i * 3, y + h - 20 - (i % 2) * 3, 3, 3);
      px(g, '#c83a3a', mx + i * 3 + 1, y + h - 19 - (i % 2) * 3, 1, 1);
    }
    // 中间的小船
    px(g, PAL.k, cx + 6, sea + 6, 10, 3); px(g, '#e8e0c8', cx + 10, sea - 2, 4, 8);
    px(g, PAL.k, cx + 10, sea - 3, 1, 9);
  },

  // 织布：织机、坐着的人、夜里被拆开垂下来的线
  weaving: (g, x, y, w, h) => {
    px(g, '#241c20', x, y, w, h); px(g, '#33282c', x, y + h - 7, w, 7);
    px(g, '#3a4a68', x + w - 16, y + 2, 12, 12); px(g, '#e8e4c0', x + w - 12, y + 4, 4, 4);   // 夜窗和月亮
    const lx = x + 12, ly = y + 3, lw = 26, lh = h - 10;
    px(g, '#6a4a30', lx, ly, 3, lh); px(g, '#6a4a30', lx + lw, ly, 3, lh);                    // 织机
    px(g, '#6a4a30', lx, ly, lw + 3, 3); px(g, '#8a6442', lx, ly, lw + 3, 1);
    px(g, '#e6dfc8', lx + 3, ly + 3, lw - 3, 9);                                               // 织好的布
    for (let i = 0; i < 9; i++) px(g, '#c9c0a4', lx + 4 + i * 3, ly + 3, 1, 9);
    for (let i = 0; i < 9; i++) px(g, '#b8ae90', lx + 4 + i * 3, ly + 12, 1, 4 + (i % 3) * 3); // 被拆开垂下的线
    px(g, '#0e0c12', x + 3, y + h - 16, 6, 12); px(g, '#e0bb92', x + 4, y + h - 18, 4, 3);     // 织布的人
    px(g, '#0e0c12', x + 8, y + h - 13, 4, 2);
  },

  // 喀耳刻的宴席：举杯的女巫，地上变成猪的人
  circe: (g, x, y, w, h) => {
    px(g, '#2a2028', x, y, w, h); px(g, '#3a2c2e', x, y + h - 9, w, 9);
    for (let i = 0; i < 3; i++) px(g, '#4a3a3c', x + 4 + i * 16, y + 2, 10, h - 12);           // 柱子
    const cx0 = x + 10;
    px(g, '#6a3a5a', cx0, y + 5, 7, 16); px(g, '#8a4a72', cx0, y + 5, 2, 16);                  // 女巫
    px(g, '#e0bb92', cx0 + 2, y + 2, 4, 4); px(g, '#2a1a24', cx0 + 1, y + 1, 6, 2);
    px(g, '#e0b040', cx0 + 7, y + 7, 3, 3);                                                     // 举起的酒杯
    for (const [dx, dy] of [[22, -8], [32, -6], [42, -9], [50, -5]]) {                          // 变成猪的人
      const px1 = x + dx, py = y + h + dy;
      px(g, '#8a5a5a', px1, py, 8, 5); px(g, '#a06a6a', px1, py, 8, 1);
      px(g, '#8a5a5a', px1 + 7, py + 1, 3, 3); px(g, '#c88a8a', px1 + 9, py + 2, 1, 1);
      px(g, '#2a1a1a', px1 + 1, py + 5, 2, 2); px(g, '#2a1a1a', px1 + 5, py + 5, 2, 2);
    }
  },

  // 卡吕普索之岛：坐在海边望着远方的人，身后是仙女和洞口
  calypso: (g, x, y, w, h) => {
    const sea = y + h - 12;
    const sky = g.createLinearGradient(0, y, 0, sea);
    sky.addColorStop(0, '#6a4a7a'); sky.addColorStop(1, '#e0906a');
    g.fillStyle = sky; g.fillRect(x, y, w, sea - y);
    px(g, '#f6d08a', x + w - 12, y + 4, 6, 6);                                                  // 夕阳
    px(g, '#3a5a7a', x, sea, w, h - (sea - y));
    for (let i = 0; i < 4; i++) px(g, '#5a7c9a', x + 4 + i * 11, sea + 3 + (i % 2) * 4, 6, 1);
    px(g, '#2a2430', x, y + 2, 18, h - 4);                                                      // 洞口
    px(g, '#0e0c12', x + 3, y + 5, 12, h - 9);
    px(g, '#8a6a9a', x + 7, y + 9, 5, 12); px(g, '#e0bb92', x + 8, y + 6, 3, 3);                // 仙女
    px(g, '#0e0c12', x + 24, sea - 9, 5, 9); px(g, '#e0bb92', x + 25, sea - 11, 3, 3);          // 坐着望海的人
    px(g, '#0e0c12', x + 23, sea - 2, 8, 2); px(g, '#3a2e26', x + 20, sea - 1, 14, 3);          // 岸边的岩石
  },

  // 射箭试炼：拉满弓的人，一排斧头，穿过去的箭
  bowtest: (g, x, y, w, h) => {
    px(g, '#2a2420', x, y, w, h); px(g, '#3a3028', x, y + h - 8, w, 8);
    px(g, '#4a3c30', x, y, w, 4);
    const ay = y + h - 14;
    for (let i = 0; i < 12; i++) {                                                              // 十二把斧头
      const ax = x + 18 + i * 3;
      px(g, '#5a4a3a', ax, ay + 6, 1, 8);
      px(g, '#9aa0ac', ax - 1, ay + 1, 3, 5); px(g, '#c8ccd4', ax - 1, ay + 1, 1, 5);
    }
    px(g, '#e8e0c8', x + 16, ay + 3, 40, 1);                                                    // 穿过去的箭
    px(g, '#e8e0c8', x + 54, ay + 2, 3, 3);
    const bx = x + 5;                                                                            // 拉弓的人
    px(g, '#0e0c12', bx, ay - 6, 6, 18); px(g, '#e0bb92', bx + 1, ay - 9, 4, 4);
    px(g, '#8a6a3a', bx + 7, ay - 6, 1, 13);
    px(g, '#8a6a3a', bx + 6, ay - 7, 2, 1); px(g, '#8a6a3a', bx + 6, ay + 6, 2, 1);
    px(g, '#c8b48a', bx + 5, ay - 6, 1, 13);
  },

  // 石刻壁画：张开双臂的身影，下面跪着一排人（异形神殿里那种浮雕）
  relief: (g, x, y, w, h) => {
    px(g, '#453f38', x, y, w, h);                                        // 石墙
    for (let i = 0; i < w; i += 13) px(g, '#3c3630', x + i, y, 1, h);    // 石板缝
    px(g, '#332e2a', x + 2, y + 2, w - 4, h - 4);                        // 内凹的浮雕面
    px(g, '#5a544a', x + 2, y + 2, w - 4, 1);
    const cx = x + (w >> 1), by = y + h - 9;
    // 顶上的拱形光环
    for (let i = 0; i < 9; i++) px(g, '#5e5648', cx - 9 + i * 2, y + 4 + Math.abs(4 - i), 2, 1);
    // 中央的身影
    px(g, '#1e1b24', cx - 3, y + 8, 7, by - y - 8);                      // 躯干
    px(g, '#3c3848', cx - 3, y + 8, 2, by - y - 8);                      // 受光的一侧
    for (let i = 0; i < 5; i++) px(g, '#3c3848', cx - 2, y + 12 + i * 3, 5, 1);   // 肋骨
    px(g, '#1e1b24', cx - 16, y + 11, 13, 3); px(g, '#1e1b24', cx + 4, y + 11, 13, 3);   // 张开的双臂
    px(g, '#3c3848', cx - 16, y + 11, 13, 1); px(g, '#3c3848', cx + 4, y + 11, 13, 1);
    // 向后拖的细长头
    px(g, '#1e1b24', cx - 3, y + 3, 6, 6);
    for (let i = 0; i < 6; i++) px(g, '#1e1b24', cx + 2 + i, y + 2 + ((i * 0.5) | 0), 2, 3);
    px(g, '#3c3848', cx - 2, y + 4, 4, 1); px(g, '#3c3848', cx + 3, y + 3, 3, 1);
    px(g, '#1e1b24', cx + 4, by - 9, 5, 2); px(g, '#1e1b24', cx + 8, by - 13, 2, 6);   // 身后拖着的尾巴
    // 跪在下面的一排小人
    for (let i = 0; i < 7; i++) {
      const px1 = cx - 21 + i * 7;
      if (Math.abs(px1 - cx) < 4) continue;
      px(g, '#252129', px1, by + 1, 4, 4); px(g, '#252129', px1 + 1, by - 1, 2, 2);
      px(g, '#4a4450', px1, by + 1, 1, 4);
    }
    // 两侧的瓮
    for (const dx of [-24, 21]) { px(g, '#2a2630', cx + dx, by - 4, 5, 8); px(g, '#4a4450', cx + dx, by - 4, 1, 8); px(g, '#2a2630', cx + dx + 1, by - 6, 3, 2); }
    // 岁月：一道斜裂缝和掉角
    for (let i = 0; i < 14; i++) px(g, '#221e1c', x + 6 + i, y + 3 + ((i * 1.4) | 0), 1, 1);
    px(g, '#221e1c', x + w - 6, y + h - 5, 4, 3);
  },

  // 海难：雷劈断的船，浪里伸出来的手
  wreck: (g, x, y, w, h) => {
    const sea = y + h - 13;
    px(g, '#10121c', x, y, w, sea - y);
    for (let i = 0; i < 4; i++) px(g, '#232a3e', x + (i * 13) % w, y + 2 + i * 3, 18 + i * 4, 2);   // 乌云
    px(g, '#1a2836', x, sea, w, h - (sea - y));
    // 闪电
    const lx = x + 16;
    px(g, '#dce8ff', lx, y, 2, 6); px(g, '#dce8ff', lx + 2, y + 6, 2, 5);
    px(g, '#dce8ff', lx - 1, y + 11, 2, 6); px(g, '#dce8ff', lx + 1, y + 17, 2, 4);
    px(g, '#8ea6d8', lx - 3, y + 4, 1, 4); px(g, '#8ea6d8', lx + 5, y + 9, 1, 4);
    const flash = g.createRadialGradient(lx, y + 18, 2, lx, y + 18, 26);
    flash.addColorStop(0, 'rgba(200,220,255,0.30)'); flash.addColorStop(1, 'rgba(200,220,255,0)');
    g.fillStyle = flash; g.fillRect(x, y, w, h);
    // 断成两截的船
    px(g, '#0b0d14', lx - 8, sea - 2, 11, 5); px(g, '#0b0d14', lx - 4, sea - 8, 1, 7);            // 船头
    px(g, '#0b0d14', lx + 6, sea, 13, 4); px(g, '#0b0d14', lx + 14, sea - 9, 1, 9);               // 断掉的船尾和歪斜的桅杆
    px(g, '#2a2e3c', lx + 9, sea - 7, 5, 6);
    // 浪、泡沫，和水里伸出来的手
    for (let i = 0; i < 6; i++) px(g, '#33465c', x + 2 + i * 9, sea + 3 + (i % 3) * 3, 7, 1);
    px(g, '#6a8098', x, sea, w, 1);
    for (const [dx, dy] of [[6, 4], [28, 7], [44, 3]]) {
      px(g, '#e0bb92', x + dx, sea + dy, 1, 3); px(g, '#e0bb92', x + dx + 2, sea + dy + 1, 1, 2);
      px(g, '#b8cede', x + dx - 2, sea + dy + 3, 6, 1);
    }
    px(g, '#7a3a3a', x, y + h - 3, w, 1);
  },

  // 西西弗斯：把巨石推上山坡的人
  sisyphus: (g, x, y, w, h) => {
    const sky = g.createLinearGradient(0, y, 0, y + h);
    sky.addColorStop(0, '#6a4a5a'); sky.addColorStop(1, '#c88a6a');
    g.fillStyle = sky; g.fillRect(x, y, w, h);
    px(g, '#e8c07a', x + 6, y + 4, 5, 5);                                    // 远处的太阳
    for (let i = 0; i < w; i++) {                                            // 山坡
      const hh = Math.round((i / w) * (h - 6));
      px(g, '#2a2420', x + i, y + h - hh, 1, hh);
      px(g, '#3e352c', x + i, y + h - hh, 1, 2);
    }
    const bx = x + w - 26, by = y + h - Math.round(((w - 26) / w) * (h - 6)) - 8;
    px(g, '#4a4450', bx, by, 9, 9); px(g, '#6a6470', bx + 1, by + 1, 4, 3);  // 巨石
    px(g, '#0e0c12', bx - 7, by + 2, 5, 10);                                 // 推石头的人
    px(g, '#e0bb92', bx - 8, by + 1, 3, 3);
    px(g, '#0e0c12', bx - 3, by + 4, 3, 2);
  },

  // 普罗米修斯：被锁在岩石上，鹰在啄食
  prometheus: (g, x, y, w, h) => {
    px(g, '#2a2a3a', x, y, w, h);
    px(g, '#1e1e2c', x, y, w, 6);
    px(g, '#4a4452', x + w - 26, y, 26, h); px(g, '#3a3442', x + w - 22, y + 2, 18, h - 2);   // 岩石
    px(g, '#5a5462', x + 4, y + h - 8, w - 26, 8);
    const mx = x + w - 20;
    px(g, '#0e0c12', mx, y + 6, 6, 16);                                      // 被锁的人
    px(g, '#e0bb92', mx + 1, y + 3, 4, 4);
    px(g, '#0e0c12', mx - 7, y + 8, 8, 2); px(g, '#0e0c12', mx + 6, y + 8, 6, 2);   // 张开的手臂
    px(g, '#b8bcc4', mx - 8, y + 7, 3, 4); px(g, '#b8bcc4', mx + 10, y + 7, 3, 4);  // 铁镣
    px(g, '#8a2a2a', mx + 1, y + 12, 3, 2);                                  // 伤口
    // 鹰
    px(g, '#14100e', mx - 12, y + 10, 10, 5);
    px(g, '#14100e', mx - 14, y + 7, 5, 4); px(g, '#e0b040', mx - 15, y + 9, 2, 1);
    px(g, '#14100e', mx - 10, y + 5, 8, 4); px(g, '#241c18', mx - 20, y + 12, 8, 3);
  },

  // 农神吞噬其子：巨大的黑影，睁着白眼，手里是小小的身体
  saturn: (g, x, y, w, h) => {
    px(g, '#1a1410', x, y, w, h);
    const glow = g.createRadialGradient(x + (w >> 1), y + 8, 3, x + (w >> 1), y + 8, 30);
    glow.addColorStop(0, 'rgba(120,90,60,0.35)'); glow.addColorStop(1, 'rgba(120,90,60,0)');
    g.fillStyle = glow; g.fillRect(x, y, w, h);
    const cx = x + (w >> 1);
    px(g, '#0c0a08', cx - 12, y + 10, 24, h - 10);                           // 身体
    px(g, '#0c0a08', cx - 8, y + 1, 16, 12);                                 // 头
    px(g, '#e8e4d8', cx - 6, y + 4, 4, 4); px(g, '#e8e4d8', cx + 3, y + 4, 4, 4);   // 瞪着的白眼
    px(g, '#0c0a08', cx - 5, y + 5, 2, 2); px(g, '#0c0a08', cx + 4, y + 5, 2, 2);
    px(g, '#2a1410', cx - 4, y + 9, 8, 4);                                   // 张开的嘴
    px(g, '#e8d8c0', cx - 3, y + 6, 4, 7);                                   // 被吃的孩子
    px(g, '#e8d8c0', cx - 6, y + 13, 10, 4);
    px(g, '#e8d8c0', cx - 10, y + 15, 5, 2); px(g, '#e8d8c0', cx + 4, y + 16, 5, 2);
    px(g, '#8a2a2a', cx - 2, y + 9, 3, 1);
  },

  // 圣母怜子：抱着孩子的身体，三角形的构图
  pieta: (g, x, y, w, h) => {
    px(g, '#241f28', x, y, w, h);
    const glow = g.createRadialGradient(x + (w >> 1) - 4, y + 6, 2, x + (w >> 1) - 4, y + 6, 26);
    glow.addColorStop(0, 'rgba(230,220,190,0.28)'); glow.addColorStop(1, 'rgba(230,220,190,0)');
    g.fillStyle = glow; g.fillRect(x, y, w, h);
    const cx = x + (w >> 1) - 4, base = y + h - 3;
    for (let i = 0; i < 16; i++) px(g, '#3a4a7a', cx - 3 - i, base - 16 + i, 7 + i * 2, 1);   // 张开的衣袍
    px(g, '#4a5a8a', cx - 4, base - 18, 9, 6);
    px(g, '#e0bb92', cx - 2, base - 22, 5, 5);                                // 低着的头
    px(g, '#d8d2c0', cx - 3, base - 23, 7, 2);
    px(g, '#e8d0b0', cx - 14, base - 10, 26, 4);                              // 横在膝上的身体
    px(g, '#e8d0b0', cx + 10, base - 12, 5, 4);
    px(g, '#e8d0b0', cx - 19, base - 8, 7, 3);                                // 垂下的手臂
    px(g, '#8a2a2a', cx + 2, base - 9, 2, 1);
  },

  // 冥府问亡：坑边的人，围上来的亡魂
  nekyia: (g, x, y, w, h) => {
    px(g, '#181620', x, y, w, h);
    px(g, '#241f2c', x, y + h - 8, w, 8);
    // 地上的坑（一圈石头围着的黑洞）
    const cx = x + (w >> 1) + 4, cy = y + h - 5;
    px(g, '#3a3444', cx - 13, cy - 4, 26, 8);
    px(g, '#0a0810', cx - 11, cy - 3, 22, 6);
    for (let i = -12; i < 12; i += 4) px(g, '#4a4458', cx + i, cy - 4, 3, 1);
    const mist = g.createLinearGradient(0, cy - 14, 0, cy);
    mist.addColorStop(0, 'rgba(150,180,200,0)'); mist.addColorStop(1, 'rgba(150,180,200,0.35)');
    g.fillStyle = mist; g.fillRect(cx - 12, cy - 14, 24, 14);
    // 亡魂
    for (const [dx, dy, hh] of [[-8, -8, 9], [-2, -12, 12], [5, -9, 10], [10, -6, 7]]) {
      px(g, 'rgba(190,210,225,0.75)', cx + dx, cy + dy, 3, hh);
      px(g, 'rgba(225,240,250,0.9)', cx + dx, cy + dy - 2, 3, 3);
    }
    // 提着剑的奥德修斯
    const px0 = x + 5;
    px(g, '#0e0c12', px0, cy - 12, 5, 12); px(g, '#e0bb92', px0 + 1, cy - 14, 3, 3);
    px(g, '#8a8e9a', px0 + 5, cy - 9, 6, 1);
  },
};
