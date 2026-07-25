# 🐵 로또 제국: 원숭이 돌잡이

모바일 전용 웹게임. Express + Upstash Redis + Railway 배포 기준.

## 파일 구조

```
monkey-doljabi/
├── server.js          # Express 백엔드 (API + 정적 파일 서빙)
├── package.json
├── .env.example
└── public/
    ├── index.html      # 게임 화면 전체
    ├── style.css        # 모바일 전용 스타일
    └── game.js           # 게임 로직 전체
```

## 1) 로컬 실행

```bash
npm install
cp .env.example .env
# .env 파일 열어서 UPSTASH_REDIS_REST_URL / TOKEN 채우기
npm start
```

브라우저(모바일 화면 폭으로 줄여서)로 `http://localhost:3000` 접속.
개발자도구 → 기기 툴바 켜고 확인하는 걸 추천.

## 2) Upstash Redis 연결

1. https://upstash.com 가입 → Redis 데이터베이스 생성 (Region은 배포할 Railway 리전과 가깝게)
2. 생성된 DB → **REST API** 탭에서 `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` 복사
3. `.env`(로컬) 또는 Railway 환경변수(배포)에 그대로 붙여넣기
4. 별도 스키마 생성 필요 없음 — 서버가 첫 API 호출 시 자동으로 키를 만듦

## 3) Railway 배포

1. Railway에서 새 프로젝트 생성 → GitHub repo 연결 (또는 CLI로 `railway up`)
2. **Variables** 탭에서 아래 두 개 추가:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   - `PORT`는 Railway가 자동 주입하니까 안 건드려도 됨
3. Start command는 `npm start` (package.json에 이미 정의됨)
4. 배포 후 Railway가 주는 도메인으로 접속하면 프론트+API가 같은 주소에서 동작함
   (server.js가 `public/` 폴더를 정적 서빙하고, `/api/*`만 별도 라우팅)

## API 목록

| Method | Path | 설명 |
|---|---|---|
| POST | /api/register | 닉네임 등록, userId/초대코드 발급 |
| POST | /api/gacha/start | 돌잡이 결과(운명) 서버 확정 저장 |
| GET | /api/me | 내 정보 + 순위 조회 |
| POST | /api/score | 점수(자산) 갱신 |
| GET | /api/leaderboard | 전체 랭킹 top10 + 내 순위 |
| POST | /api/friend/add | 초대코드로 친구 추가 |
| GET | /api/friends | 친구 목록 + 친구 랭킹 |
| POST | /api/tutorial/complete | 튜토리얼 완료 처리 |
| POST | /api/daily/claim | 출석 보상 수령 |
| GET | /api/health | 헬스체크 |

## 참고사항

- 운명(직업) 10종은 전부 동일한 배율(×1.6)을 갖도록 설계해서 밸런스 상 "꽝"이 없음
- 점수는 서버에서 이전 값보다 낮아지지 않도록 방어, 비정상 점프(100배 이상)는 거부
- 로컬 저장(localStorage)에 닉네임/운명/자원/업그레이드/튜토리얼 여부를 저장하고,
  서버에는 랭킹/친구/출석처럼 "다른 사람과 공유되는 정보"만 저장하는 구조
- 초대 코드는 6자리 (혼동되는 0/O/1/I 제외)
