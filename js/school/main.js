// ============================================================
//  学校篇入口：注册所有场景，从教室开始
//  以后新增场景：写一个 buildXxx()，在这里注册，再用 d.exit(...) 连起来
// ============================================================

const SCENES = {
  // 六间教室共用一个模板，全部注册；能不能进由 CLASSES 里的 open 决定
  ...Object.fromEntries(Object.keys(CLASSES).map(k => [classSceneId(k), () => buildClassroom(k)])),
  hall1: () => buildHallway(1),
  hallway: () => buildHallway(2),   // 二楼（教室、职员室都连到这里）
  hall3: () => buildHallway(3),
  hall4: () => buildHallway(4),
  landing5: buildLanding5,          // 五楼：只有右边楼梯能上来
  auditorium: buildAuditorium,
  staffroom: buildStaffroom,
  // 四楼的四个小房间，也共用一个模板
  ...Object.fromEntries(Object.keys(SMALL_ROOMS).map(k => [SMALL_ROOMS[k].id, () => buildSmallRoom(k)])),
};

// 出错时把错误画在画面上，免得只看到一片黑
function showFatal(err) {
  try {
    const g = document.getElementById('game').getContext('2d');
    g.fillStyle = '#2a1020'; g.fillRect(0, 0, VW, VH);
    g.font = FONT; g.textBaseline = 'top';
    g.fillStyle = '#ff9a8a'; g.fillText('出错了：', 10, 10);
    const msg = String((err && (err.message || err)) || '未知错误');
    wrap(g, msg, VW - 20).slice(0, 8).forEach((ln, i) => { g.fillStyle = '#f4efe4'; g.fillText(ln, 10, 28 + i * 14); });
    g.fillStyle = '#8a94c8'; g.fillText('把这段发给我就行', 10, VH - 20);
  } catch (e) { /* 连画都画不出来就算了 */ }
  console.error(err);
}
addEventListener('error', e => showFatal(e.error || e.message));

(window.FONT_READY || Promise.resolve()).then(() => {
  let game;
  try {
    game = window.GAME = new Game(SCENES, { scene: 'class2A', entry: 'start' });
  } catch (err) { showFatal(err); return; }
  // 选完人之后才显示操作说明；有存档的话直接接着上次的地方继续
  game.onStart = () => {
    game.say([{ name: '', text: `${game.playerName}，第一天上学。\n\n【操作】方向键 / WASD 移动，或者用鼠标点击地面走过去。\n点击同学、黑板、窗户……或按 E 调查。` },
      { name: '', text: '走到教室下面的门口就能去走廊。\n进度会自动保存，想从头开始（重新选人），连按两次 R。' }]);
  };
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    try {
      game.update(dt);
      game.draw();
    } catch (err) { showFatal(err); return; }
    for (const k in pressed) delete pressed[k];
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}).catch(showFatal);
