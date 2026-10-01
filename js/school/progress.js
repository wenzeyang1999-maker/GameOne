// ============================================================
//  跨周目进度：和单局存档分开存，清档（连按两次 R）不会动它
//    单局存档  school-save-v1  —— 当前在哪、书包里有什么，通关或清档就没了
//    跨周目    school-meta-v1  —— 玩过几局、谁通关过，永远留着
//
//  彩蛋（Miss Ren 第一局通关）必须靠 runs 这个计数器，所以它从第一次
//  启动就得开始数——等以后再加就永远分不出「第一局」了
// ============================================================

const META_KEY = 'school-meta-v1';

const META_DEFAULT = {
  runs: 0,           // 开始过多少局（选完人算一局；读档继续不算）
  cleared: [],       // 通关过的角色名，不重复
  firstClear: null,  // 第一次通关：{ name, run } —— run 是第几局通的
  seen: [],          // 跨周目记住的事（见过的剧情、解锁的内容），所有角色共享
};

function loadMeta() {
  try {
    const d = JSON.parse(localStorage.getItem(META_KEY));
    if (d && typeof d === 'object') return { ...META_DEFAULT, ...d };
  } catch (e) { /* 存不了就用默认值，不影响玩 */ }
  return { ...META_DEFAULT };
}

function saveMeta(m) {
  try { localStorage.setItem(META_KEY, JSON.stringify(m)); } catch (e) { /* 忽略 */ }
}

// 选完人开始新的一局
function metaStartRun(m) {
  m.runs++;
  saveMeta(m);
  return m.runs;
}

// 通关。run 传这一局是第几局（开局时记下来的那个数）
function metaClear(m, name, run) {
  if (!m.cleared.includes(name)) m.cleared.push(name);
  if (!m.firstClear) m.firstClear = { name, run };
  saveMeta(m);
}

// 跨周目记住一件事（所有角色共享）
function metaRemember(m, key) {
  if (!m.seen.includes(key)) { m.seen.push(key); saveMeta(m); }
}
function metaKnows(m, key) { return m.seen.includes(key); }

// 彩蛋：第一局就用 Miss Ren 通关
function metaEgg(m) {
  return !!m.firstClear && m.firstClear.name === 'Miss Ren' && m.firstClear.run === 1;
}
