# KOREAUSIMGUIDE - 프론트엔드 프로토타입

## 프로젝트 개요
**KOREAUSIMGUIDE**는 한국을 방문하는 외국인 여행객들이 최적의 유심/eSIM 요금제를 찾을 수 있도록 돕는 서비스의 프론트엔드 프로토타입입니다. 명확성, 신뢰, 그리고 글로벌 사용자의 편의성에 중점을 두었습니다.

## 기술 스택 (Tech Stack)
- **프레임워크:** React (Vite)
- **언어:** TypeScript
- **스타일링:** Tailwind CSS v4
- **UI 컴포넌트:** Shadcn/UI (Radix Primitives 기반)
- **라우팅:** Wouter (가벼운 라우터)
- **아이콘:** Lucide React

## 디렉토리 구조 (Directory Structure)
```
client/src/
├── components/
│   ├── layout/          # 공통 레이아웃 (헤더/푸터)
│   │   └── Layout.tsx
│   └── ui/              # Shadcn UI 재사용 컴포넌트 (버튼, 카드 등)
├── pages/
│   ├── home.tsx         # 메인(랜딩) 페이지
│   ├── compare.tsx      # 요금제 비교 페이지
│   ├── tips.tsx         # 꿀팁 목록 페이지
│   └── tip-detail.tsx   # 꿀팁 상세(아티클) 페이지
├── lib/                 # 유틸리티 (cn, queryClient 등)
├── App.tsx              # 메인 라우터 설정
└── index.css            # Tailwind 설정 및 전역 변수
```

## 주요 기능
1.  **다국어 지원 UI:** 헤더에 언어 선택기 구현 (현재는 UI만 존재).
2.  **요금제 비교:** 통신사별 요금제를 비교할 수 있는 그리드 레이아웃.
3.  **콘텐츠 허브:** 꿀팁 정보를 블로그 형태로 제공하며 상세 페이지로 연결.
4.  **반응형 디자인:** 모바일 햄버거 메뉴 등 모든 기기에 최적화.

## 개발 참고사항
- **라우팅:** `wouter`를 사용합니다. 경로는 `App.tsx`에 정의되어 있습니다.
- **이미지:** 현재 `attached_assets/` 폴더의 생성된 이미지를 사용 중입니다.
- **데이터:** 현재는 각 페이지 컴포넌트 내부에 하드코딩된 Mock 데이터를 사용하고 있습니다. 실제 개발 시에는 별도의 데이터 파일이나 API로 분리하는 것이 좋습니다.

## 시작하기
1. `npm install` 실행
2. `npm run dev` 로 개발 서버 실행
