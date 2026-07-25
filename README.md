# 🐵 로또 제국: 원숭이 돌잡이 (v2 - 자동로또/수집/환생 확장판)

모바일 전용 웹게임. Express + Upstash Redis + Railway 배포 기준.

## 파일 구조

```
monkey-lotto-empire/
├── server.js          # Express 백엔드 (API + 정적 파일 서빙)
├── package.json
├── .env.example
└── public/
    ├── index.html      # 게임 화면 전체
    ├── style.css       # 모바일 전용 스타일
    └── game.js         # 게임 로직 전체
```

## 1) 로컬 실행

```bash
npm install
cp .env.example .env
# .env에 UPSTASH_REDIS_REST_URL / TOKEN 채우기
npm start
```

## 2) Upstash Redis 연결

1. https://upstash.com 가입 → Redis 데이터베이스 생성
2. DB → **REST API** 탭에서 `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` 복사
3. `.env`(로컬) 또는 Railway 환경변수(배포)에 붙여넣기

## 3) Railway 배포

1. Railway → 새 프로젝트 → GitHub repo 연결
2. **Variables**에 `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` 추가
3. Start command: `npm start`
4. **repo 루트에 `public` 폴더 이름이 정확한지 꼭 확인** — 압축을 풀거나 파일을 옮기는 과정에서
   `pubic`처럼 오타가 나면 서버가 정적 파일을 못 찾아서 404(Not Found)가 뜬다.

## v1 대비 추가된 것

| 기능 | 설명 |
|---|---|
| 자동 로또 | 보유한 원숭이들이 주기적으로(시설 레벨에 따라 3~8초) 자동 추첨. 낙첨~1등 잭팟까지 5단계 |
| 원숭이 8종 도감 | 랜덤형~예언형까지 성향이 다른 원숭이를 운명 포인트로 영입. 전부 개성만 다르고 사기캐 없음 |
| 돌잡이 도감 | 확정된 내 운명은 도감에 자동 등록 (운명 자체는 계정당 1회 확정이라 다른 항목은 "???"로 표시) |
| 시설 6종 | 바나나 농장 / 복권 공장 / 연구소 / 원숭이 학교 / 로또 방송국 / 우주 연구소 |
| 환생(프레스티지) | 점수 임계값 도달 시 초기화하고 영구 배율 획득. 원숭이/운명/도감은 유지 |
| 오프라인 보상 | 접속 종료~재접속 사이 경과 시간(최대 4시간)만큼 자동 생산 보상 지급 |
| 병맛 이벤트 확장 | 12종. 부정적인 연출도 항상 소소한 위로 보상이 딸려있어 완전 손해는 없음 |

## 스코프 관련 참고

원본 기획서의 "원숭이 100종 / 모자 200종" 같은 항목은 문자 그대로 구현하면
관리 불가능한 코드가 되기 때문에, 실제로 동작하는 **원숭이 8종 + 돌잡이 10종 도감**으로
압축해서 만들었다. 나중에 `MONKEYS` 배열(game.js)에 항목만 추가하면 자연스럽게
도감이 늘어나는 구조라 콘텐츠 확장은 쉽다.

## API 목록

| Method | Path | 설명 |
|---|---|---|
| POST | /api/register | 닉네임 등록, userId/초대코드 발급 |
| POST | /api/gacha/start | 돌잡이 결과(운명) 서버 확정 저장 + 도감 등록 |
| GET | /api/me | 내 정보 + 순위 조회 |
| POST | /api/score | 점수(자산) 갱신 |
| GET | /api/leaderboard | 전체 랭킹 top10 + 내 순위 |
| POST | /api/friend/add | 초대코드로 친구 추가 |
| GET | /api/friends | 친구 목록 + 친구 랭킹 |
| POST | /api/tutorial/complete | 튜토리얼 완료 처리 |
| POST | /api/daily/claim | 출석 보상 수령 |
| POST | /api/progress/sync | 보유 원숭이 / 돌잡이 도감 / 환생 횟수 서버 저장 |
| GET | /api/health | 헬스체크 |
