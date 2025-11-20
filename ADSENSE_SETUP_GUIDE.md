# 🎯 AdSense 승인을 위한 완벽 가이드

## 현재 상태
- ✅ 사이트: https://koreausimguide.com
- ✅ AdSense 게시자 ID: ca-pub-3152894563346753
- ❌ Google Search Console: **미등록** (즉시 해야 함!)

---

## 🔥 Step 1: Google Search Console 등록 (가장 중요!)

### 1-1. Google Search Console 접속
```
https://search.google.com/search-console
```

### 1-2. 속성 추가
1. "속성 추가" 클릭
2. "URL 접두어" 선택
3. `https://koreausimguide.com` 입력

### 1-3. 소유권 확인 (HTML 태그 방법 권장)
```html
<!-- app/layout.tsx에 이미 준비되어 있음 -->
<meta name="google-site-verification" content="발급받은-코드" />
```

**현재 코드 위치:**
- 파일: `app/layout.tsx`
- 라인: 55
- 현재 값: `'your-google-verification-code'`

**해야 할 일:**
1. Google Search Console에서 HTML 태그 방법 선택
2. 발급받은 인증 코드 복사
3. `app/layout.tsx` 파일 수정:
   ```typescript
   verification: {
     google: '여기에-발급받은-코드-붙여넣기',
   },
   ```
4. Git 커밋 & 푸시
5. Vercel 배포 완료 대기 (2-3분)
6. Google Search Console에서 "확인" 버튼 클릭

### 1-4. Sitemap 제출
1. Search Console → Sitemaps 메뉴
2. `https://koreausimguide.com/sitemap.xml` 입력
3. "제출" 클릭

---

## Step 2: DNS 전파 확인

### 2-1. DNS 전파 상태 확인
```
https://www.whatsmydns.net/#A/koreausimguide.com
```

- ✅ 전 세계에서 초록색: DNS 전파 완료
- ❌ 일부 빨간색: 아직 전파 중 (24-48시간 소요)

### 2-2. Google이 사이트 발견했는지 확인
```
Google 검색창에 입력:
site:koreausimguide.com
```

**결과:**
- 페이지 발견됨: ✅ 인덱싱 진행 중
- "일치하는 항목 없음": ❌ 아직 발견 못함 → **Step 1 필수!**

---

## Step 3: Google AdSense 재신청

### 3-1. 대기 시간
```
Google Search Console 등록 후 최소 24-48시간 대기
이유: Google이 사이트를 크롤링하고 인덱싱하는 시간 필요
```

### 3-2. AdSense 신청 체크리스트
```
✅ Google Search Console에 등록됨
✅ 최소 10-15개 이상의 고품질 콘텐츠 (현재 20개 블로그 - OK!)
✅ 정책 준수 (성인 콘텐츠, 저작권 위반 등 없음)
✅ 개인정보 보호정책 페이지
✅ 연락처 페이지
✅ About 페이지
✅ 모바일 친화적 (현재 OK!)
✅ HTTPS 사용 (현재 OK!)
```

### 3-3. AdSense 신청 방법
1. https://www.google.com/adsense 접속
2. "시작하기" 클릭
3. URL: `https://koreausimguide.com` 입력
4. AdSense 코드를 `<head>` 태그에 삽입
   (이미 완료됨 - ca-pub-3152894563346753)

---

## ⏰ 예상 타임라인

### Day 1 (오늘)
```
✅ Google Search Console 등록
✅ 소유권 확인
✅ Sitemap 제출
```

### Day 2-3 (내일~모레)
```
🔄 Google이 사이트 크롤링 시작
🔄 인덱싱 진행
✅ site:koreausimguide.com 검색 시 페이지 나타남
```

### Day 3-4 (3-4일 후)
```
✅ AdSense 재신청
🔄 AdSense 심사 시작 (1-2주 소요)
```

### Week 2-3 (2-3주 후)
```
✅ AdSense 승인 완료! 🎉
```

---

## 🚨 중요 체크사항

### AdSense 정책 위반 확인
```
❌ 금지 콘텐츠:
   - 성인 콘텐츠
   - 불법 콘텐츠
   - 저작권 위반
   - 폭력적 콘텐츠

✅ 현재 사이트: 유심 요금제 비교 → 정책 문제 없음!
```

### 필수 페이지 확인
```
현재 sitemap.xml에 포함된 페이지:
✅ /ko (홈)
✅ /ko/plans (요금제)
✅ /ko/blog (블로그)
✅ /ko/about (소개)
✅ /ko/contact (문의)
✅ /ko/privacy (개인정보 보호정책)
✅ /ko/terms (이용약관)

→ 모든 필수 페이지 완비!
```

---

## 🎯 즉시 해야 할 일 (우선순위)

### 🔥 Priority 1: Google Search Console 등록
```bash
1. https://search.google.com/search-console 접속
2. 속성 추가: https://koreausimguide.com
3. 소유권 확인 (HTML 태그 방법)
4. Sitemap 제출: https://koreausimguide.com/sitemap.xml
```

### 🔥 Priority 2: 인증 코드 업데이트
```typescript
// app/layout.tsx:55 수정
verification: {
  google: 'Search Console에서-발급받은-코드',
},
```

### ⏳ Priority 3: 24-48시간 대기
```
Google이 사이트를 크롤링하고 인덱싱하는 시간
```

### 🎉 Priority 4: AdSense 재신청
```
Google Search Console에서 페이지가 인덱싱된 후 신청
```

---

## 📞 추가 도움말

### Naver 웹마스터 도구도 함께 등록 (권장)
```
https://searchadvisor.naver.com/

한국 검색엔진 최적화를 위해:
1. 사이트 등록
2. Sitemap 제출
3. RSS 제출 (블로그)
```

### 빙 웹마스터 도구
```
https://www.bing.com/webmasters

추가 검색엔진 노출:
1. Import from Google Search Console (편리!)
2. 자동으로 설정 완료
```

---

## ✅ 최종 체크리스트

```
□ Google Search Console 등록
□ HTML 인증 코드 삽입
□ Sitemap 제출
□ DNS 전파 확인
□ site:koreausimguide.com 검색 테스트
□ 24-48시간 대기
□ AdSense 재신청
□ (선택) Naver 웹마스터 도구 등록
□ (선택) Bing 웹마스터 도구 등록
```

---

**🎯 결론: Google Search Console 등록이 최우선!**

AdSense는 Google에 인덱싱된 사이트만 승인합니다.
지금 즉시 Google Search Console에 등록하세요!
