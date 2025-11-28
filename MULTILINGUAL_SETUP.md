# 다국어 데이터베이스 콘텐츠 설정 가이드

## 개요

이 가이드는 데이터베이스의 요금제 설명(description)과 기능(features)을 12개 언어로 자동 번역하는 방법을 설명합니다.

## 지원 언어

- 🇰🇷 Korean (ko) - 기본 언어
- 🇺🇸 English (en)
- 🇻🇳 Vietnamese (vi)
- 🇹🇭 Thai (th)
- 🇵🇭 Tagalog (tl)
- 🇺🇿 Uzbek (uz)
- 🇳🇵 Nepali (ne)
- 🇲🇳 Mongolian (mn)
- 🇮🇩 Indonesian (id)
- 🇲🇲 Burmese (my)
- 🇨🇳 Chinese (zh)
- 🇷🇺 Russian (ru)

## 1단계: 데이터베이스 마이그레이션 실행

데이터베이스에 다국어 컬럼을 추가합니다.

### 로컬 환경에서 실행 (네트워크 연결 필요)

```bash
npm run db:migrate
# 또는 직접 실행
npx tsx scripts/run-migration.ts
```

### Supabase 대시보드에서 실행 (권장)

1. [Supabase Dashboard](https://supabase.com)에 로그인
2. 프로젝트 선택
3. 왼쪽 메뉴에서 **SQL Editor** 클릭
4. `migrations/004_add_multilingual_content.sql` 파일 내용 복사
5. SQL Editor에 붙여넣기
6. **Run** 버튼 클릭

**결과**: `plans` 테이블에 다음 컬럼들이 추가됩니다:
- `description_en`, `description_vi`, ..., `description_ru`
- `features_en`, `features_vi`, ..., `features_ru`

## 2단계: 자동 번역 실행

Google Translate API를 사용하여 모든 요금제를 자동 번역합니다.

### 번역 스크립트 실행

```bash
npm run translate:plans
# 또는 직접 실행
npx tsx scripts/translate-plans.ts
```

### 번역 프로세스

스크립트는 다음 작업을 수행합니다:

1. 데이터베이스에서 모든 요금제 가져오기
2. 각 요금제의 `description`과 `features`를 11개 언어로 번역
3. 번역된 내용을 해당 언어 컬럼에 저장
4. 실패 시 자동 재시도 (최대 3회)

### 예상 소요 시간

- 요금제 10개 기준: 약 **5-10분**
- 요금제 20개 기준: 약 **10-15분**

번역 중 진행 상황이 실시간으로 표시됩니다:

```
🔄 [1/20] Translating plan: SKT 5GB 30일 요금제
   → Translating to English (en)...
   → Translating to Vietnamese (vi)...
   ...
   ✅ Plan "SKT 5GB 30일 요금제" translated successfully!
```

## 3단계: 확인

번역이 완료되면 데이터베이스에서 확인할 수 있습니다:

```sql
SELECT
  name,
  description,      -- 한국어 (원본)
  description_en,   -- 영어
  description_zh,   -- 중국어
  description_ru    -- 러시아어
FROM plans
LIMIT 5;
```

## API 사용법

프론트엔드는 자동으로 현재 언어에 맞는 데이터를 가져옵니다:

```typescript
// 자동으로 현재 언어의 번역 데이터를 가져옴
const { data: plans } = usePlans();

// 언어 변경 시 자동으로 다시 로드됨
```

API 엔드포인트는 다음과 같이 동작합니다:

```typescript
// POST /api/plans
{
  "lang": "en",  // 언어 코드 (선택사항, 기본값: ko)
  "carrier_id": "skt",
  ...
}

// 응답
{
  "plans": [
    {
      "name": "SKT 5GB 30일 요금제",  // 요금제 이름 (원본 유지)
      "description": "Unlimited data even after depletion...",  // 영어 번역
      "features": ["5GB Data", "Unlimited 3Mbps after depletion"],  // 영어 번역
      "price_krw": 12000  // 가격 (원본 유지)
    }
  ]
}
```

## 주요 특징

### ✅ 자동 폴백

번역이 없는 경우 자동으로 한국어 원문을 표시합니다 (SQL COALESCE 사용).

### ✅ 재시도 로직

번역 실패 시 자동으로 3회까지 재시도하며, exponential backoff를 적용합니다.

### ✅ Rate Limiting 방지

각 번역 사이에 100-200ms 딜레이를 두어 API Rate Limiting을 방지합니다.

### ✅ 캐싱

React Query를 사용하여 언어별로 데이터를 캐싱하므로 불필요한 API 호출을 줄입니다.

## 문제 해결

### 네트워크 연결 오류

```bash
Error: getaddrinfo ENOTFOUND db.*.supabase.co
```

**해결**: Supabase 대시보드에서 SQL을 직접 실행하세요.

### 번역 실패

일부 번역이 실패한 경우, 스크립트를 다시 실행하면 실패한 부분만 재번역합니다.

### 데이터 확인

```bash
# 데이터베이스 연결 테스트
npm run db:test
```

## 추가 정보

- 요금제 이름(`name`)과 가격(`price_krw`)은 번역하지 않고 원본 유지
- UI 텍스트(버튼, 레이블 등)는 별도의 i18n 시스템으로 관리됨
- 새 요금제 추가 시 번역 스크립트를 다시 실행하여 번역 가능

## 패키지 정보

사용된 패키지:
- `@vitalets/google-translate-api`: 무료 Google Translate API
- `pg`: PostgreSQL 클라이언트
