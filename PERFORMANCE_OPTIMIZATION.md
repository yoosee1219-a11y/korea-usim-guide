# 성능 최적화 가이드

## ✅ 적용된 최적화 (2024년 12월 1일)

### 1. React.lazy() - 코드 스플리팅 ✅
**위치**: `client/src/App.tsx`
**효과**: 초기 로딩 시 필요한 페이지만 로드

```typescript
const Home = lazy(() => import("@/pages/home"));
const Compare = lazy(() => import("@/pages/compare"));
const PlanDetail = lazy(() => import("@/pages/plan-detail"));
const Tips = lazy(() => import("@/pages/tips"));
const TipDetail = lazy(() => import("@/pages/tip-detail"));
```

### 2. React Query 캐싱 최적화 ✅
**위치**: `client/src/lib/queryClient.ts`, `client/src/hooks/usePlans.ts`
**효과**: 불필요한 API 재요청 방지

- **기본 설정**:
  - staleTime: Infinity (무한대)
  - refetchOnWindowFocus: false
  - refetchOnMount: false

- **Plans API**:
  - staleTime: 10분
  - 언어별 캐시 분리

- **Tips API**:
  - staleTime: 5분
  - 카테고리: 1시간

### 3. Vercel 캐싱 헤더 추가 ✅
**위치**: `vercel.json`
**효과**: 재방문 시 정적 에셋을 브라우저 캐시에서 로드

```json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

- **JS/CSS 파일**: 1년 캐싱 (31536000초)
- **이미지 파일**: 1년 캐싱
- **폰트 파일**: 1년 캐싱

### 4. Vite 빌드 최적화 ✅
**위치**: `vite.config.ts`
**효과**: 번들 사이즈 감소, 프로덕션 빌드 최적화

- **Terser Minification**: console.log 제거
- **Manual Chunks**: React, React Query, Radix UI 분리
- **Chunk Size Warning**: 600KB

### 5. 이미지 최적화 컴포넌트 ✅
**위치**: `client/src/components/ui/OptimizedImage.tsx`
**효과**: Lazy loading, WebP 지원, 적절한 사이즈

## 📊 성능 지표

### 빌드 사이즈
- **전체**: 2.4MB
- **메인 번들**: 215KB
- **Radix UI**: 103KB
- **React Query**: 32KB

### 캐싱 전략
| 리소스 타입 | 캐싱 시간 | 설명 |
|------------|----------|------|
| JS/CSS | 1년 | 파일명에 해시 포함, 변경 시 자동 갱신 |
| 이미지 | 1년 | 정적 에셋, 변경 거의 없음 |
| 폰트 | 1년 | 변경 없음 |
| API 응답 | 5-10분 | React Query 캐시 |

## 🚀 추가 최적화 가능 항목

### 우선순위 높음
1. **이미지 WebP 변환**
   - 현재: PNG (크기 큼)
   - 개선: WebP 형식으로 변환 (약 30% 용량 감소)

2. **Database 인덱스 추가**
   - plans 테이블: carrier_id, is_active, is_popular
   - tips 테이블: language, is_published, category_id

3. **API Response 압축**
   - gzip/brotli 압축 활성화

### 우선순위 중간
4. **Service Worker 추가**
   - 오프라인 지원
   - 백그라운드 업데이트

5. **Preload 중요 리소스**
   - 메인 번들 preload
   - 폰트 preload

6. **Virtual Scrolling**
   - 요금제 목록 (많은 항목 시)
   - 팁 목록 (페이지네이션 대신)

### 우선순위 낮음
7. **SSR/SSG 전환**
   - Next.js로 마이그레이션
   - SEO 추가 개선

8. **CDN 최적화**
   - Vercel Edge Network 이미 사용 중
   - Cloudflare 추가 고려

## 📈 측정 도구

### Lighthouse 점수 목표
- **Performance**: 90+ ⭐
- **Accessibility**: 95+ ⭐
- **Best Practices**: 95+ ⭐
- **SEO**: 100 ⭐

### 측정 방법
```bash
# Chrome DevTools Lighthouse
# 또는
npm install -g lighthouse
lighthouse https://koreausimguide.com --view
```

### 번들 분석
```bash
# vite-bundle-visualizer 설치
npm install -D vite-bundle-visualizer

# vite.config.ts에 추가
import { visualizer } from 'vite-bundle-visualizer';

plugins: [
  react(),
  visualizer(),
]

# 빌드 후 stats.html 확인
npm run build
```

## 🔧 유지보수

### 정기 점검 (월 1회)
- [ ] Lighthouse 점수 측정
- [ ] 번들 사이즈 확인
- [ ] 느린 API 엔드포인트 확인
- [ ] 사용하지 않는 라이브러리 제거

### 배포 전 체크리스트
- [ ] 빌드 사이즈 확인 (2.5MB 이하)
- [ ] console.log 제거 확인
- [ ] 이미지 최적화 확인
- [ ] API 캐싱 설정 확인

## 📚 참고 자료

- [Vite 최적화 가이드](https://vitejs.dev/guide/build.html)
- [React Query 캐싱 전략](https://tanstack.com/query/latest/docs/framework/react/guides/caching)
- [Vercel 성능 최적화](https://vercel.com/docs/concepts/edge-network/caching)
- [Web.dev 성능 가이드](https://web.dev/fast/)

---

*최종 업데이트: 2024년 12월 1일*
