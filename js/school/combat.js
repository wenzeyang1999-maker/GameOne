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
  constructor(tx, ty) {
    this.frames = buildAlienFrames();
    this.x = tx * 16 + 8; this.y = ty * 16 + 12;
    this.dir = 'left'; this.animT = 0; this.moving = false;
    this.hp = 3; this.stun = 0; this.flash = 0; this.hitCool = 0;
    this.kx = 0; this.ky = 0;                          // 被打退时的速度
    this.dead = false;
  }
  box(x = this.x, y = this.y) { return [x - 9, y - 4, x + 9, y + 1]; }

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

    // 追玩家
    const dx = p.x - this.x, dy = p.y - this.y, dist = Math.hypot(dx, dy);
    if (dist > 150) return;
    const sp = 34 * dt;
    let mx = 0, my = 0;
    if (Math.abs(dx) > 3) mx = Math.sign(dx) * Math.min(sp, Math.abs(dx));
    if (Math.abs(dy) > 3) my = Math.sign(dy) * Math.min(sp, Math.abs(dy));
    if (mx && !s.rectBlocked(this.box(this.x + mx, this.y), null, this.box())) { this.x += mx; this.moving = true; }
    if (my && !s.rectBlocked(this.box(this.x, this.y + my), null, this.box())) { this.y += my; this.moving = true; }
    if (mx) this.dir = mx < 0 ? 'left' : 'right';
    if (this.moving) {
      this.animT += dt;
      this.stepDist = (this.stepDist || 0) + Math.abs(mx) + Math.abs(my);
      if (this.stepDist > 5 && game.addTrail) { this.stepDist = 0; game.addTrail(this.x, this.y); }
    }

    // 碰到玩家：把玩家撞退一下
    if (this.hitCool <= 0 && overlaps(this.box(), p.box())) {
      this.hitCool = 1.2;
      const d = Math.hypot(dx, dy) || 1;
      game.knockPlayer(-dx / d * 130, -dy / d * 130);
    }
  }

  // 挨打：掉血 + 被打退
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
    // 血条
    if (this.hp < 3) {
      const bx = Math.round(this.x - 8 - cx), by = Y - 3;
      g.fillStyle = '#1a1420'; g.fillRect(bx, by, 16, 3);
      g.fillStyle = '#d4443c'; g.fillRect(bx + 1, by + 1, Math.round(14 * this.hp / 3), 1);
    }
  }
}
