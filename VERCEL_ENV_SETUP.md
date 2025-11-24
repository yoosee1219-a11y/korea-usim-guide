# Vercel 환경 변수 설정 가이드

## 📋 Vercel에 환경 변수 추가하는 방법

### 방법 1: 하나씩 추가 (권장)

1. **"Key" 필드에 변수 이름 입력**
2. **"Value" 필드에 값 입력**
3. **"Sensitive" 토글 켜기** (비밀번호나 시크릿 키의 경우)
4. **"All Environments" 선택** (또는 특정 환경 선택)
5. **"Save" 버튼 클릭**

### 방법 2: Import .env 사용

1. **"Import .env" 버튼 클릭**
2. `.env` 파일 내용을 복사해서 붙여넣기
3. 자동으로 Key-Value 쌍이 생성됨
4. **"Save" 버튼 클릭**

---

## 🔑 추가해야 할 환경 변수

### 1. DATABASE_URL

**Key:** `DATABASE_URL`

**Value:**

```
postgresql://postgres:dbsdudgns0%29@db.lthctjipvftelyqrjoyj.supabase.co:5432/postgres
```

> ⚠️ **주의:** 비밀번호의 특수문자 `)`는 URL 인코딩되어 `%29`로 표시됩니다.

**Sensitive:** ✅ 켜기 (비밀번호 포함)

---

### 2. JWT_SECRET

**Key:** `JWT_SECRET`

**Value:**

```
OabLHz3ActpOxcmYZEUnXGe1w0kYNAimr7GXnDgKYXc=
```

**Sensitive:** ✅ 켜기

---

### 3. NODE_ENV

**Key:** `NODE_ENV`

**Value:**

```
production
```

**Sensitive:** ❌ 끄기

---

## 📍 Supabase에서 정보 확인하는 방법

### 1. Project ID (Reference ID) 확인

**위치:** Supabase Dashboard → Settings → General

1. Supabase Dashboard 접속
2. 왼쪽 사이드바에서 ⚙️ **Settings** 클릭
3. **General** 탭 클릭
4. **Project ID** 또는 **Reference ID** 확인
   - 예: `lthctjipvftelyqrjoyj`

---

### 2. Database Password 확인/리셋

**위치:** Supabase Dashboard → Settings → Database

1. Supabase Dashboard 접속
2. 왼쪽 사이드바에서 ⚙️ **Settings** 클릭
3. **Database** 탭 클릭
4. **Database password** 섹션으로 스크롤
5. 비밀번호를 모르면:
   - **"Reset database password"** 버튼 클릭
   - 새 비밀번호 생성
   - 안전한 곳에 저장

---

### 3. Connection URL 직접 확인 (가능한 경우)

**위치:** Supabase Dashboard → Settings → Database

1. Settings → Database 탭으로 이동
2. 전체 스크롤하여 **"Connection string"** 섹션 확인
3. 있으면 전체 문자열 복사
4. 없으면 위의 정보로 직접 조합

---

## 🔗 Connection URL 조합 방법

확인한 정보로 아래 형식에 맞춰 조합:

```
postgresql://postgres:[비밀번호]@db.[프로젝트ID].supabase.co:5432/postgres
```

**예시:**

```
postgresql://postgres:mypassword123@db.lthctjipvftelyqrjoyj.supabase.co:5432/postgres
```

**특수문자가 있는 비밀번호의 경우:**

- `)` → `%29`
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`
- `&` → `%26`

---

## ✅ 현재 확인된 정보

- **Project ID:** `lthctjipvftelyqrjoyj`
- **Database Password:** `dbsdudgns0)`
- **DATABASE_URL:** `postgresql://postgres:dbsdudgns0%29@db.lthctjipvftelyqrjoyj.supabase.co:5432/postgres`

---

## 📝 Vercel 설정 단계별 가이드

### Step 1: DATABASE_URL 추가

1. **Key:** `DATABASE_URL` 입력
2. **Value:** `postgresql://postgres:dbsdudgns0%29@db.lthctjipvftelyqrjoyj.supabase.co:5432/postgres` 입력
3. **Sensitive:** ✅ 켜기
4. **Environments:** "All Environments" 선택
5. **Save** 클릭

### Step 2: JWT_SECRET 추가

1. **"Add Another"** 버튼 클릭
2. **Key:** `JWT_SECRET` 입력
3. **Value:** `OabLHz3ActpOxcmYZEUnXGe1w0kYNAimr7GXnDgKYXc=` 입력
4. **Sensitive:** ✅ 켜기
5. **Environments:** "All Environments" 선택
6. **Save** 클릭

### Step 3: NODE_ENV 추가

1. **"Add Another"** 버튼 클릭
2. **Key:** `NODE_ENV` 입력
3. **Value:** `production` 입력
4. **Sensitive:** ❌ 끄기
5. **Environments:** "All Environments" 선택
6. **Save** 클릭

---

## ⚠️ 주의사항

1. **Sensitive 토글:** 비밀번호나 시크릿 키는 반드시 켜기
2. **환경 선택:** Production, Preview, Development 모두에 설정하거나, "All Environments" 선택
3. **값 확인:** 저장 후 다시 확인할 수 없으므로 (Sensitive인 경우) 정확히 입력
4. **특수문자:** URL 인코딩 필요할 수 있음

---

## 🆘 문제 해결

### DATABASE_URL이 작동하지 않을 때

1. 비밀번호 URL 인코딩 확인
2. Project ID 정확성 확인
3. Supabase에서 연결 허용 IP 확인 (Vercel IP는 동적)

### 환경 변수가 적용되지 않을 때

1. 배포를 다시 트리거 (Redeploy)
2. 환경 변수 저장 후 배포가 자동으로 시작되는지 확인
3. Vercel Dashboard → Deployments → 로그 확인
