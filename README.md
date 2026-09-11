# recruit-bot

`auth-bot-docker`에서 리크루팅 기능만 분리한 독립 Discord 봇입니다.

## 포함 기능

- 가입 및 기타 문의 채널 생성
- NIS/NIDU 리크루팅 상태 머신
- 캐릭터·코퍼레이션 이력 및 밴 목록 확인
- SeAT 가입 확인
- 진행 상태 Discord 채널 백업 및 복원
- `/상담완료` 명령
- 가입 안내 메시지 자동 게시

## 제외 기능

- NIS 서버 역할 관리 (`/newbie`, `/inactive`)
- NIS 불판 교체 (`/grill_reload`)
- Seat 역할 동기화 엔진
- PostgreSQL 및 zKillboard 관련 코드
- NIS 서버 안내 메시지

## 환경 변수

`.env.example`을 `.env`로 복사해 값을 설정합니다.

- `DISCORD_TOKEN`: Discord 봇 토큰
- `DISCORD_CLIENT_ID`: Discord 애플리케이션 ID
- `DISCORD_RECRUIT_GUILD_ID`: 리크루팅 서버 ID
- `SEAT_TOKEN`: SeAT API 토큰
- `LOG_LEVEL`: 로그 레벨, 기본값 `INFO`

서버에는 `가입-안내` 채널, `상담중` 및 `아카이브` 카테고리, `states-backup` 채널, `리크루터` 및 `NIDU 리크루터` 역할이 필요합니다.

## 실행

    npm ci
    npm run build
    npm start

## 슬래시 명령 배포

리크루팅 서버에만 배포하는 것을 권장합니다.

    npm run deploy-commands -- --guild YOUR_GUILD_ID

## Docker

    docker build -t recruit-bot .
    docker run --env-file .env recruit-bot

## Portainer / Docker Swarm 이미지

이 저장소는 Portainer에서 관리하는 기존 Stack에 넣을 Docker 이미지만 생성합니다. Stack YAML은 이 저장소에서 관리하지 않습니다.

이미지에 설정할 런타임 값:

- `DISCORD_RECRUIT_GUILD_ID`: 리크루팅 Discord 서버 ID
- `LOG_LEVEL`: 선택, 기본값 `INFO`
- `DISCORD_TOKEN`: Discord 봇 토큰
- `SEAT_TOKEN`: SeAT API 토큰

Portainer의 Docker secret을 사용한다면 일반 토큰 환경 변수 대신 다음 파일 변수를 설정할 수 있습니다.

- `DISCORD_TOKEN_FILE=/run/secrets/recruit_bot_discord_token`
- `SEAT_TOKEN_FILE=/run/secrets/recruit_bot_seat_token`

Swarm 서비스는 Discord 봇의 중복 접속을 막기 위해 replica를 1개로 유지하고 업데이트 순서를 `stop-first`로 설정해야 합니다. 종료 시 상태 백업 시간을 확보할 수 있도록 stop grace period는 60초를 권장합니다.
