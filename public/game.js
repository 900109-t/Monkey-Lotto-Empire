// game.js
// 로또 제국: 원숭이 돌잡이 (v2) - 프론트엔드 전체 로직

(function () {
  'use strict';

  // =====================================================
  // 상수 데이터
  // =====================================================

  // 운명 10종 - 전부 동일 배율(×1.6)로 설계해서 꽝이 없게 함
  const FATES = [
    { id: 'money',   icon: '💰', name: '황금 손 사업가', desc: '돈 생산량이 크게 늘어나. 꾸준한 자산가 스타일!', bonus: { moneyMul: 1.6 } },
    { id: 'luck',    icon: '🍀', name: '행운의 총아',    desc: '로또 당첨 등급이 잘 나와. 희귀 이벤트도 자주 터져.', bonus: { luckMul: 1.6 } },
    { id: 'event',   icon: '🎉', name: '축제의 왕',      desc: '병맛 이벤트가 자주 터지고 보상도 커.', bonus: { eventMul: 1.6 } },
    { id: 'auto',    icon: '⚙️', name: '자동화 장인',    desc: '자동 생산 효율이 훨씬 좋아져.', bonus: { autoMul: 1.6 } },
    { id: 'rare',    icon: '💎', name: '희귀 수집가',    desc: '로또 고등수(1~2등) 확률이 높아져.', bonus: { rareMul: 1.6 } },
    { id: 'idle',    icon: '🌙', name: '느긋한 현자',    desc: '오프라인 보상 효율이 훨씬 좋아져.', bonus: { idleMul: 1.6 } },
    { id: 'chaos',   icon: '🛸', name: '혼돈의 사도',    desc: '병맛 이벤트가 더 강렬하게 터져. 하이리스크 하이리턴!', bonus: { chaosMul: 1.6 } },
    { id: 'lotto',   icon: '🎟️', name: '복권의 사제',    desc: '로또 당첨 보상 자체가 커져.', bonus: { lottoMul: 1.6 } },
    { id: 'friend',  icon: '🤝', name: '인싸 원숭이',    desc: '친구 보너스와 협동 보상이 커져.', bonus: { friendMul: 1.6 } },
    { id: 'collect', icon: '📦', name: '수집의 달인',    desc: '새 원숭이 영입 비용이 크게 할인돼.', bonus: { collectMul: 1.6 } },
  ];

  const DOLJABI_ITEMS = [
    { icon: '💰', fateId: 'money' }, { icon: '🍀', fateId: 'luck' }, { icon: '🎁', fateId: 'event' },
    { icon: '⚙️', fateId: 'auto' }, { icon: '💎', fateId: 'rare' }, { icon: '🥥', fateId: 'idle' },
    { icon: '🛸', fateId: 'chaos' }, { icon: '🎟️', fateId: 'lotto' }, { icon: '👑', fateId: 'friend' },
    { icon: '🚽', fateId: 'collect' },
  ];

  // 원숭이 도감 8종 - 성향(번호 고르는 방식)이 다르지만 어느 것도 압도적이지 않게 설계
  const MONKEYS = [
    { id: 'basic',      icon: '🐒', name: '초보 원숭이',   style: '랜덤형', weight: 1.00, cost: 0 },
    { id: 'gorilla',    icon: '🦍', name: '고릴라',        style: '안정형', weight: 1.10, cost: 40 },
    { id: 'orangutan',  icon: '🦧', name: '오랑우탄',      style: '패턴형', weight: 1.15, cost: 70 },
    { id: 'kingkong',   icon: '🙈', name: '킹콩',          style: '눈치형', weight: 1.25, cost: 110 },
    { id: 'robot',      icon: '🤖', name: '로봇 원숭이',   style: '기계형', weight: 1.35, cost: 160 },
    { id: 'alien',      icon: '👽', name: '외계 원숭이',   style: '우주형', weight: 1.45, cost: 220 },
    { id: 'skeleton',   icon: '💀', name: '해골 원숭이',   style: '폭주형', weight: 1.60, cost: 300 },
    { id: 'bananagod',  icon: '👑', name: '바나나 신',     style: '예언형', weight: 1.90, cost: 420 },
  ];

  const RANDOM_EVENTS = [
    { text: '🍌 바나나 폭우! 바나나 대박 획득!', apply: (s) => { s.resources.banana += 20 * eventMul(s); } },
    { text: '💩 똥 폭탄 투하! 잠깐 미끄러졌지만 위로금 지급', apply: (s) => { s.resources.luck += 4; } },
    { text: '👽 외계인이 번호를 훔쳐갔어! 대신 운명 포인트로 보상', apply: (s) => { s.resources.fatePoints += 1 * eventMul(s); } },
    { text: '🐵 원숭이 파업! 그래도 시위 간식은 챙겨줬어', apply: (s) => { s.resources.banana += 5; } },
    { text: '🍌✨ 황금 바나나 발견! 엄청난 바나나 획득!', apply: (s) => { s.resources.banana += 35 * eventMul(s); } },
    { text: '🐔 닭이 번호 대신 골라줬어! 소소한 행운!', apply: (s) => { s.resources.luck += 6 * eventMul(s); } },
    { text: '🧙 마법사가 번호를 섞었어! 다음 추첨 확률 상승!', apply: (s) => { s.resources.luck += 10 * eventMul(s); } },
    { text: '📺 로또 방송이 폭주중! 돈이 쏟아진다!', apply: (s) => { s.resources.money += 45 * eventMul(s); } },
    { text: '💥 숫자 폭발! 모든 자원이 골고루 늘었어!', apply: (s) => { s.resources.money += 15; s.resources.banana += 15; s.resources.luck += 8; } },
    { text: '🚽 변기 복권 등장! 돈이 쏟아진다!', apply: (s) => { s.resources.money += 30 * eventMul(s); } },
    { text: '🍌💦 바나나 미끄럼 사고! 그래도 행운은 챙겼어', apply: (s) => { s.resources.luck += 5; } },
    { text: '🤖 로봇 원숭이 오작동! 부품 대신 운명 포인트 지급', apply: (s) => { s.resources.fatePoints += 0.5 * eventMul(s); } },
  ];

  const TUTORIAL_STEPS = [
    { target: null, text: '환영해! 여긴 <b>로또 제국</b>이야. 원숭이가 돌잡이로 네 운명을 정해줬어.' },
    { target: '.my-fate-card', text: '이게 네 <b>운명</b>이야. 꽝은 없어! 방향성만 다를 뿐, 모두 동등하게 강력해.' },
    { target: '.lotto-stage', text: '여기서 원숭이들이 <b>자동으로 로또 번호</b>를 골라. 주기적으로 당첨 등급이 나와!' },
    { target: '.upgrade-panel', text: '<b>시설 6종</b>을 업그레이드하면 생산량, 로또 보상, 이벤트 확률이 다 늘어나.' },
    { target: '#nav-collection', text: '<b>도감</b>에서 새 원숭이를 영입하고 돌잡이 도감도 확인할 수 있어.' },
    { target: '#nav-ranking', text: '<b>랭킹</b> 버튼으로 전체/친구 순위를 확인할 수 있어.' },
    { target: '#nav-friend', text: '<b>친구</b> 버튼에서 초대 코드를 주고받고 보너스도 받을 수 있어.' },
    { target: '#nav-prestige', text: '충분히 성장하면 <b>환생</b>으로 영구 배율을 얻고 다시 시작할 수 있어. 출석 보상도 잊지 마! 🎁' },
  ];

  const UPGRADE_KEYS = ['farm', 'factory', 'lab', 'school', 'broadcast', 'space'];
  const UPGRADE_BASE_COST = { farm: 10, factory: 15, lab: 20, school: 25, broadcast: 30, space: 40 };
  const UPGRADE_RES = { farm: 'money', factory: 'banana', lab: 'money', school: 'luck', broadcast: 'banana', space: 'fatePoints' };

  const API_BASE = '';
  const STORAGE_KEY = 'monkey_lotto_empire_save_v2';

  // =====================================================
  // 상태
  // =====================================================
  let state = null;
  let tickTimer = null;
  let lottoTimerHandle = null;
  let eventTimer = null;
  let syncTimer = null;
  let lottoRemainMs = 8000;

  function defaultState() {
    return {
      userId: null,
      inviteCode: null,
      nickname: '',
      fate: null,
      tutorialDone: false,
      resources: { money: 0, banana: 0, luck: 0, fatePoints: 0 },
      upgrades: { farm: 1, factory: 1, lab: 1, school: 1, broadcast: 1, space: 1 },
      monkeys: ['basic'],
      doljabiDex: [],
      prestigeCount: 0,
      lastSeen: Date.now(),
    };
  }

  function saveLocal() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  function loadLocal() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function getFate(id) { return FATES.find((f) => f.id === id) || null; }
  function getMonkey(id) { return MONKEYS.find((m) => m.id === id) || null; }

  function fateMul(key) {
    const f = getFate(state.fate);
    return f && f.bonus[key] ? f.bonus[key] : 1;
  }
  function eventMul(s) {
    const f = getFate((s || state).fate);
    return f && f.bonus.eventMul ? f.bonus.eventMul : 1;
  }

  function prestigeMult() {
    return 1 + state.prestigeCount * 0.15 + state.upgrades.space * 0.02;
  }

  // =====================================================
  // 유틸
  // =====================================================
  function $(sel) { return document.querySelector(sel); }
  function $all(sel) { return document.querySelectorAll(sel); }
  function showScreen(id) { $all('.screen').forEach((el) => el.classList.remove('active')); $(`#${id}`).classList.add('active'); }
  function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

  function formatNum(n) {
    n = Math.floor(n);
    if (n < 1000) return String(n);
    if (n < 1000000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    if (n < 1000000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    return (n / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
  }

  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.add('hidden'), 1900);
  }

  async function apiPost(path, body) {
    try {
      const res = await fetch(API_BASE + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      return await res.json();
    } catch (e) { console.error('API 오류', e); return { ok: false, error: '네트워크 오류' }; }
  }
  async function apiGet(path) {
    try {
      const res = await fetch(API_BASE + path);
      return await res.json();
    } catch (e) { console.error('API 오류', e); return { ok: false, error: '네트워크 오류' }; }
  }

  function escapeHtml(s) { const div = document.createElement('div'); div.textContent = s; return div.innerHTML; }

  // =====================================================
  // 초기화
  // =====================================================
  function init() {
    const loaded = loadLocal();
    if (loaded && loaded.userId) {
      state = Object.assign(defaultState(), loaded);
      state.resources = Object.assign(defaultState().resources, loaded.resources || {});
      state.upgrades = Object.assign(defaultState().upgrades, loaded.upgrades || {});
      applyOfflineReward();
      enterMainFlow();
    } else {
      state = defaultState();
      showScreen('screen-nickname');
    }
    bindEvents();
  }

  function applyOfflineReward() {
    if (!state.fate) return;
    const elapsedSec = Math.min((Date.now() - (state.lastSeen || Date.now())) / 1000, 4 * 3600); // 최대 4시간
    if (elapsedSec < 30) return;
    const baseRate = (state.upgrades.farm * 0.5 + state.upgrades.lab * 0.3);
    const gain = elapsedSec * baseRate * 0.4 * fateMul('idleMul') * fateMul('autoMul') * prestigeMult();
    if (gain > 1) {
      state.resources.money += gain;
      setTimeout(() => toast(`오프라인 보상: +${formatNum(gain)} 💰`), 600);
    }
    state.lastSeen = Date.now();
  }

  async function enterMainFlow() {
    if (!state.fate) {
      showScreen('screen-doljabi');
      setupDoljabiStage();
    } else {
      showScreen('screen-main');
      startLoops();
      renderAll();
      if (!state.tutorialDone) setTimeout(() => startTutorial(), 400);
    }
  }

  // =====================================================
  // 닉네임 -> 등록
  // =====================================================
  async function handleStartGame() {
    const input = $('#nickname-input');
    const nick = input.value.trim();
    if (!nick) { toast('닉네임을 입력해줘!'); return; }
    const res = await apiPost('/api/register', { nickname: nick });
    if (!res.ok) { toast(res.error || '등록 실패. 다시 시도해줘'); return; }
    state.userId = res.userId;
    state.inviteCode = res.inviteCode;
    state.nickname = nick;
    saveLocal();
    showScreen('screen-doljabi');
    setupDoljabiStage();
  }

  // =====================================================
  // 돌잡이 연출
  // =====================================================
  function setupDoljabiStage() {
    const wrap = $('#doljabi-items');
    wrap.innerHTML = '';
    DOLJABI_ITEMS.forEach((item) => {
      const div = document.createElement('div');
      div.className = 'doljabi-item';
      div.dataset.fate = item.fateId;
      div.textContent = item.icon;
      wrap.appendChild(div);
    });
    $('#doljabi-result').classList.add('hidden');
    $('#btn-doljabi-go').classList.remove('hidden');
  }

  async function handleDoljabiGo() {
    $('#btn-doljabi-go').classList.add('hidden');
    const monkey = $('#doljabi-monkey');
    monkey.classList.add('picking');

    const specialRoll = Math.random();
    let specialText = '';
    if (specialRoll < 0.06) specialText = '⚡';
    else if (specialRoll < 0.11) specialText = '🛸';
    else if (specialRoll < 0.15) specialText = '💫';

    await sleep(1400);
    monkey.classList.remove('picking');

    if (specialText) {
      const fx = $('#doljabi-effect');
      fx.textContent = specialText;
      fx.classList.remove('show');
      void fx.offsetWidth;
      fx.classList.add('show');
      await sleep(700);
    }

    const picked = DOLJABI_ITEMS[Math.floor(Math.random() * DOLJABI_ITEMS.length)];
    $all('.doljabi-item').forEach((el) => {
      if (el.dataset.fate === picked.fateId) el.classList.add('picked');
      else el.classList.add('faded');
    });

    await sleep(500);

    const fate = getFate(picked.fateId);
    $('#doljabi-result-icon').textContent = fate.icon;
    $('#doljabi-result-name').textContent = fate.name;
    $('#doljabi-result-desc').textContent = fate.desc;
    $('#doljabi-result').classList.remove('hidden');

    state.pendingFate = fate.id;
  }

  async function handleDoljabiConfirm() {
    if (!state.pendingFate) return;
    const res = await apiPost('/api/gacha/start', { userId: state.userId, fate: state.pendingFate });
    state.fate = (res.ok && res.fate) ? res.fate : state.pendingFate;
    if (!state.doljabiDex.includes(state.fate)) state.doljabiDex.push(state.fate);
    saveLocal();
    showScreen('screen-main');
    startLoops();
    renderAll();
    setTimeout(() => startTutorial(), 500);
  }

  // =====================================================
  // 메인 루프
  // =====================================================
  function startLoops() {
    if (tickTimer) clearInterval(tickTimer);
    if (lottoTimerHandle) clearInterval(lottoTimerHandle);
    if (eventTimer) clearInterval(eventTimer);
    if (syncTimer) clearInterval(syncTimer);

    tickTimer = setInterval(tick, 1000);
    lottoRemainMs = lottoInterval();
    lottoTimerHandle = setInterval(lottoTick, 1000);
    eventTimer = setInterval(maybeTriggerEvent, 16000);
    syncTimer = setInterval(syncAll, 12000);
  }

  function tick() {
    const gain = (state.upgrades.farm * 0.9) * fateMul('autoMul') * prestigeMult();
    const luckGain = (0.12 + state.upgrades.lab * 0.05) * fateMul('luckMul') * prestigeMult();
    state.resources.banana += gain;
    state.resources.luck += luckGain;
    renderResources();
  }

  function lottoInterval() {
    return Math.max(3000, 8000 - (state.upgrades.factory - 1) * 400);
  }

  function lottoTick() {
    lottoRemainMs -= 1000;
    if (lottoRemainMs <= 0) {
      runLottoDraw();
      lottoRemainMs = lottoInterval();
    }
    const sec = Math.max(0, Math.ceil(lottoRemainMs / 1000));
    $('#lotto-timer').textContent = `다음 추첨 ${sec}초`;
  }

  function totalLuckPower() {
    const monkeyWeightSum = state.monkeys.reduce((sum, id) => {
      const m = getMonkey(id);
      return sum + (m ? m.weight : 1);
    }, 0);
    return (monkeyWeightSum + state.upgrades.lab * 0.15 + state.resources.luck * 0.002) * fateMul('luckMul');
  }

  async function runLottoDraw() {
    const monkeyLayer = $('#lotto-monkeys');
    monkeyLayer.innerHTML = state.monkeys.map((id) => {
      const m = getMonkey(id);
      return `<span class="picking">${m ? m.icon : '🐒'}</span>`;
    }).join('');

    await sleep(600);

    const ballsLayer = $('#lotto-balls');
    ballsLayer.innerHTML = '';
    for (let i = 0; i < 6; i++) {
      const num = 1 + Math.floor(Math.random() * 45);
      const ball = document.createElement('div');
      ball.className = 'lotto-ball';
      ball.textContent = num;
      ballsLayer.appendChild(ball);
      await sleep(120);
    }

    monkeyLayer.querySelectorAll('span').forEach((el) => el.classList.remove('picking'));

    const power = totalLuckPower();
    const rareBonus = fateMul('rareMul');
    // 등급 확률: 낙첨 / 4등 / 3등 / 2등 / 1등(잭팟)
    let probs = [0.62, 0.24, 0.09, 0.04, 0.01];
    const boost = Math.min(0.35, power * 0.01);
    probs[0] = Math.max(0.15, probs[0] - boost);
    probs[3] += boost * 0.4 * rareBonus;
    probs[4] += boost * 0.15 * rareBonus;
    const total = probs.reduce((a, b) => a + b, 0);
    probs = probs.map((p) => p / total);

    const roll = Math.random();
    let acc = 0, tier = 0;
    for (let i = 0; i < probs.length; i++) {
      acc += probs[i];
      if (roll <= acc) { tier = i; break; }
    }

    const rewardBase = 12 * state.upgrades.factory * fateMul('lottoMul') * prestigeMult();
    let resultText = '';
    if (tier === 0) {
      state.resources.banana += 2;
      resultText = '😅 이번 회차는 낙첨... 참가상 바나나 지급';
    } else if (tier === 1) {
      state.resources.money += rewardBase * 1;
      state.resources.banana += 3;
      resultText = `🎉 4등 당첨! +${formatNum(rewardBase)} 💰`;
    } else if (tier === 2) {
      state.resources.money += rewardBase * 3;
      state.resources.luck += 3;
      resultText = `🎊 3등 당첨! +${formatNum(rewardBase * 3)} 💰`;
    } else if (tier === 3) {
      state.resources.money += rewardBase * 8;
      state.resources.fatePoints += 0.5;
      resultText = `🥳 2등 당첨! +${formatNum(rewardBase * 8)} 💰`;
    } else {
      state.resources.money += rewardBase * 30;
      state.resources.fatePoints += 3;
      resultText = `👑 1등 잭팟!!! +${formatNum(rewardBase * 30)} 💰`;
    }

    $('#lotto-result-text').textContent = resultText;
    renderResources();
    saveLocal();
  }

  function maybeTriggerEvent() {
    const chance = 0.3 * fateMul('eventMul') * (1 + state.upgrades.broadcast * 0.06) * (1 + (fateMul('chaosMul') - 1) * 0.5);
    if (Math.random() > Math.min(chance, 0.85)) return;
    const ev = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
    ev.apply(state);
    const banner = $('#event-banner');
    banner.textContent = ev.text;
    banner.classList.remove('hidden');
    clearTimeout(maybeTriggerEvent._t);
    maybeTriggerEvent._t = setTimeout(() => banner.classList.add('hidden'), 3200);
    renderResources();
    saveLocal();
  }

  function getScore() {
    return Math.floor(
      state.resources.money +
      state.resources.banana * 2 +
      state.resources.luck * 3 +
      state.resources.fatePoints * 20 +
      state.monkeys.length * 150 +
      state.prestigeCount * 5000
    );
  }

  async function syncAll() {
    if (!state.userId) return;
    state.lastSeen = Date.now();
    saveLocal();
    await apiPost('/api/score', { userId: state.userId, score: getScore() });
    await apiPost('/api/progress/sync', { userId: state.userId, monkeys: state.monkeys, doljabiDex: state.doljabiDex, prestigeCount: state.prestigeCount });
  }

  // =====================================================
  // 탭 보너스
  // =====================================================
  function handleTapMonkey(e) {
    const gain = (2 + state.upgrades.farm * 0.3) * fateMul('moneyMul') * prestigeMult();
    state.resources.money += gain;
    state.resources.fatePoints += 0.02;
    renderResources();
    spawnFloatingText(`+${formatNum(gain)} 💰`, e);
  }

  function spawnFloatingText(text, e) {
    const layer = $('#floating-text-layer');
    const span = document.createElement('span');
    span.className = 'floating-text';
    span.textContent = text;
    const rect = layer.getBoundingClientRect();
    const x = (e && e.clientX ? e.clientX - rect.left : rect.width / 2) + (Math.random() * 30 - 15);
    const y = (e && e.clientY ? e.clientY - rect.top : rect.height / 2);
    span.style.left = `${x}px`;
    span.style.top = `${y}px`;
    layer.appendChild(span);
    setTimeout(() => span.remove(), 900);
  }

  // =====================================================
  // 업그레이드(시설)
  // =====================================================
  function upgradeCost(key) {
    const lv = state.upgrades[key];
    return Math.floor(UPGRADE_BASE_COST[key] * Math.pow(1.35, lv - 1));
  }

  function handleUpgrade(key) {
    const cost = upgradeCost(key);
    const resKey = UPGRADE_RES[key];
    if (state.resources[resKey] < cost) { toast('재화가 부족해!'); return; }
    state.resources[resKey] -= cost;
    state.upgrades[key] += 1;
    saveLocal();
    renderAll();
  }

  // =====================================================
  // 렌더링
  // =====================================================
  function renderResources() {
    $('#res-money').textContent = formatNum(state.resources.money);
    $('#res-banana').textContent = formatNum(state.resources.banana);
    $('#res-luck').textContent = formatNum(state.resources.luck);
    $('#res-fate').textContent = formatNum(state.resources.fatePoints);
  }

  function renderFateCard() {
    const f = getFate(state.fate);
    if (!f) return;
    $('#my-fate-icon').textContent = f.icon;
    $('#my-fate-name').textContent = f.name;
    const badge = $('#my-prestige-badge');
    if (state.prestigeCount > 0) { badge.textContent = `🌌 x${state.prestigeCount}`; badge.classList.remove('hidden'); }
    else badge.classList.add('hidden');
  }

  function renderUpgrades() {
    UPGRADE_KEYS.forEach((key) => {
      $(`#lv-${key}`).textContent = `Lv.${state.upgrades[key]}`;
      const cost = upgradeCost(key);
      const resKey = UPGRADE_RES[key];
      const icon = resKey === 'money' ? '💰' : resKey === 'banana' ? '🍌' : resKey === 'luck' ? '🍀' : '🔮';
      $(`#cost-${key}`).textContent = `${cost} ${icon}`;
      const btn = document.querySelector(`.btn-upgrade[data-key="${key}"]`);
      if (state.resources[resKey] < cost) btn.classList.add('disabled'); else btn.classList.remove('disabled');
    });
  }

  function renderAll() { renderResources(); renderFateCard(); renderUpgrades(); }

  // =====================================================
  // 튜토리얼
  // =====================================================
  let tutorialIdx = 0;
  function startTutorial() { tutorialIdx = 0; $('#tutorial-overlay').classList.remove('hidden'); renderTutorialStep(); }

  function renderTutorialStep() {
    const step = TUTORIAL_STEPS[tutorialIdx];
    $('#tutorial-step-num').textContent = `${tutorialIdx + 1} / ${TUTORIAL_STEPS.length}`;
    $('#tutorial-text').innerHTML = step.text;
    const spotlight = $('#tutorial-spotlight');
    if (step.target) {
      const el = document.querySelector(step.target);
      if (el) {
        const rect = el.getBoundingClientRect();
        spotlight.style.display = 'block';
        spotlight.style.left = `${rect.left - 8}px`;
        spotlight.style.top = `${rect.top - 8}px`;
        spotlight.style.width = `${rect.width + 16}px`;
        spotlight.style.height = `${rect.height + 16}px`;
      } else spotlight.style.display = 'none';
    } else spotlight.style.display = 'none';
    $('#btn-tutorial-next').textContent = tutorialIdx === TUTORIAL_STEPS.length - 1 ? '시작하기!' : '다음';
  }

  async function handleTutorialNext() {
    tutorialIdx += 1;
    if (tutorialIdx >= TUTORIAL_STEPS.length) { await finishTutorial(); return; }
    renderTutorialStep();
  }

  async function finishTutorial() {
    $('#tutorial-overlay').classList.add('hidden');
    state.tutorialDone = true;
    saveLocal();
    if (state.userId) await apiPost('/api/tutorial/complete', { userId: state.userId });
  }

  // =====================================================
  // 랭킹
  // =====================================================
  async function openRanking(tab) { $('#modal-ranking').classList.remove('hidden'); switchRankingTab(tab || 'global'); }

  async function switchRankingTab(tab) {
    $('#tab-global').classList.toggle('active', tab === 'global');
    $('#tab-friend').classList.toggle('active', tab === 'friend');
    const list = $('#ranking-list');
    const myBanner = $('#ranking-my-rank');
    list.innerHTML = '<div class="rank-row">불러오는 중...</div>';

    if (tab === 'global') {
      const res = await apiGet(`/api/leaderboard?userId=${encodeURIComponent(state.userId || '')}`);
      if (!res.ok) { list.innerHTML = '<div class="rank-row">불러오기 실패</div>'; return; }
      myBanner.textContent = res.me ? `내 순위: ${res.me.rank}위 (${formatNum(res.me.score)}점)` : '아직 랭킹에 등록되지 않았어. 조금만 플레이해봐!';
      list.innerHTML = '';
      res.top.forEach((row, i) => list.appendChild(rankRow(i + 1, row.nickname, row.score, row.fate)));
      if (res.top.length === 0) list.innerHTML = '<div class="rank-row">아직 랭킹 데이터가 없어</div>';
    } else {
      const res = await apiGet(`/api/friends?userId=${encodeURIComponent(state.userId || '')}`);
      if (!res.ok) { list.innerHTML = '<div class="rank-row">불러오기 실패</div>'; return; }
      myBanner.textContent = `내 점수: ${formatNum(getScore())}점 (친구 ${res.friends.length}명)`;
      list.innerHTML = '';
      if (res.friends.length === 0) list.innerHTML = '<div class="rank-row">아직 친구가 없어. 친구 탭에서 코드로 추가해봐!</div>';
      else res.friends.forEach((row, i) => list.appendChild(rankRow(i + 1, row.nickname, row.score, row.fate)));
    }
  }

  function rankRow(num, nick, score, fateId) {
    const f = getFate(fateId);
    const div = document.createElement('div');
    div.className = 'rank-row';
    div.innerHTML = `<span class="rank-num">${num}</span><span>${f ? f.icon : '🔮'}</span><span class="rank-nick">${escapeHtml(nick)}</span><span class="rank-score">${formatNum(score)}</span>`;
    return div;
  }

  // =====================================================
  // 친구
  // =====================================================
  async function openFriend() {
    $('#modal-friend').classList.remove('hidden');
    $('#my-invite-code').textContent = state.inviteCode || '------';
    $('#friend-msg').textContent = '';
    await loadFriendList();
  }

  async function loadFriendList() {
    const res = await apiGet(`/api/friends?userId=${encodeURIComponent(state.userId || '')}`);
    const listEl = $('#friend-list');
    listEl.innerHTML = '';
    if (!res.ok) return;
    if (res.friends.length === 0) { listEl.innerHTML = '<div class="friend-row">아직 친구가 없어. 코드를 공유해봐!</div>'; return; }
    res.friends.forEach((f) => {
      const fate = getFate(f.fate);
      const div = document.createElement('div');
      div.className = 'friend-row';
      div.innerHTML = `<span class="friend-fate-icon">${fate ? fate.icon : '🔮'}</span><span class="friend-nick">${escapeHtml(f.nickname)}</span><span class="rank-score">${formatNum(f.score)}</span>`;
      listEl.appendChild(div);
    });
  }

  async function handleAddFriend() {
    const code = $('#friend-code-input').value.trim().toUpperCase();
    if (!code) { setFriendMsg('코드를 입력해줘', false); return; }
    const res = await apiPost('/api/friend/add', { userId: state.userId, code });
    if (res.ok) {
      setFriendMsg(`${res.friend.nickname}님과 친구가 됐어! 🎉`, true);
      $('#friend-code-input').value = '';
      await loadFriendList();
    } else setFriendMsg(res.error || '친구 추가 실패', false);
  }

  function setFriendMsg(msg, ok) {
    const el = $('#friend-msg');
    el.textContent = msg;
    el.className = 'friend-msg ' + (ok ? 'ok' : 'err');
  }

  function handleCopyCode() {
    const code = state.inviteCode || '';
    if (navigator.clipboard) navigator.clipboard.writeText(code).then(() => toast('코드를 복사했어!')).catch(() => toast(code));
    else toast(code);
  }

  // =====================================================
  // 출석
  // =====================================================
  async function openDaily() {
    $('#modal-daily').classList.remove('hidden');
    const content = $('#daily-content');
    content.innerHTML = '<div class="daily-icon">🎁</div><div>불러오는 중...</div>';

    const res = await apiPost('/api/daily/claim', { userId: state.userId });
    if (res.ok) {
      const rewardMoney = 25 * res.rewardDay;
      const rewardLuck = 6 * res.rewardDay;
      state.resources.money += rewardMoney;
      state.resources.luck += rewardLuck;
      saveLocal();
      renderResources();
      content.innerHTML = `<div class="daily-icon">🎉</div><div><b>${res.streak}일 연속 출석!</b></div><div>보상: 💰${rewardMoney} + 🍀${rewardLuck}</div>${renderStreakDots(res.rewardDay)}`;
    } else {
      content.innerHTML = `<div class="daily-icon">✅</div><div>${res.error || '오늘은 이미 출석했어. 내일 다시 와줘!'}</div>`;
    }
  }

  function renderStreakDots(rewardDay) {
    let html = '<div class="daily-streak-row">';
    for (let i = 1; i <= 7; i++) html += `<div class="daily-day ${i <= rewardDay ? 'done' : ''}">${i}</div>`;
    html += '</div>';
    return html;
  }

  // =====================================================
  // 수집(도감)
  // =====================================================
  let collectionTab = 'monkeys';

  function openCollection() { $('#modal-collection').classList.remove('hidden'); switchCollectionTab('monkeys'); }

  function switchCollectionTab(tab) {
    collectionTab = tab;
    $('#tab-monkeys').classList.toggle('active', tab === 'monkeys');
    $('#tab-doljabi').classList.toggle('active', tab === 'doljabi');
    renderCollectionGrid();
  }

  function monkeyRecruitCost(monkey) {
    const discount = Math.min(0.55, state.upgrades.school * 0.03 + (fateMul('collectMul') - 1));
    return Math.max(0, Math.floor(monkey.cost * (1 - discount)));
  }

  function renderCollectionGrid() {
    const grid = $('#collection-grid');
    const progress = $('#collection-progress');
    grid.innerHTML = '';

    if (collectionTab === 'monkeys') {
      progress.textContent = `보유 원숭이: ${state.monkeys.length} / ${MONKEYS.length}`;
      MONKEYS.forEach((m) => {
        const owned = state.monkeys.includes(m.id);
        const div = document.createElement('div');
        div.className = 'collection-item' + (owned ? '' : ' locked');
        const cost = monkeyRecruitCost(m);
        div.innerHTML = `
          <div class="c-icon">${m.icon}</div>
          <div class="c-name">${m.name}</div>
          <div class="c-name" style="opacity:.6">${m.style}</div>
          ${owned ? '<div class="c-btn">보유중</div>' : `<div class="c-btn" data-recruit="${m.id}">${cost} 🔮</div>`}
        `;
        grid.appendChild(div);
      });
      grid.querySelectorAll('[data-recruit]').forEach((btn) => {
        btn.addEventListener('click', () => handleRecruitMonkey(btn.dataset.recruit));
      });
    } else {
      progress.textContent = `수집한 돌잡이: ${state.doljabiDex.length} / ${DOLJABI_ITEMS.length} (운명은 계정당 1개만 확정돼)`;
      DOLJABI_ITEMS.forEach((item) => {
        const owned = state.doljabiDex.includes(item.fateId);
        const f = getFate(item.fateId);
        const div = document.createElement('div');
        div.className = 'collection-item' + (owned ? '' : ' locked');
        div.innerHTML = `<div class="c-icon">${item.icon}</div><div class="c-name">${owned ? f.name : '???'}</div>`;
        grid.appendChild(div);
      });
    }
  }

  function handleRecruitMonkey(id) {
    const m = getMonkey(id);
    if (!m || state.monkeys.includes(id)) return;
    const cost = monkeyRecruitCost(m);
    if (state.resources.fatePoints < cost) { toast('운명 포인트가 부족해!'); return; }
    state.resources.fatePoints -= cost;
    state.monkeys.push(id);
    saveLocal();
    renderResources();
    renderCollectionGrid();
    toast(`${m.name} 영입 완료! 🎉`);
  }

  // =====================================================
  // 환생(프레스티지)
  // =====================================================
  function prestigeThreshold() { return 5000 * (state.prestigeCount + 1); }

  function openPrestige() {
    $('#modal-prestige').classList.remove('hidden');
    renderPrestigeContent();
  }

  function renderPrestigeContent() {
    const content = $('#prestige-content');
    const score = getScore();
    const threshold = prestigeThreshold();
    const nextMult = 1 + (state.prestigeCount + 1) * 0.15 + state.upgrades.space * 0.02;
    const canPrestige = score >= threshold;
    content.innerHTML = `
      <div class="prestige-stat-row"><span>현재 점수</span><span>${formatNum(score)}</span></div>
      <div class="prestige-stat-row"><span>필요 점수</span><span>${formatNum(threshold)}</span></div>
      <div class="prestige-stat-row"><span>현재 영구 배율</span><span>x${prestigeMult().toFixed(2)}</span></div>
      <div class="prestige-stat-row"><span>환생 후 영구 배율</span><span>x${nextMult.toFixed(2)}</span></div>
      <div class="prestige-warning">환생하면 돈/바나나/행운/시설 레벨이 초기화돼. 대신 원숭이 도감, 운명, 운명 포인트, 영구 배율은 그대로 유지돼!</div>
      <button id="btn-do-prestige" class="btn-primary btn-lg ${canPrestige ? '' : 'disabled'}">${canPrestige ? '환생하기 🌌' : '점수가 부족해'}</button>
    `;
    const btn = $('#btn-do-prestige');
    if (canPrestige) btn.addEventListener('click', handlePrestige);
  }

  async function handlePrestige() {
    state.resources.money = 0;
    state.resources.banana = 0;
    state.resources.luck = 0;
    UPGRADE_KEYS.forEach((k) => { state.upgrades[k] = 1; });
    state.prestigeCount += 1;
    saveLocal();
    renderAll();
    closeModal('modal-prestige');
    toast(`환생 완료! 영구 배율이 x${prestigeMult().toFixed(2)}가 됐어 🌌`);
    if (state.userId) await apiPost('/api/progress/sync', { userId: state.userId, monkeys: state.monkeys, doljabiDex: state.doljabiDex, prestigeCount: state.prestigeCount });
  }

  // =====================================================
  // 설정
  // =====================================================
  function openSettings() { $('#modal-settings').classList.remove('hidden'); $('#settings-nickname').value = state.nickname || ''; }

  function handleSaveNickname() {
    const v = $('#settings-nickname').value.trim();
    if (!v) { toast('닉네임을 입력해줘'); return; }
    state.nickname = v.slice(0, 12);
    saveLocal();
    toast('닉네임을 변경했어');
  }

  function handleRestartTutorial() { closeModal('modal-settings'); startTutorial(); }

  // =====================================================
  // 모달 공통
  // =====================================================
  function closeModal(id) { $(`#${id}`).classList.add('hidden'); }

  // =====================================================
  // 이벤트 바인딩
  // =====================================================
  function bindEvents() {
    $('#btn-start-game').addEventListener('click', handleStartGame);
    $('#nickname-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') handleStartGame(); });

    $('#btn-doljabi-go').addEventListener('click', handleDoljabiGo);
    $('#btn-doljabi-confirm').addEventListener('click', handleDoljabiConfirm);

    $('#tap-monkey').addEventListener('click', handleTapMonkey);

    $all('.btn-upgrade').forEach((btn) => btn.addEventListener('click', () => handleUpgrade(btn.dataset.key)));

    $('#nav-ranking').addEventListener('click', () => openRanking('global'));
    $('#tab-global').addEventListener('click', () => switchRankingTab('global'));
    $('#tab-friend').addEventListener('click', () => switchRankingTab('friend'));

    $('#nav-friend').addEventListener('click', openFriend);
    $('#btn-add-friend').addEventListener('click', handleAddFriend);
    $('#btn-copy-code').addEventListener('click', handleCopyCode);

    $('#btn-daily-badge').addEventListener('click', openDaily);
    $('#nav-tutorial').addEventListener('click', startTutorial);

    $('#nav-collection').addEventListener('click', openCollection);
    $('#tab-monkeys').addEventListener('click', () => switchCollectionTab('monkeys'));
    $('#tab-doljabi').addEventListener('click', () => switchCollectionTab('doljabi'));

    $('#nav-prestige').addEventListener('click', openPrestige);

    $('#btn-settings').addEventListener('click', openSettings);
    $('#btn-save-nickname').addEventListener('click', handleSaveNickname);
    $('#btn-restart-tutorial').addEventListener('click', handleRestartTutorial);

    $all('.modal-close').forEach((btn) => btn.addEventListener('click', () => closeModal(btn.dataset.close)));
    $all('.modal').forEach((modal) => modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); }));

    $('#btn-tutorial-next').addEventListener('click', handleTutorialNext);
    $('#btn-tutorial-skip').addEventListener('click', finishTutorial);

    window.addEventListener('beforeunload', () => { state.lastSeen = Date.now(); saveLocal(); });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { state.lastSeen = Date.now(); saveLocal(); syncAll(); }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
