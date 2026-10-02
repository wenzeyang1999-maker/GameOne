// ============================================================
//  战斗原型：怪物（异形）、挥击、击退
//    F9  在面前放一只异形
//    F10 清掉当前场景里的所有异形
//    J   挥击（把靠近的异形打退，三下打散）
//  异形的图沿用实验室里那个模型（ALIEN），去掉底座、加了走路的摆动
// ============================================================

// 爬行形态的异形：身体压低、四肢关节高过背、头细长前伸、尾巴翘起
// 深紫 + 黑的配色，不用浅色
const AL = {
  k: '#080610',      // 描边
  d: '#170f22',      // 甲壳暗部
  m: '#241733',      // 甲壳
  l: '#3a2352',      // 甲壳受光
  s: '#533070',      // 高光
  bone: '#3d2a58',   // 骨头和四肢：偏暗的紫
  boneL: '#5b3f80',  // 骨头受光的一面
  t: '#c8bcd8',      // 牙：冷灰紫
  blood: '#2a0a1e',  // 体腔深处
  acid: '#2f8f3f',   // 滴下来的黏液
};
let ALIEN_FRAMES = null;

// 异形的数值：贴合原著 —— 跑得比人快、一口咬掉一大截血、血厚得离谱，
// 但会被打退，这是没武器的人唯一的反制手段
const AL_SPEED = 58;        // 平时的移动速度（玩家满血 64，所以走是走不掉的，要跑）
const AL_RUSH = 92;         // 扑上来：贴近到 48px 以内就加速
const AL_RUSH_AT = 48;
const AL_AGGRO = 170;       // 多远开始追
const AL_BITE = [0.2, 0.25];   // 咬一口掉玩家最大血的 1/5 ~ 1/4
const AL_BITE_COOL = 1.2;
const AL_APART = 15;        // 两只异形之间至少隔这么远，再近就互相推开
const AL_RING = 15;         // 合围半径：各自站在玩家周围这么远的一圈上
const AL_PUSH = 80;         // 互相推开的力度。要压得住扑上来的速度，不然还是会挤成一团
const AL_MIN_ANGLE = Math.PI / 6;   // 两只异形在玩家周围至少错开 30 度
let AL_SEQ = 0;             // 出生序号，只用来给「正好重合」的两只定个先后

// 画一条折起来的腿：胯 -> 膝（抬得比背还高）-> 爪。细一点，和身体分得开
function alienLeg(g, hx, hy, kx, ky, fx, fy) {
  const seg = (x0, y0, x1, y1) => {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
    for (let i = 0; i <= n; i++) {
      const x = Math.round(x0 + (x1 - x0) * i / n), y = Math.round(y0 + (y1 - y0) * i / n);
      px(g, AL.k, x - 1, y, 3, 1);
      px(g, AL.bone, x, y, 1, 1); px(g, AL.boneL, x, y, 1, 1);
    }
  };
  seg(hx, hy, kx, ky);
  seg(kx, ky, fx, fy);
  px(g, AL.k, kx - 1, ky - 1, 3, 2); px(g, AL.boneL, kx, ky - 1, 1, 1);   // 膝关节
  px(g, AL.k, fx - 2, fy, 4, 2); px(g, AL.d, fx - 1, fy, 2, 1);       // 爪
}

function alienFrame(phase) {
  const c = makeCanvas(38, 24), g = c.getContext('2d');
  const sw = Math.sin(phase * Math.PI * 2), sw2 = Math.sin(phase * Math.PI * 2 + Math.PI);
  const bob = Math.round(Math.abs(Math.cos(phase * Math.PI * 2)) - 0.5);
  const GY = 22, by = 10 + bob;        // 躯干上沿

  // 后腿（膝盖高高折在背上方）
  alienLeg(g, 9, by + 5, 7 + Math.round(sw2 * 2), 3 + bob, 4 + Math.round(sw2 * 3), GY - (sw2 > 0.4 ? 2 : 0));
  alienLeg(g, 12, by + 5, 11 + Math.round(sw * 2), 4 + bob, 9 + Math.round(sw * 3), GY - (sw > 0.4 ? 2 : 0));
  // 尾巴：从臀部甩起来
  const ts = Math.round(sw * 2);
  for (const [x, y] of [[8, by + 1], [6, by - 2], [4, by - 5], [3 + ts, by - 8], [6 + ts, by - 9]]) {
    px(g, AL.k, x - 1, y - 1, 3, 3); px(g, AL.m, x, y, 1, 1);
  }
  px(g, AL.k, 9 + ts, by - 8, 2, 2); px(g, AL.bone, 9 + ts, by - 8, 1, 1);   // 尾尖

  // 躯干：一具裸露的肋骨笼
  px(g, AL.k, 7, by - 1, 15, 9);
  px(g, '#08070d', 8, by, 13, 7);                                             // 笼子里面的黑
  px(g, AL.blood, 12, by + 3, 5, 2); px(g, '#3e1030', 13, by + 3, 2, 1);      // 深处隐约的内脏
  // 脊椎：从肩到臀的一条骨线，带小棘突
  px(g, AL.bone, 8, by, 13, 1); px(g, AL.boneL, 10, by, 6, 1);
  for (const x of [9, 12, 15, 18]) { px(g, AL.k, x, by - 3, 2, 3); px(g, AL.bone, x, by - 3, 1, 2); }
  // 肋骨：一根根挂下来，两端短、中间长，下缘往里收
  const ribH = [4, 6, 6, 5, 4];
  for (let i = 0; i < 5; i++) {
    const x = 9 + i * 3, h = ribH[i];
    px(g, AL.bone, x, by + 1, 1, h);
    px(g, AL.boneL, x, by + 1, 1, 1);
    px(g, AL.d, x + 1, by + 2, 1, h - 1);                                     // 每根肋骨右侧的阴影
    px(g, AL.bone, x + (i < 2 ? 1 : -1), by + 1 + h, 1, 1);                   // 下端收进去
  }
  // 肩和胯：实心的骨块，腿从这里长出来
  px(g, AL.k, 6, by + 1, 4, 6); px(g, AL.m, 7, by + 2, 2, 4); px(g, AL.l, 7, by + 2, 1, 2);
  px(g, AL.k, 19, by + 1, 4, 6); px(g, AL.m, 20, by + 2, 2, 4); px(g, AL.l, 20, by + 2, 1, 2);

  // 前腿
  alienLeg(g, 18, by + 5, 19 + Math.round(sw * 2), 3 + bob, 22 + Math.round(sw * 3), GY - (sw > 0.4 ? 2 : 0));
  alienLeg(g, 21, by + 5, 23 + Math.round(sw2 * 2), 4 + bob, 26 + Math.round(sw2 * 3), GY - (sw2 > 0.4 ? 2 : 0));

  // 脖子
  px(g, AL.k, 20, by + 2, 4, 4); px(g, AL.d, 21, by + 3, 2, 2);
  // 后脑往背后拖出去的冠
  const hy = by + 4 + Math.round(sw * 0.5);
  for (let i = 0; i < 6; i++) {
    const x = 17 + i, h = 2 + Math.round(i * 0.4);
    px(g, AL.k, x, hy - h - 2, 1, h + 2); px(g, AL.d, x, hy - h - 1, 1, h);
  }
  // 又尖又长的头：一路收到前端的一个尖
  for (let i = 0; i < 12; i++) {
    const x = 22 + i, half = 3 - i * 0.26;
    const up = Math.max(0, Math.round(half)), dn = Math.max(0, Math.round(half - i * 0.1));
    px(g, AL.k, x, hy - up - 1, 1, up + dn + 3);
    px(g, AL.d, x, hy - up, 1, up + dn + 1);
    if (i < 8) px(g, AL.m, x, hy - up, 1, Math.max(1, up));
    if (i > 1 && i < 7) px(g, AL.s, x, hy - up, 1, 1);                          // 头顶那道反光
  }
  px(g, AL.k, 34, hy, 1, 2); px(g, AL.d, 34, hy, 1, 1);                         // 最前端的尖
  // 张开的嘴、牙、伸出来的内颚
  px(g, AL.k, 23, hy + 2, 10, 3);
  px(g, '#140410', 24, hy + 3, 8, 1);
  for (let i = 0; i < 5; i++) px(g, AL.t, 24 + i * 2, hy + 2, 1, 1);
  px(g, AL.t, 29, hy + 4, 2, 1);
  return c;
}

function buildAlienFrames() {
  if (ALIEN_FRAMES) return ALIEN_FRAMES;
  const walk = [0, 0.25, 0.5, 0.75].map(alienFrame);
  const idle = alienFrame(0);
  const right = [idle, ...walk], left = right.map(flipH);
  ALIEN_FRAMES = { right, left, up: right, down: right };
  return ALIEN_FRAMES;
}

class Monster {
  // 血量是人类的 3~10 倍（每只随机），所以一只异形是真的难打
  constructor(tx, ty, playerMax = PLAYER_MAX_HP) {
    this.frames = buildAlienFrames();
    this.x = tx * 16 + 8; this.y = ty * 16 + 12;
    this.dir = 'left'; this.animT = 0; this.moving = false;
    this.mult = 3 + Math.floor(Math.random() * 8);          // 3~10 倍
    this.maxHp = playerMax * this.mult;
    this.hp = this.maxHp; this.stun = 0; this.flash = 0; this.hitCool = 0;
    this.kx = 0; this.ky = 0;                          // 被打退时的速度
    this.dead = false;
    this.seq = ++AL_SEQ;                               // 只用来给「方位正好重合」的两只定个先后
  }
  // 14px 宽：必须窄于一格（16px），否则站在格子正中时左右各探出 1px 到隔壁，
  // 一格宽的过道就永远挤不过去，寻路算出来的路也走不通
  box(x = this.x, y = this.y) { return [x - 7, y - 4, x + 7, y + 1]; }

  update(dt, game) {
    const p = game.player, s = game.cur;
    this.flash = Math.max(0, this.flash - dt);
    this.hitCool = Math.max(0, this.hitCool - dt);
    this.moving = false;

    // 被击退：一边飞一边减速，撞墙就停
    if (Math.abs(this.kx) > 1 || Math.abs(this.ky) > 1) {
      const nx = this.x + this.kx * dt, ny = this.y + this.ky * dt;
      if (!s.rectBlocked(this.box(nx, this.y), null, this.box())) this.x = nx; else this.kx = 0;
      if (!s.rectBlocked(this.box(this.x, ny), null, this.box())) this.y = ny; else this.ky = 0;
      this.kx *= 0.86; this.ky *= 0.86;
      return;
    }
    if (this.stun > 0) { this.stun -= dt; return; }

    // 已经挤在一起的先分开（不然新来的会直接叠上去）
    this.separate(game, dt);

    // 追玩家。不是都扑向正中，各自认领一个方位，围成一圈
    const [ax0, ay0] = this.aimAt(game, p);
    const dx = ax0 - this.x, dy = ay0 - this.y;
    const dist = Math.hypot(p.x - this.x, p.y - this.y);
    if (dist > AL_AGGRO) return;
    // 远远地逼近，到了够得着的距离就扑上来
    const sp = (dist < AL_RUSH_AT ? AL_RUSH : AL_SPEED) * dt;
    let mx = 0, my = 0;
    if (Math.abs(dx) > 3) mx = Math.sign(dx) * Math.min(sp, Math.abs(dx));
    if (Math.abs(dy) > 3) my = Math.sign(dy) * Math.min(sp, Math.abs(dy));
    const step = (bx, by) => {
      let ok = false;
      if (bx && this.canGo(game, this.x + bx, this.y)) { this.x += bx; ok = true; }
      if (by && this.canGo(game, this.x, this.y + by)) { this.y += by; ok = true; }
      return ok;
    };

    this.pathT = (this.pathT || 0) - dt;

    // 中间没东西挡着才直奔。不加这个判断的话，贴着墙的异形会反复
    // 「脱离墙面 -> 直奔成立 -> 清掉算好的路 -> 又撞上墙」，原地蹦跶
    if (this.hasLineTo(s, p) && step(mx, my)) {
      this.detour = null; this.path = null;
      this.moving = true;
    } else {
      // 被挡住了。先按算好的路走；路过期或走不通就重新算
      if (!this.path || this.pathT <= 0) { this.path = this.repath(s, p); this.pathT = 0.5; }
      let onPath = false;
      while (this.path && this.path.length) {
        const [tx, ty] = this.path[0];
        const gx2 = tx * 16 + 8, gy2 = ty * 16 + 12;
        if (Math.hypot(gx2 - this.x, gy2 - this.y) < 4) { this.path.shift(); continue; }
        const a = Math.atan2(gy2 - this.y, gx2 - this.x);
        onPath = step(Math.cos(a) * sp, Math.sin(a) * sp);
        if (onPath) { this.moving = true; this.detour = null; }
        break;
      }
      if (!onPath) {
        // 压根没有路（玩家在封死的房间里），或者路也走不通：
        // 往八个方向里最靠近玩家的那个挪，总之不能停下
        this.path = null;
        if (!this.detour || (this.detour.t -= dt) <= 0) this.detour = this.pickDetour(s, p, sp);
        if (this.detour && step(this.detour.dx * sp, this.detour.dy * sp)) this.moving = true;
        else this.detour = null;
      }
    }
    if (this.moving) {
      const face = this.detour ? this.detour.dx : mx;
      if (face) this.dir = face < 0 ? 'left' : 'right';
    }
    if (this.moving) {
      this.animT += dt;
      this.stepDist = (this.stepDist || 0) + Math.abs(mx) + Math.abs(my);
      if (this.stepDist > 5 && game.addTrail) { this.stepDist = 0; game.addTrail(this.x, this.y); }
    }

    // 碰到玩家：把玩家撞退一下
    if (this.hitCool <= 0 && overlaps(this.box(), p.box())) {
      this.hitCool = AL_BITE_COOL;
      const d = Math.hypot(dx, dy) || 1;
      game.knockPlayer(-dx / d * 150, -dy / d * 150);
      // 咬一口：最大血的 1/5 ~ 1/4
      const f = AL_BITE[0] + Math.random() * (AL_BITE[1] - AL_BITE[0]);
      game.hurtPlayer(Math.max(1, Math.round(PLAYER_MAX_HP * f)));
    }
  }

  // 能不能挪到这个位置：墙、NPC，还有别的异形
  // 已经和某只叠在一起时不算它挡路，否则两只叠住就谁也动不了，永远分不开
  canGo(game, nx, ny) {
    const s = game.cur, nb = this.box(nx, ny);
    if (s.rectBlocked(nb, null, this.box())) return false;
    const cur = this.box();
    for (const m of game.monsters) {
      if (m === this || m.dead) continue;
      if (overlaps(nb, m.box()) && !overlaps(cur, m.box())) return false;
    }
    return true;
  }

  // 挤在一起的互相推开。推的方向主要是「绕着玩家转」而不是「往外退」——
  // 这样它们是在玩家周围挪开站位（角度拉开），而不是被挤到更远的地方。
  // 不能靠 aimAt 里改角度来拉开：在半径 15 的圈上十几度只有两三个像素，
  // 会被移动的死区（小于 3px 不动）吃掉，永远收敛不了
  separate(game, dt) {
    const p = game.player;
    let ox = 0, oy = 0;
    for (const m of game.monsters) {
      if (m === this || m.dead) continue;
      let dx = this.x - m.x, dy = this.y - m.y;
      let d = Math.hypot(dx, dy);
      if (d >= AL_APART) continue;
      if (d < 0.01) {                       // 完全重合，随便挑个方向推
        const a = Math.random() * Math.PI * 2;
        dx = Math.cos(a); dy = Math.sin(a); d = 1;
      }
      const push = (AL_APART - d) / AL_APART;
      ox += dx / d * push; oy += dy / d * push;
    }
    if (!ox && !oy) return;
    // 拆成「绕圈」和「往外」两个分量，绕圈的留全部，往外的只留一点点
    // （留一点是为了圈上实在站不下时能往外撑开）
    const rx = this.x - p.x, ry = this.y - p.y, rd = Math.hypot(rx, ry) || 1;
    const ux = rx / rd, uy = ry / rd;                    // 径向（背对玩家）
    const tx = -uy, ty = ux;                             // 切向（绕着玩家）
    const tang = ox * tx + oy * ty, radial = ox * ux + oy * uy;
    ox = tx * tang + ux * radial * 0.25;
    oy = ty * tang + uy * radial * 0.25;

    const s = game.cur, k = AL_PUSH * dt;
    const nx = this.x + ox * k, ny = this.y + oy * k;
    if (!s.rectBlocked(this.box(nx, this.y), null, this.box())) this.x = nx;
    if (!s.rectBlocked(this.box(this.x, ny), null, this.box())) this.y = ny;
  }

  // 合围：各自就站在自己当前所处的方位上，不强行均分成 0/90/180/270。
  // 只有和别人挤得太近（小于 AL_MIN_ANGLE）时才往旁边让开一点，
  // 所以谁从哪边来就守哪边，走的是最近的位置
  aimAt(game, p) {
    const live = game.monsters.filter(m => !m.dead);
    if (live.length <= 1) return [p.x, p.y];
    const norm = d => { while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; };
    let a = Math.atan2(this.y - p.y, this.x - p.x);          // 自己现在在玩家的哪个方位
    for (const m of live) {
      if (m === this) continue;
      const d = norm(a - Math.atan2(m.y - p.y, m.x - p.x));
      if (Math.abs(d) >= AL_MIN_ANGLE) continue;
      // 挤到一起了：往离开对方的那一侧让，让够 30 度为止
      // 正好重合（d=0）时没有方向可言，用出生序号定谁往哪边，免得两只往同一边让
      const sign = d === 0 ? (this.seq < m.seq ? -1 : 1) : Math.sign(d);
      a += sign * (AL_MIN_ANGLE - Math.abs(d));
    }
    return [p.x + Math.cos(a) * AL_RING, p.y + Math.sin(a) * AL_RING];
  }

  // 到玩家之间是不是一条直路（沿途每隔 8px 试一下身子放不放得下）
  hasLineTo(s, p) {
    const dx = p.x - this.x, dy = p.y - this.y, d = Math.hypot(dx, dy);
    const n = Math.ceil(d / 8);
    for (let i = 1; i <= n; i++) {
      const k = i / n;
      if (s.rectBlocked(this.box(this.x + dx * k, this.y + dy * k), null, this.box())) return false;
    }
    return true;
  }

  // 这一格站得下整个身子吗。碰撞盒窄于一格，所以这等价于「这一格不是墙」，
  // 但写成拿真盒子去试更稳 —— 以后改了盒子尺寸，寻路会跟着一起对
  fits(s, tx, ty) { return !s.rectBlocked(this.box(tx * 16 + 8, ty * 16 + 12), null, null); }

  // BFS 找一条到玩家的路。绕长墙、绕桌子要靠它，光靠局部避障会贴着墙滑来滑去
  repath(s, p) {
    const W = s.W, H = s.H, key = (x, y) => y * W + x;
    const sx = Math.floor(this.x / 16), sy = Math.floor((this.y - 2) / 16);
    const gx = Math.floor(p.x / 16), gy = Math.floor((p.y - 2) / 16);
    if (sx < 0 || sy < 0 || sx >= W || sy >= H) return null;
    const prev = new Int32Array(W * H).fill(-1);
    const q = [key(sx, sy)]; prev[q[0]] = q[0];
    for (let i = 0; i < q.length; i++) {
      const cur = q[i];
      if (cur === key(gx, gy)) {
        const out = [];
        for (let k = cur; k !== prev[k]; k = prev[k]) out.push([k % W, (k / W) | 0]);
        return out.reverse();
      }
      const cx = cur % W, cy = (cur / W) | 0;
      for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const nk = key(nx, ny);
        if (prev[nk] !== -1 || !this.fits(s, nx, ny)) continue;
        prev[nk] = cur; q.push(nk);
      }
    }
    return null;
  }

  // 卡住时挑一条绕路：八个方向里能走的，取离玩家最近的那个
  // 挑中之后锁 0.5 秒，免得贴着墙角每帧换方向抖个不停
  pickDetour(s, p, sp) {
    const probe = sp * 6;                 // 往前多探几帧的距离，别刚够一帧又卡住
    let best = null, bestD = Infinity;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const nx = this.x + dx * probe, ny = this.y + dy * probe;
      if (s.rectBlocked(this.box(nx, ny), null, this.box())) continue;
      const d = Math.hypot(p.x - nx, p.y - ny);
      if (d < bestD) { bestD = d; best = { dx, dy, t: 0.5 }; }
    }
    return best;
  }

  // 挨打：掉血 + 被打退。击退是没武器时唯一能做的事
  // （以后的技能要「定身 / 减速」的话，往 this.stun / this.slow 上加就行）
  hurt(vx, vy, dmg = 1) {
    this.hp -= dmg; this.flash = 0.18; this.stun = 0.45;
    this.kx = vx; this.ky = vy;
    if (this.hp <= 0) this.dead = true;
  }

  draw(g, cx, cy) {
    const f = this.moving ? 1 + (Math.floor(this.animT * 9) % 4) : 0;
    const img = this.frames[this.dir === 'left' ? 'left' : 'right'][f];
    const X = Math.round(this.x - img.width / 2 - cx), Y = Math.round(this.y - img.height + 2 - cy);
    g.fillStyle = 'rgba(20,10,30,0.35)'; g.fillRect(Math.round(this.x - 11 - cx), Math.round(this.y - 2 - cy), 22, 3);
    g.drawImage(img, X, Y);
    if (this.flash > 0) {                     // 挨打时白闪一下
      g.save(); g.globalAlpha = 0.8; g.globalCompositeOperation = 'lighter';
      g.drawImage(img, X, Y); g.drawImage(img, X, Y);
      g.restore();
    }
    // 血条：掉过血才显示。条子按倍数变长，越肥的异形条越长
    if (this.hp < this.maxHp) {
      const w = Math.min(34, 12 + this.mult * 2), bx = Math.round(this.x - w / 2 - cx), by = Y - 4;
      g.fillStyle = '#1a1420'; g.fillRect(bx, by, w, 4);
      g.fillStyle = '#3a1a20'; g.fillRect(bx + 1, by + 1, w - 2, 2);
      g.fillStyle = '#d4443c'; g.fillRect(bx + 1, by + 1, Math.round((w - 2) * this.hp / this.maxHp), 2);
    }
  }
}
