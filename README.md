# KOREAUSIMGUIDE - 한국 유심/eSIM 가이드

코리아유심가이드

## 프로젝트 개요
**KOREAUSIMGUIDE**는 한국을 방문하는 외국인 여행객들이 최적의 유심/eSIM 요금제를 찾을 수 있도록 돕는 웹 서비스입니다. 명확성, 신뢰, 그리고 글로벌 사용자의 편의성에 중점을 두었습니다.

## 기술 스택 (Tech Stack)

### Frontend
- **프레임워크:** React 19 (Vite)
- **언어:** TypeScript
- **스타일링:** Tailwind CSS v4
- **UI 컴포넌트:** Shadcn/UI (Radix Primitives 기반)
- **라우팅:** Wouter
- **상태 관리:** TanStack Query
- **아이콘:** Lucide React

### Backend
- **서버:** Express.js
- **데이터베이스:** PostgreSQL (Supabase)
- **인증:** JWT (JSON Web Token)
- **SQL:** Raw SQL (pg 패키지)

## 주요 기능
1. **요금제 비교:** 통신사별 요금제를 필터링하고 비교할 수 있는 기능
2. **꿀팁 블로그:** 한국 통신 관련 유용한 정보를 블로그 형태로 제공
3. **보안:** JWT 토큰 기반 API 인증
4. **반응형 디자인:** 모바일/태블릿/데스크톱 최적화

## 시작하기

### 1. 환경 변수 설정
`.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=development
PORT=5000
```

자세한 설정 방법은 `ENV_SETUP_GUIDE.md`를 참고하세요.

### 2. 데이터베이스 설정
Supabase SQL Editor에서 `migrations/001_initial_schema.sql`을 실행하여 테이블을 생성하고, `scripts/seed.sql`을 실행하여 초기 데이터를 삽입하세요.

### 3. 의존성 설치 및 실행
```bash
npm install
npm run dev
```

서버가 `http://localhost:5000`에서 실행됩니다.

## 프로젝트 구조
```
├── client/              # 프론트엔드 (React)
│   ├── src/
│   │   ├── components/ # UI 컴포넌트
│   │   ├── pages/      # 페이지 컴포넌트
│   │   ├── hooks/      # React Query 훅
│   │   └── lib/        # 유틸리티
├── server/             # 백엔드 (Express)
│   ├── routes/         # API 라우트
│   ├── services/       # 비즈니스 로직
│   ├── middleware/     # 미들웨어 (JWT 인증)
│   └── storage/        # 데이터베이스 연결
├── migrations/         # 데이터베이스 스키마
└── scripts/            # 시드 데이터
```

## 라이선스
MIT
