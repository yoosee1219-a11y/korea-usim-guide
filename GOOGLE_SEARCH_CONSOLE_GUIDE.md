# Google Search Console 등록 가이드

## 🎯 목적
Google Search Console에 사이트를 등록하고 인증하여 검색 엔진 최적화(SEO)를 시작합니다.

---

## ✅ 1단계: Google Search Console 접속

1. **Google Search Console 이동**
   ```
   https://search.google.com/search-console
   ```

2. **Google 계정으로 로그인**
   - 사이트 관리자 계정 사용

---

## ✅ 2단계: 속성 추가

1. **"속성 추가" 클릭**

2. **속성 유형 선택**
   - **도메인** 선택 (권장)
     ```
     koreausimguide.com
     ```
   - 또는 **URL 접두어** 선택
     ```
     https://koreausimguide.com
     ```

---

## ✅ 3단계: 소유권 확인

### 방법 1: HTML 태그 (권장)

1. **Google Search Console에서 제공하는 메타 태그 복사**
   ```html
   <meta name="google-site-verification" content="your-verification-code" />
   ```

2. **app/layout.tsx 파일 수정**
   - 현재 파일의 `verification.google` 값을 실제 코드로 교체:
   ```typescript
   verification: {
     google: 'your-actual-verification-code', // 여기에 붙여넣기
   },
   ```

3. **변경사항 배포**
   ```bash
   git add app/layout.tsx
   git commit -m "Add Google Search Console verification"
   git push origin master
   ```

4. **Vercel에서 자동 배포 확인** (1-2분 소요)

5. **Google Search Console로 돌아가서 "확인" 클릭**

### 방법 2: HTML 파일 업로드

1. **Google이 제공하는 HTML 파일 다운로드**

2. **public 폴더에 파일 업로드**
   ```bash
   # 파일을 public/ 폴더에 복사
   cp google[...].html /c/Users/woosol/Documents/korea-usim-comparison/public/
   ```

3. **배포 후 확인**

---

## ✅ 4단계: 사이트맵 제출

1. **사이트맵 URL 확인**
   ```
   https://koreausimguide.com/sitemap.xml
   ```

2. **Google Search Console에서:**
   - 왼쪽 메뉴: **색인 생성** → **사이트맵**
   - "새 사이트맵 추가" 클릭
   - `sitemap.xml` 입력
   - **제출** 클릭

3. **상태 확인**
   - "성공" 상태가 되면 완료
   - 24-48시간 내에 Google이 사이트를 크롤링 시작

---

## ✅ 5단계: 색인 생성 요청

1. **URL 검사 도구 사용**
   - 상단 검색창에 `https://koreausimguide.com` 입력
   - "색인 생성 요청" 클릭

2. **주요 페이지도 요청**
   - 홈페이지
   - 주요 블로그 포스트
   - 요금제 비교 페이지

---

## ✅ 6단계: 모니터링 설정

### 1. **실적 보고서 확인**
   - 왼쪽 메뉴: **실적**
   - 클릭수, 노출수, CTR, 평균 순위 확인

### 2. **커버리지 확인**
   - **색인 생성** → **페이지**
   - 오류 페이지 확인 및 수정

### 3. **모바일 사용성**
   - **환경** → **모바일 사용성**
   - 모바일 친화성 확인

### 4. **Core Web Vitals**
   - **환경** → **Core Web Vitals**
   - 페이지 속도 및 사용자 경험 지표 확인

---

## 🎯 Google AdSense 승인을 위한 체크리스트

- [ ] Google Search Console 소유권 확인 완료
- [ ] 사이트맵 제출 완료
- [ ] 최소 10개 이상의 고품질 콘텐츠
- [ ] 개인정보 처리방침 페이지 추가
- [ ] 연락처 페이지 추가
- [ ] About 페이지 추가
- [ ] 최소 3개월 이상 사이트 운영 (권장)
- [ ] 고유하고 가치 있는 콘텐츠
- [ ] 모바일 친화적 디자인
- [ ] 빠른 페이지 로딩 속도

---

## 📊 예상 타임라인

| 단계 | 소요 시간 |
|------|----------|
| Search Console 등록 | 5분 |
| 소유권 확인 | 5-10분 |
| 사이트맵 제출 | 2분 |
| Google 첫 크롤링 | 24-48시간 |
| 검색 결과 노출 | 3-7일 |
| AdSense 승인 (최소 요구사항 충족 시) | 1-2주 |

---

## ⚠️ 주의사항

1. **절대 하지 말아야 할 것:**
   - 중복 콘텐츠 게시
   - 키워드 스터핑 (과도한 키워드 사용)
   - 저품질 콘텐츠
   - 스팸성 링크

2. **권장 사항:**
   - 정기적으로 양질의 콘텐츠 발행 (주 2-3회)
   - 사용자 중심의 가치 있는 정보 제공
   - 모바일 최적화 유지
   - 페이지 속도 최적화

---

## 🔧 문제 해결

### 문제: 소유권 확인 실패
**해결:**
1. 메타 태그가 정확히 복사되었는지 확인
2. 배포가 완료되었는지 Vercel 대시보드 확인
3. 브라우저 캐시 클리어 후 재시도

### 문제: 사이트맵 오류
**해결:**
1. `https://koreausimguide.com/sitemap.xml` 직접 접속 확인
2. Supabase 데이터베이스 연결 확인
3. 사이트맵 생성 코드 (`app/sitemap.ts`) 확인

### 문제: 페이지가 색인되지 않음
**해결:**
1. robots.txt 확인 (`https://koreausimguide.com/robots.txt`)
2. `noindex` 태그 확인
3. URL 검사 도구로 수동 색인 요청

---

## 📚 참고 자료

- [Google Search Console 공식 문서](https://support.google.com/webmasters)
- [Google 검색 센터](https://developers.google.com/search)
- [SEO 초보자 가이드](https://developers.google.com/search/docs/beginner/seo-starter-guide)

---

**완료 후 다음 단계:** 콘텐츠 제작 및 SEO 최적화 시작! 🚀
