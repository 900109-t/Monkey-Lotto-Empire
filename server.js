// server.js
// 로또 제국: 원숭이 돌잡이 - 백엔드 서버
// Express + Upstash Redis(REST) 기반. 프론트(정적 파일)와 API를 같은 서버에서 서빙한다.

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const { Redis } = require('@upstash/redis');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------------------------------
// Redis 클라이언트
// ---------------------------------------------
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const LEADERBOARD_KEY = 'leaderboard';

// ---------------------------------------------
// 미들웨어
// ---------------------------------------------
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
  // 사람이 읽기 쉬운 6자리 코드 (대문자+숫자, 헷갈리는 0/O/1/I 제외)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

async function getUser(userId) {
  const user = await redis.hgetall(`user:${userId}`);
  if (!user || Object.keys(user).length === 0) return null;
  return user;
}

// 간단한 검증: 요청 바디의 userId가 실존하는 유저인지 확인하는 미들웨어
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
// API: 유저 등록 (닉네임 입력 직후 1회)
// ---------------------------------------------
app.post('/api/register', async (req, res) => {
  try {
    const { nickname, fate } = req.body;
    if (!nickname || typeof nickname !== 'string' || nickname.trim().length === 0) {
      return res.status(400).json({ ok: false, error: '닉네임을 입력해줘' });
    }
    const cleanNick = nickname.trim().slice(0, 12);

    const userId = genId();
    let inviteCode = genInviteCode();
    // 코드 충돌 방지 (극히 낮은 확률이지만 방어)
    for (let i = 0; i < 5; i++) {
      const exists = await redis.get(`code:${inviteCode}`);
      if (!exists) break;
      inviteCode = genInviteCode();
    }

    const userData = {
      userId,
      nickname: cleanNick,
      fate: fate || '',
      inviteCode,
      score: 0,
      tutorialDone: 'false',
      dailyStreak: 0,
      lastClaim: '',
      createdAt: Date.now(),
      achievements: JSON.stringify([]),
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
// API: 돌잡이 결과(운명) 확정 저장 - 계정당 1회만 유효
// ---------------------------------------------
app.post('/api/gacha/start', requireUser, async (req, res) => {
  try {
    const { fate } = req.body;
    if (!fate) return res.status(400).json({ ok: false, error: 'fate가 필요해' });

    // 이미 운명이 정해진 유저면 덮어쓰지 않음 (재시작 전까지 유지 규칙)
    if (req.user.fate && req.user.fate.length > 0) {
      return res.json({ ok: true, fate: req.user.fate, alreadySet: true });
    }

    await redis.hset(`user:${req.userId}`, { fate });
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

    const rank = await redis.zrank(LEADERBOARD_KEY, userId, { withScore: false });
    res.json({ ok: true, user, rank: rank === null || rank === undefined ? null : rank + 1 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: '서버 오류' });
  }
});

// ---------------------------------------------
// API: 점수(자산) 갱신 - 랭킹용
// ---------------------------------------------
app.post('/api/score', requireUser, async (req, res) => {
  try {
    let { score } = req.body;
    score = Number(score);
    if (!Number.isFinite(score) || score < 0) {
      return res.status(400).json({ ok: false, error: '유효하지 않은 점수야' });
    }

    // 악의적 조작 방어: 기존 점수 대비 비정상적으로 큰 값(순간 100배 이상 점프)은 거부
    const prevScore = Number(req.user.score || 0);
    if (prevScore > 1000 && score > prevScore * 100) {
      return res.status(400).json({ ok: false, error: '비정상적인 점수 상승이 감지됐어' });
    }

    // 점수는 항상 증가하는 방향으로만 갱신 (내려가지 않게)
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
// API: 전체 랭킹 (상위 N + 내 순위/주변 순위)
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
      topList.push({
        userId: uid,
        nickname: u ? u.nickname : '???',
        fate: u ? u.fate : '',
        score: Number(score),
      });
    }

    let me = null;
    if (userId) {
      const rank = await redis.zrank(LEADERBOARD_KEY, userId);
      const user = await getUser(userId);
      if (user && rank !== null && rank !== undefined) {
        me = {
          userId,
          nickname: user.nickname,
          fate: user.fate,
          score: Number(user.score || 0),
          rank: rank + 1,
        };
      }
    }

    res.json({ ok: true, top: topList, me });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: '서버 오류' });
  }
});

// ---------------------------------------------
// API: 친구 추가 (초대 코드 사용)
// ---------------------------------------------
app.post('/api/friend/add', requireUser, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ ok: false, error: '코드를 입력해줘' });

    const friendId = await redis.get(`code:${code.trim().toUpperCase()}`);
    if (!friendId) {
      return res.status(404).json({ ok: false, error: '존재하지 않는 초대 코드야' });
    }
    if (friendId === req.userId) {
      return res.status(400).json({ ok: false, error: '자기 자신은 친구로 추가할 수 없어' });
    }

    const alreadyFriend = await redis.sismember(`friends:${req.userId}`, friendId);
    if (alreadyFriend) {
      return res.status(400).json({ ok: false, error: '이미 친구야' });
    }

    await redis.sadd(`friends:${req.userId}`, friendId);
    await redis.sadd(`friends:${friendId}`, req.userId);

    // 초대한 유저(코드 주인)에게 소량 보상 포인트 지급 (친구포인트)
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
      if (u) {
        friends.push({
          userId: fid,
          nickname: u.nickname,
          fate: u.fate,
          score: Number(u.score || 0),
        });
      }
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
// API: 튜토리얼 완료 처리
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
// API: 일일(출석) 보상
// ---------------------------------------------
app.post('/api/daily/claim', requireUser, async (req, res) => {
  try {
    const today = todayStr();
    if (req.user.lastClaim === today) {
      return res.status(400).json({ ok: false, error: '오늘은 이미 출석했어' });
    }

    // 어제 출석했으면 스트릭 유지, 아니면 리셋
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    let streak = Number(req.user.dailyStreak || 0);
    streak = req.user.lastClaim === yesterday ? streak + 1 : 1;

    await redis.hset(`user:${req.userId}`, { lastClaim: today, dailyStreak: streak });

    // 스트릭이 길수록 보상 증가 (최대 7일 주기)
    const rewardDay = ((streak - 1) % 7) + 1;
    res.json({ ok: true, streak, rewardDay });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: '서버 오류' });
  }
});

// ---------------------------------------------
// 헬스체크 (Railway용)
// ---------------------------------------------
app.get('/api/health', (req, res) => res.json({ ok: true, time: Date.now() }));

// ---------------------------------------------
// SPA fallback - API가 아닌 모든 경로는 index.html로
// ---------------------------------------------
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ ok: false, error: 'Not found' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🐵 로또 제국 서버가 ${PORT}번 포트에서 돌아가는 중`);
});
