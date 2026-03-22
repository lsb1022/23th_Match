# 학생회실 지킴이 앱 배포 가이드

## 1. 지금 이 버전에서 반영한 핵심 강화점
- 학생 로그인 정보를 브라우저 localStorage 대신 **서버 서명 쿠키(HttpOnly)** 로 관리
- 회원 비밀번호를 base64 대신 **Node scrypt 해시** 로 저장
- 예전 계정으로 로그인하면 자동으로 새 해시 방식으로 전환
- 출석/내 출석/교대 신청 API가 더 이상 `memberId`를 클라이언트에서 신뢰하지 않음
- 출석 기능을 현재 UI에 맞게 **QR 없이 출석 버튼 방식**으로 정리

## 2. 배포 전에 꼭 준비할 것
- Node.js 20 이상
- MySQL 또는 MariaDB 데이터베이스 1개
- 배포 서비스: Railway, Render, Fly.io, EC2 중 하나

가장 쉬운 조합은 아래입니다.
- 프론트+백엔드: **Railway** 한 서비스로 배포
- DB: **Railway MySQL** 또는 Supabase가 아니라 별도 MySQL 호환 DB

## 3. 환경변수
아래 값을 서비스에 넣으세요.

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://USER:PASSWORD@HOST:3306/DB_NAME
MEMBER_SESSION_SECRET=아주길고랜덤한문자열
JWT_SECRET=옵션_관리자용_기존값_있으면유지
```

`MEMBER_SESSION_SECRET`은 반드시 새로 생성하세요.

## 4. 로컬 실행
```bash
pnpm install
pnpm db:push
pnpm dev
```

## 5. 운영 빌드
```bash
pnpm install
pnpm db:push
pnpm build
pnpm start
```

## 6. Railway 배포 절차
1. GitHub에 이 프로젝트 업로드
2. Railway에서 `New Project` → `Deploy from GitHub repo`
3. 프로젝트 선택
4. Variables에 환경변수 입력
5. MySQL 플러그인 추가 후 `DATABASE_URL` 연결
6. Deploy
7. 배포 후 도메인 접속

## 7. 배포 커맨드 권장값
- Build Command: `pnpm install && pnpm build`
- Start Command: `pnpm db:push && pnpm start`

초기에는 이렇게 해도 되지만, 운영에서는 마이그레이션을 배포 파이프라인과 분리하는 편이 더 안전합니다.

## 8. 관리자 최초 계정
이 프로젝트의 관리자 인증은 기존 시스템 라우트에 연결되어 있습니다. 실제 운영에서는 아래 둘 중 하나로 정리하는 것을 권장합니다.
- 방법 A: 관리자도 members 테이블로 통합
- 방법 B: 현재 관리자 auth 유지 + 배포 서비스의 비공개 관리자 접근 사용

지금 단계에서는 학생 지킴이 기능을 실제 사용 가능 수준으로 먼저 강화했습니다.

## 9. 운영 체크리스트
- HTTPS 도메인 사용
- 관리자 비밀번호 별도 관리
- 주 1회 DB 백업
- 학생회 교체 시 관리자 계정 변경
- 테스트용 시간조작 기능은 운영 배포에서 비활성화 권장

## 10. 다음 권장 작업
- 스케줄 충돌 방지
- 승인된 교대 요청 자동 반영
- 학기 단위 통계
- 공휴일/시험기간 예외 스케줄
- 관리자 감사 로그


## 추가 환경변수

```env
ADMIN_USERNAME=20253307
ADMIN_PASSWORD=020406
ADMIN_NAME=학생회실 관리자
ADMIN_SESSION_SECRET=아주길고랜덤한문자열
```

운영 환경에서는 시간 조작 기능이 비활성화됩니다.
