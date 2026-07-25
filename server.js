// server.js
// 로또 제국: 원숭이 돌잡이 (v2 - 자동로또/수집/환생 확장판)
// Express + Upstash Redis(REST). 프론트(정적 파일)와 API를 같은 서버에서 서빙한다.

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const { Redis } = require('@upstash/redis');

const app = express();
const PORT = process.env.PORT || 3000;

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const LEADERBOARD_KEY = 'leaderboard';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---------------------------------------------
// 유틸
// ---------------------------------------------
function genId() {
  return crypto.randomBytes(8).toString('hex');
}

function genInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 헷갈리는 0/O/1/I 제외
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

async function getUser(userId) {
  const user = await redis.hgetall(`user:${userId}`);
  if (!user || Object.keys(user).length === 0) return null;
  return user;
}

async function requireUser(req, res, next) {
  const userId = req.body.userId || req.query.userId;
  if (!userId) return res.status(400).json({ ok: false, error: 'userId가 필요해' });
  const user = await getUser(userId);
  if (!user) return res.status(404).json({ ok: false, error: '존재하지 않는 유저야' });
  req.user = user;
  req.userId = userId;
  next();
}

// ---------------------------------------------
// API: 유저 등록
// ---------------------------------------------
app.post('/api/register', async (req, res) => {
  try {
    const { nickname } = req.body;
    if (!nickname || typeof nickname !== 'string' || nickname.trim().length === 0) {
      return res.status(400).json({ ok: false, error: '닉네임을 입력해줘' });
    }
    const cleanNick = nickname.trim().slice(0, 12);

    const userId = genId();
    let inviteCode = genInviteCode();
    for (let i = 0; i < 5; i++) {
      const exists = await redis.get(`code:${inviteCode}`);
      if (!exists) break;
      inviteCode = genInviteCode();
    }

    const userData = {
      userId,
      nickname: cleanNick,
      fate: '',
      inviteCode,
      score: 0,
      tutorialDone: 'false',
      dailyStreak: 0,
      lastClaim: '',
      createdAt: Date.now(),
      achievements: JSON.stringify([]),
      monkeys: JSON.stringify(['basic']), // 기본 원숭이 1종 보유
      doljabiDex: JSON.stringify([]),
      prestigeCount: 0,
      friendPointsBonus: 0,
    };

    await redis.hset(`user:${userId}`, userData);
    await redis.set(`code:${inviteCode}`, userId);

    res.json({ ok: true, userId, inviteCode });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: '서버 오류' });
  }
});

// ---------------------------------------------
// API: 돌잡이 결과 확정 (계정당 1회)
// ---------------------------------------------
app.post('/api/gacha/start', requireUser, async (req, res) => {
  try {
    const { fate } = req.body;
    if (!fate) return res.status(400).json({ ok: false, error: 'fate가 필요해' });

    if (req.user.fate && req.user.fate.length > 0) {
      return res.json({ ok: true, fate: req.user.fate, alreadySet: true });
    }

    // 돌잡이 결과는 도감에도 자동 등록
    let dex = [];
    try { dex = JSON.parse(req.user.doljabiDex || '[]'); } catch (e) { dex = []; }
    if (!dex.includes(fate)) dex.push(fate);

    await redis.hset(`user:${req.userId}`, { fate, doljabiDex: JSON.stringify(dex) });
    res.json({ ok: true, fate, alreadySet: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: '서버 오류' });
  }
});

// ---------------------------------------------
// API: 내 정보 조회
// ---------------------------------------------
app.get('/api/me', async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ ok: false, error: 'userId가 필요해' });
    const user = await getUser(userId);
    if (!user) return res.status(404).json({ ok: false, error: '존재하지 않는 유저야' });

    const rank = await redis.zrank(LEADERBOARD_KEY, userId);
    res.json({ ok: true, user, rank: rank === null || rank === undefined ? null : rank + 1 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: '서버 오류' });
  }
});

// ---------------------------------------------
// API: 점수 갱신 (랭킹용) - 역행 방지 + 이상치 방어
// ---------------------------------------------
app.post('/api/score', requireUser, async (req, res) => {
  try {
    let { score } = req.body;
    score = Number(score);
    if (!Number.isFinite(score) || score < 0) {
      return res.status(400).json({ ok: false, error: '유효하지 않은 점수야' });
    }
    const prevScore = Number(req.user.score || 0);
    if (prevScore > 1000 && score > prevScore * 100) {
      return res.status(400).json({ ok: false, error: '비정상적인 점수 상승이 감지됐어' });
    }
    const finalScore = Math.max(prevScore, score);

    await redis.hset(`user:${req.userId}`, { score: finalScore });
    await redis.zadd(LEADERBOARD_KEY, { score: finalScore, member: req.userId });

    res.json({ ok: true, score: finalScore });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: '서버 오류' });
  }
});

// ---------------------------------------------
// API: 전체 랭킹
// ---------------------------------------------
app.get('/api/leaderboard', async (req, res) => {
  try {
    const userId = req.query.userId;
    const top = await redis.zrange(LEADERBOARD_KEY, 0, 9, { rev: true, withScores: true });

    const topList = [];
    for (let i = 0; i < top.length; i += 2) {
      const uid = top[i];
      const score = top[i + 1];
      const u = await getUser(uid);
      topList.push({ userId: uid, nickname: u ? u.nickname : '???', fate: u ? u.fate : '', score: Number(score) });
    }

    let me = null;
    if (userId) {
      const rank = await redis.zrank(LEADERBOARD_KEY, userId);
      const user = await getUser(userId);
      if (user && rank !== null && rank !== undefined) {
        me = { userId, nickname: user.nickname, fate: user.fate, score: Number(user.score || 0), rank: rank + 1 };
      }
    }

    res.json({ ok: true, top: topList, me });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: '서버 오류' });
  }
});

// ---------------------------------------------
// API: 친구 추가
// ---------------------------------------------
app.post('/api/friend/add', requireUser, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ ok: false, error: '코드를 입력해줘' });

    const friendId = await redis.get(`code:${code.trim().toUpperCase()}`);
    if (!friendId) return res.status(404).json({ ok: false, error: '존재하지 않는 초대 코드야' });
    if (friendId === req.userId) return res.status(400).json({ ok: false, error: '자기 자신은 친구로 추가할 수 없어' });

    const alreadyFriend = await redis.sismember(`friends:${req.userId}`, friendId);
    if (alreadyFriend) return res.status(400).json({ ok: false, error: '이미 친구야' });

    await redis.sadd(`friends:${req.userId}`, friendId);
    await redis.sadd(`friends:${friendId}`, req.userId);

    await redis.hincrby(`user:${friendId}`, 'friendPointsBonus', 10);
    await redis.hincrby(`user:${req.userId}`, 'friendPointsBonus', 5);

    const friendUser = await getUser(friendId);
    res.json({ ok: true, friend: { userId: friendId, nickname: friendUser.nickname, fate: friendUser.fate } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: '서버 오류' });
  }
});

// ---------------------------------------------
// API: 친구 목록 + 친구 랭킹
// ---------------------------------------------
app.get('/api/friends', async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ ok: false, error: 'userId가 필요해' });

    const friendIds = await redis.smembers(`friends:${userId}`);
    const friends = [];
    for (const fid of friendIds) {
      const u = await getUser(fid);
      if (u) friends.push({ userId: fid, nickname: u.nickname, fate: u.fate, score: Number(u.score || 0) });
    }
    friends.sort((a, b) => b.score - a.score);

    const bonus = await redis.hget(`user:${userId}`, 'friendPointsBonus');
    res.json({ ok: true, friends, friendPointsBonus: Number(bonus || 0) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: '서버 오류' });
  }
});

// ---------------------------------------------
// API: 튜토리얼 완료
// ---------------------------------------------
app.post('/api/tutorial/complete', requireUser, async (req, res) => {
  try {
    await redis.hset(`user:${req.userId}`, { tutorialDone: 'true' });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: '서버 오류' });
  }
});

// ---------------------------------------------
// API: 출석 보상
// ---------------------------------------------
app.post('/api/daily/claim', requireUser, async (req, res) => {
  try {
    const today = todayStr();
    if (req.user.lastClaim === today) {
      return res.status(400).json({ ok: false, error: '오늘은 이미 출석했어' });
    }
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    let streak = Number(req.user.dailyStreak || 0);
    streak = req.user.lastClaim === yesterday ? streak + 1 : 1;

    await redis.hset(`user:${req.userId}`, { lastClaim: today, dailyStreak: streak });

    const rewardDay = ((streak - 1) % 7) + 1;
    res.json({ ok: true, streak, rewardDay });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: '서버 오류' });
  }
});

// ---------------------------------------------
// API: 진행도 동기화 (보유 원숭이 / 도감 / 환생 횟수)
// ---------------------------------------------
app.post('/api/progress/sync', requireUser, async (req, res) => {
  try {
    const { monkeys, doljabiDex, prestigeCount } = req.body;
    const update = {};
    if (Array.isArray(monkeys)) update.monkeys = JSON.stringify(monkeys.slice(0, 50));
    if (Array.isArray(doljabiDex)) update.doljabiDex = JSON.stringify(doljabiDex.slice(0, 50));
    if (Number.isFinite(Number(prestigeCount))) {
      // 환생 횟수도 역행 방지
      const prevPrestige = Number(req.user.prestigeCount || 0);
      update.prestigeCount = Math.max(prevPrestige, Number(prestigeCount));
    }
    if (Object.keys(update).length > 0) {
      await redis.hset(`user:${req.userId}`, update);
    }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: '서버 오류' });
  }
});

app.get('/api/health', (req, res) => res.json({ ok: true, time: Date.now() }));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ ok: false, error: 'Not found' });
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🐵 로또 제국(v2) 서버가 ${PORT}번 포트에서 돌아가는 중`);
});
