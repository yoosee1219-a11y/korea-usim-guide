# AI 어시스턴트(Cursor / Claude Code)를 위한 프로젝트 컨텍스트

## 제품 비전
**KOREAUSIMGUIDE**는 한국을 방문하는 외국인 여행객을 위한 유심/eSIM 가이드입니다. 디자인은 "Global Friendly(글로벌 친화적)" - 깨끗하고, 신뢰할 수 있으며, 직관적인 느낌을 지향합니다.

## 디자인 시스템
- **타이포그래피:**
  - 제목(Headings): `Outfit` (모던하고 친근한 느낌)
  - 본문(Body): `Inter` (가독성 중심)
- **컬러 팔레트:**
  - 메인 컬러(Primary): International Blue (`hsl(221 83% 53%)`) - 신뢰감을 주는 파란색
  - 배경(Background): 깨끗한 화이트 / 연한 회색
- **비주얼 스타일:**
  - 부드러운 그림자 (`shadow-lg`)
  - 둥근 모서리 (`rounded-2xl`, `rounded-3xl`)
  - 배경 블러 효과 (Backdrop blur)

## 현재 상태
- **프론트엔드 전용:** 백엔드 연동은 되어있지 않습니다.
- **Mock 데이터:** 모든 요금제 정보와 꿀팁 아티클은 컴포넌트 내부에 하드코딩되어 있습니다.

## 향후 개발 단계 (Next Steps)
AI에게 다음 작업을 요청할 때 참고하세요:
1.  **데이터 분리:** 하드코딩된 데이터(요금제, 팁)를 별도의 JSON 파일이나 상태 관리 스토어로 분리 요청.
2.  **SEO 최적화:** 각 페이지별 `Helmet` 또는 메타 태그 강화.
3.  **CMS 연동:** 꿀팁 섹션을 위한 Headless CMS 연동 (Contentful, Strapi 등).
4.  **다국어(i18n) 구현:** `react-i18next` 등을 사용하여 실제 언어 변경 기능 구현.

## 컴포넌트 가이드라인
- 새 페이지를 만들 때는 항상 `Layout.tsx`를 감싸서 헤더/푸터가 유지되도록 하세요.
- 가능한 `components/ui/` 폴더에 있는 `shadcn/ui` 컴포넌트를 활용하세요.
- Tailwind v4를 사용 중입니다. `index.css`의 CSS 변수를 참고하세요.
