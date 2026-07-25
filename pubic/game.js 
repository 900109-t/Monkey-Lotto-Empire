// game.js
// 로또 제국: 원숭이 돌잡이 - 프론트엔드 전체 로직

(function () {
  'use strict';

  // =====================================================
  // 상수 데이터
  // =====================================================

  // 운명 10종 - 모두 동일한 "총가치"를 갖도록 설계. 방향성만 다름.
  const FATES = [
    { id: 'money',    icon: '💰', name: '황금 손 사업가', desc: '돈 생산량이 크게 늘어나. 꾸준한 자산가 스타일!',
      bonus: { moneyMul: 1.6 } },
    { id: 'luck',     icon: '🍀', name: '행운의 총아',   desc: '희귀 이벤트와 대박 확률이 확 올라가.',
      bonus: { luckMul: 1.6 } },
    { id: 'event',    icon: '🎉', name: '축제의 왕',     desc: '병맛 이벤트가 자주 터지고 보상도 커.',
      bonus: { eventMul: 1.6 } },
    { id: 'auto',     icon: '⚙️', name: '자동화 장인',   desc: '방치만 해도 수익이 잘 쌓여.',
      bonus: { autoMul: 1.6 } },
    { id: 'rare',     icon: '💎', name: '희귀 수집가',   desc: '희귀 아이템/칭호 해금 확률이 높아져.',
      bonus: { rareMul: 1.6 } },
    { id: 'idle',     icon: '🌙', name: '느긋한 현자',   desc: '오프라인 보상 효율이 훨씬 좋아져.',
      bonus: { idleMul: 1.6 } },
    { id: 'chaos',    icon: '🛸', name: '혼돈의 사도',   desc: '랜덤 대박/쪽박 폭이 커. 하이리스크 하이리턴!',
      bonus: { chaosMul: 1.6 } },
    { id: 'lotto',    icon: '🎟️', name: '복권의 사제',   desc: '복권/로또 관련 보상이 크게 늘어나.',
      bonus: { lottoMul: 1.6 } },
    { id: 'friend',   icon: '🤝', name: '인싸 원숭이',   desc: '친구 보너스와 협동 보상이 커져.',
      bonus: { friendMul: 1.6 } },
    { id: 'collect',  icon: '📦', name: '수집의 달인',   desc: '업적, 칭호, 코스튬 수집 속도가 빨라져.',
      bonus: { collectMul: 1.6 } },
  ];

  // 돌잡이 물건들 (각 운명과 1:1 매칭, 병맛 아이템 포함)
  const DOLJABI_ITEMS = [
    { icon: '💰', fateId: 'money' },
    { icon: '🍀', fateId: 'luck' },
    { icon: '🎁', fateId: 'event' },
    { icon: '⚙️', fateId: 'auto' },
    { icon: '💎', fateId: 'rare' },
    { icon: '🥥', fateId: 'idle' },
    { icon: '🛸', fateId: 'chaos' },
    { icon: '🎟️', fateId: 'lotto' },
    { icon: '👑', fateId: 'friend' },
    { icon: '🚽', fateId: 'collect' },
  ];

  const RANDOM_EVENTS = [
    { text: '🍌 바나나 폭우! 바나나 대박 획득!', apply: (s) => { s.resources.banana += 20 * eventMul(s); } },
    { text: '🐵 원숭이 파업! 잠깐 생산이 멈췄어...', apply: () => {} },
    { text: '🎟️ 황금 복권 등장! 행운 포인트 급증!', apply: (s) => { s.resources.luck += 15 * eventMul(s); } },
    { text: '🛸 UFO 난입! 정체불명의 보상 획득!', apply: (s) => { s.resources.money += 50 * eventMul(s); } },
    { text: '🐔 닭이 번호 대신 골라줬어! 소소한 행운!', apply: (s) => { s.resources.luck += 5 * eventMul(s); } },
    { text: '🚽 황금 변기 발견! 돈이 쏟아진다!', apply: (s) => { s.resources.money += 30 * eventMul(s); } },
    { text: '💥 숫자 폭발! 모든 자원이 살짝 늘었어!', apply: (s) => { s.resources.money += 10; s.resources.banana += 10; s.resources.luck += 5; } },
  ];

  const TUTORIAL_STEPS = [
    { target: null, text: '환영해! 여긴 <b>로또 제국</b>이야. 원숭이가 돌잡이로 네 운명을 정해줬어.' },
    { target: '#my-fate-card', text: '이게 네 <b>운명</b>이야. 꽝은 없어! 방향성만 다를 뿐, 모두 동등하게 강력해.' },
    { target: '.top-bar', text: '상단은 네 <b>재화</b>들이야. 돈, 바나나, 행운, 운명 포인트를 모아봐.' },
    { target: '.center-stage', text: '가운데 <b>원숭이를 탭</b>하면 즉시 보너스를 받을 수 있어. 계속 눌러봐!' },
    { target: '.upgrade-panel', text: '여기서 <b>업그레이드</b>를 사면 자동 수익이 늘어나. 재화를 모아서 눌러봐.' },
    { target: '#nav-ranking', text: '<b>랭킹</b> 버튼으로 전체/친구 순위를 확인할 수 있어.' },
    { target: '#nav-friend', text: '<b>친구</b> 버튼에서 초대 코드를 주고받고 보너스도 받을 수 있어.' },
    { target: '#nav-daily', text: '매일 <b>출석</b>하면 보상을 받을 수 있어. 잊지 말고 챙겨! 이제 시작해보자 🍌' },
  ];

  const UPGRADE_KEYS = ['production', 'luck', 'auto', 'event'];
  const UPGRADE_BASE_COST = { production: 10, luck: 15, auto: 20, event: 25 };
  const UPGRADE_RES = { production: 'money', luck: 'banana', auto: 'money', event: 'luck' };

  const API_BASE = ''; // 같은 서버에서 서빙하므로 상대경로 사용
  const STORAGE_KEY = 'monkey_doljabi_save_v1';

  // =====================================================
  // 상태
  // =====================================================
  let state = null;
  let tickTimer = null;
  let eventTimer = null;
  let syncTimer = null;

  function defaultState() {
    return {
      userId: null,
      inviteCode: null,
      nickname: '',
      fate: null,
      tutorialDone: false,
      resources: { money: 0, banana: 0, luck: 0, fatePoints: 0 },
      upgrades: { production: 1, luck: 1, auto: 1, event: 1 },
      lastSeen: Date.now(),
      lastServerSync: 0,
    };
  }

  function saveLocal() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function loadLocal() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function getFate(id) {
    return FATES.find((f) => f.id === id) || null;
  }

  function eventMul(s) {
    const f = getFate(s.fate);
    return f && f.bonus.eventMul ? f.bonus.eventMul : 1;
  }

  // =====================================================
  // 유틸
  // =====================================================
  function $(sel) { return document.querySelector(sel); }
  function $all(sel) { return document.querySelectorAll(sel); }

  function showScreen(id) {
    $all('.screen').forEach((el) => el.classList.remove('active'));
    $(`#${id}`).classList.add('active');
  }

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
    toast._t = setTimeout(() => el.classList.add('hidden'), 1800);
  }

  async function apiPost(path, body) {
    try {
      const res = await fetch(API_BASE + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return await res.json();
    } catch (e) {
      console.error('API 오류', e);
      return { ok: false, error: '네트워크 오류' };
    }
  }

  async function apiGet(path) {
    try {
      const res = await fetch(API_BASE + path);
      return await res.json();
    } catch (e) {
      console.error('API 오류', e);
      return { ok: false, error: '네트워크 오류' };
    }
  }

  // =====================================================
  // 초기화
  // =====================================================
  function init() {
    const loaded = loadLocal();
    if (loaded && loaded.userId) {
      state = Object.assign(defaultState(), loaded);
      enterMainFlow();
    } else {
      state = defaultState();
      showScreen('screen-nickname');
    }
    bindEvents();
  }

  async function enterMainFlow() {
    if (!state.fate) {
      showScreen('screen-doljabi');
      setupDoljabiStage();
    } else {
      showScreen('screen-main');
      startLoops();
      renderAll();
      if (!state.tutorialDone) {
        setTimeout(() => startTutorial(), 400);
      }
    }
  }

  // =====================================================
  // 닉네임 -> 등록
  // =====================================================
  async function handleStartGame() {
    const input = $('#nickname-input');
    const nick = input.value.trim();
    if (!nick) {
      toast('닉네임을 입력해줘!');
      return;
    }
    const res = await apiPost('/api/register', { nickname: nick });
    if (!res.ok) {
      toast(res.error || '등록 실패. 다시 시도해줘');
      return;
    }
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
  let doljabiPlayed = false;

  function setupDoljabiStage() {
    const wrap = $('#doljabi-items');
    wrap.innerHTML = '';
    DOLJABI_ITEMS.forEach((item, i) => {
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

    // 낮은 확률로 특수 연출 (번개/UFO/미끄러짐)
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

    // 결과 선택
    const picked = DOLJABI_ITEMS[Math.floor(Math.random() * DOLJABI_ITEMS.length)];
    $all('.doljabi-item').forEach((el) => {
      if (el.dataset.fate === picked.fateId) {
        el.classList.add('picked');
      } else {
        el.classList.add('faded');
      }
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
    saveLocal();
    showScreen('screen-main');
    startLoops();
    renderAll();
    setTimeout(() => startTutorial(), 500);
  }

  function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

  // =====================================================
  // 메인 루프 (자동 생산 / 이벤트 / 서버 동기화)
  // =====================================================
  function startLoops() {
    if (tickTimer) clearInterval(tickTimer);
    if (eventTimer) clearInterval(eventTimer);
    if (syncTimer) clearInterval(syncTimer);

    tickTimer = setInterval(tick, 1000);
    eventTimer = setInterval(maybeTriggerEvent, 15000);
    syncTimer = setInterval(syncScore, 10000);
  }

  function fateMul(key) {
    const f = getFate(state.fate);
    if (!f) return 1;
    return f.bonus[key] || 1;
  }

  function tick() {
    const lvP = state.upgrades.production;
    const lvA = state.upgrades.auto;
    const moneyGain = (lvP * 1.2 + lvA * 0.8) * fateMul('moneyMul') * fateMul('autoMul');
    const luckGain = (0.15 + state.upgrades.luck * 0.05) * fateMul('luckMul');

    state.resources.money += moneyGain;
    state.resources.luck += luckGain;

    renderResources();
  }

  function maybeTriggerEvent() {
    const chance = 0.35 * fateMul('eventMul') * (1 + state.upgrades.event * 0.05);
    if (Math.random() > Math.min(chance, 0.9)) return;
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
      state.resources.fatePoints * 10
    );
  }

  async function syncScore() {
    if (!state.userId) return;
    saveLocal();
    await apiPost('/api/score', { userId: state.userId, score: getScore() });
  }

  // =====================================================
  // 탭 원숭이 (수동 보상)
  // =====================================================
  function handleTapMonkey(e) {
    const gain = (2 + state.upgrades.production * 0.3) * fateMul('moneyMul');
    state.resources.money += gain;
    state.resources.fatePoints += 0.02;
    renderResources();
    spawnFloatingText(`+${formatNum(gain)} 💰`, e);
    const monkey = $('#tap-monkey');
    monkey.style.transform = 'scale(0.85) rotate(8deg)';
    setTimeout(() => { monkey.style.transform = ''; }, 120);
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
  // 업그레이드
  // =====================================================
  function upgradeCost(key) {
    const lv = state.upgrades[key];
    return Math.floor(UPGRADE_BASE_COST[key] * Math.pow(1.35, lv - 1));
  }

  function handleUpgrade(key) {
    const cost = upgradeCost(key);
    const resKey = UPGRADE_RES[key];
    if (state.resources[resKey] < cost) {
      toast('재화가 부족해!');
      return;
    }
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
  }

  function renderUpgrades() {
    UPGRADE_KEYS.forEach((key) => {
      $(`#lv-${key}`).textContent = `Lv.${state.upgrades[key]}`;
      const cost = upgradeCost(key);
      const resKey = UPGRADE_RES[key];
      const icon = resKey === 'money' ? '💰' : resKey === 'banana' ? '🍌' : '🍀';
      $(`#cost-${key}`).textContent = `${cost} ${icon}`;
      const btn = document.querySelector(`.btn-upgrade[data-key="${key}"]`);
      if (state.resources[resKey] < cost) btn.classList.add('disabled');
      else btn.classList.remove('disabled');
    });
  }

  function renderAll() {
    renderResources();
    renderFateCard();
    renderUpgrades();
  }

  // =====================================================
  // 튜토리얼
  // =====================================================
  let tutorialIdx = 0;

  function startTutorial() {
    tutorialIdx = 0;
    $('#tutorial-overlay').classList.remove('hidden');
    renderTutorialStep();
  }

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
      } else {
        spotlight.style.display = 'none';
      }
    } else {
      spotlight.style.display = 'none';
    }

    $('#btn-tutorial-next').textContent = tutorialIdx === TUTORIAL_STEPS.length - 1 ? '시작하기!' : '다음';
  }

  async function handleTutorialNext() {
    tutorialIdx += 1;
    if (tutorialIdx >= TUTORIAL_STEPS.length) {
      await finishTutorial();
      return;
    }
    renderTutorialStep();
  }

  async function finishTutorial() {
    $('#tutorial-overlay').classList.add('hidden');
    state.tutorialDone = true;
    saveLocal();
    if (state.userId) {
      await apiPost('/api/tutorial/complete', { userId: state.userId });
    }
  }

  // =====================================================
  // 랭킹 모달
  // =====================================================
  async function openRanking(tab) {
    $('#modal-ranking').classList.remove('hidden');
    switchRankingTab(tab || 'global');
  }

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
      res.top.forEach((row, i) => {
        list.appendChild(rankRow(i + 1, row.nickname, row.score, row.fate));
      });
      if (res.top.length === 0) list.innerHTML = '<div class="rank-row">아직 랭킹 데이터가 없어</div>';
    } else {
      const res = await apiGet(`/api/friends?userId=${encodeURIComponent(state.userId || '')}`);
      if (!res.ok) { list.innerHTML = '<div class="rank-row">불러오기 실패</div>'; return; }
      const myScore = getScore();
      myBanner.textContent = `내 점수: ${formatNum(myScore)}점 (친구 ${res.friends.length}명)`;
      list.innerHTML = '';
      if (res.friends.length === 0) {
        list.innerHTML = '<div class="rank-row">아직 친구가 없어. 친구 탭에서 코드로 추가해봐!</div>';
      } else {
        res.friends.forEach((row, i) => {
          list.appendChild(rankRow(i + 1, row.nickname, row.score, row.fate));
        });
      }
    }
  }

  function rankRow(num, nick, score, fateId) {
    const f = getFate(fateId);
    const div = document.createElement('div');
    div.className = 'rank-row';
    div.innerHTML = `<span class="rank-num">${num}</span><span>${f ? f.icon : '🔮'}</span><span class="rank-nick">${escapeHtml(nick)}</span><span class="rank-score">${formatNum(score)}</span>`;
    return div;
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  // =====================================================
  // 친구 모달
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
    if (res.friends.length === 0) {
      listEl.innerHTML = '<div class="friend-row">아직 친구가 없어. 코드를 공유해봐!</div>';
      return;
    }
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
    } else {
      setFriendMsg(res.error || '친구 추가 실패', false);
    }
  }

  function setFriendMsg(msg, ok) {
    const el = $('#friend-msg');
    el.textContent = msg;
    el.className = 'friend-msg ' + (ok ? 'ok' : 'err');
  }

  function handleCopyCode() {
    const code = state.inviteCode || '';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).then(() => toast('코드를 복사했어!')).catch(() => toast(code));
    } else {
      toast(code);
    }
  }

  // =====================================================
  // 출석 모달
  // =====================================================
  async function openDaily() {
    $('#modal-daily').classList.remove('hidden');
    const content = $('#daily-content');
    content.innerHTML = '<div class="daily-icon">🎁</div><div>불러오는 중...</div>';

    const res = await apiPost('/api/daily/claim', { userId: state.userId });
    if (res.ok) {
      const rewardMoney = 20 * res.rewardDay;
      const rewardLuck = 5 * res.rewardDay;
      state.resources.money += rewardMoney;
      state.resources.luck += rewardLuck;
      saveLocal();
      renderResources();

      content.innerHTML = `
        <div class="daily-icon">🎉</div>
        <div><b>${res.streak}일 연속 출석!</b></div>
        <div>보상: 💰${rewardMoney} + 🍀${rewardLuck}</div>
        ${renderStreakDots(res.rewardDay)}
      `;
    } else {
      content.innerHTML = `
        <div class="daily-icon">✅</div>
        <div>${res.error || '오늘은 이미 출석했어. 내일 다시 와줘!'}</div>
      `;
    }
  }

  function renderStreakDots(rewardDay) {
    let html = '<div class="daily-streak-row">';
    for (let i = 1; i <= 7; i++) {
      html += `<div class="daily-day ${i <= rewardDay ? 'done' : ''}">${i}</div>`;
    }
    html += '</div>';
    return html;
  }

  // =====================================================
  // 설정 모달
  // =====================================================
  function openSettings() {
    $('#modal-settings').classList.remove('hidden');
    $('#settings-nickname').value = state.nickname || '';
  }

  function handleSaveNickname() {
    const v = $('#settings-nickname').value.trim();
    if (!v) { toast('닉네임을 입력해줘'); return; }
    state.nickname = v.slice(0, 12);
    saveLocal();
    toast('닉네임을 변경했어');
  }

  function handleRestartTutorial() {
    closeModal('modal-settings');
    startTutorial();
  }

  // =====================================================
  // 모달 공통
  // =====================================================
  function closeModal(id) {
    $(`#${id}`).classList.add('hidden');
  }

  // =====================================================
  // 이벤트 바인딩
  // =====================================================
  function bindEvents() {
    $('#btn-start-game').addEventListener('click', handleStartGame);
    $('#nickname-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') handleStartGame(); });

    $('#btn-doljabi-go').addEventListener('click', handleDoljabiGo);
    $('#btn-doljabi-confirm').addEventListener('click', handleDoljabiConfirm);
    $('#nav-doljabi-summary').addEventListener('click', () => toast('돌잡이는 계정당 한 번만! 운명은 이미 정해졌어 🔮'));

    $('#tap-monkey').addEventListener('click', handleTapMonkey);

    $all('.btn-upgrade').forEach((btn) => {
      btn.addEventListener('click', () => handleUpgrade(btn.dataset.key));
    });

    $('#nav-ranking').addEventListener('click', () => openRanking('global'));
    $('#tab-global').addEventListener('click', () => switchRankingTab('global'));
    $('#tab-friend').addEventListener('click', () => switchRankingTab('friend'));

    $('#nav-friend').addEventListener('click', openFriend);
    $('#btn-add-friend').addEventListener('click', handleAddFriend);
    $('#btn-copy-code').addEventListener('click', handleCopyCode);

    $('#nav-daily').addEventListener('click', openDaily);
    $('#nav-tutorial').addEventListener('click', startTutorial);

    $('#btn-settings').addEventListener('click', openSettings);
    $('#btn-save-nickname').addEventListener('click', handleSaveNickname);
    $('#btn-restart-tutorial').addEventListener('click', handleRestartTutorial);

    $all('.modal-close').forEach((btn) => {
      btn.addEventListener('click', () => closeModal(btn.dataset.close));
    });
    $all('.modal').forEach((modal) => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
      });
    });

    $('#btn-tutorial-next').addEventListener('click', handleTutorialNext);
    $('#btn-tutorial-skip').addEventListener('click', finishTutorial);

    window.addEventListener('beforeunload', () => { saveLocal(); });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { saveLocal(); syncScore(); }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
