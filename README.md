# 🇰🇷 Korea USIM Comparison

한국 통신사 유심 요금제 비교 웹사이트

## ✨ 주요 기능

- 🔍 요금제 검색 및 필터링
- 💰 가격 비교 (월 요금, 할인가)
- 📊 통신사별 요금제 비교
- 🏷️ 5G/LTE 네트워크 타입별 분류
- 📱 모바일 반응형 디자인

## 🚀 시작하기

### 1. 환경 변수 설정

`.env.local` 파일을 생성하고 Supabase 정보를 입력하세요:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 개발 서버 실행

```bash
npm run dev
```

### 4. 브라우저에서 확인

```
http://localhost:3000
```

## 📦 기술 스택

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Package Manager**: npm

## 📁 프로젝트 구조

```
korea-usim-comparison/
├── app/
│   ├── api/
│   │   ├── plans/          # 요금제 API
│   │   ├── carriers/       # 통신사 API
│   │   └── blog/           # 블로그 API
