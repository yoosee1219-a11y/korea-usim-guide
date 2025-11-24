# 🔐 환경 변수 설정 가이드

## 📋 Supabase에서 필요한 정보 찾기

Connection string 섹션이 보이지 않는다면, 아래 정보를 수집해서 직접 조합하세요!

---

## 1️⃣ Project Reference ID 확인

**위치:** `Settings` → `General` → `Reference ID`

1. 왼쪽 사이드바에서 ⚙️ **Settings** 클릭
2. **General** 탭 클릭
3. **Reference ID** 찾기 (예: `abcdefghijklmnop`)

> 📝 **참고:** 이 값이 `[PROJECT-REF]`에 해당합니다.

---

## 2️⃣ Database Password 확인 또는 리셋

**위치:** `Settings` → `Database` → `Database password`

1. 왼쪽 사이드바에서 ⚙️ **Settings** 클릭
2. **Database** 탭 클릭
3. **Database password** 섹션에서:
   - 비밀번호를 알고 있다면: 그대로 사용
   - 비밀번호를 모른다면: **"Reset database password"** 버튼 클릭

> ⚠️ **주의:** 비밀번호를 리셋하면 기존 연결이 끊어질 수 있습니다.

---

## 3️⃣ Database Connection URL 조합하기

위에서 찾은 정보로 아래 형식에 맞춰 조합하세요:

### 방법 1: 직접 연결 (Direct Connection)
```
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

### 방법 2: Connection Pooling 사용 (권장)
```
postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

> 💡 **Region 확인:** 프로젝트가 생성된 지역(예: `ap-northeast-2`, `us-east-1`)

---

## 4️⃣ JWT Secret 생성 (선택사항)

프로덕션 환경에서는 강력한 랜덤 문자열을 사용하세요:

### 터미널에서 생성:
```bash
# Windows PowerShell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))

# Linux/Mac
openssl rand -base64 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

또는 온라인 생성기 사용:
- https://randomkeygen.com/
- https://www.random.org/strings/

---

## 5️⃣ .env 파일 생성

1. 프로젝트 루트에 `.env` 파일 생성
2. `.env.example` 파일을 복사:
   ```bash
   cp .env.example .env
   ```
3. `.env` 파일 열어서 실제 값으로 수정:

```env
# Supabase Database
DATABASE_URL=postgresql://postgres:여기에비밀번호@db.여기에프로젝트레퍼런스ID.supabase.co:5432/postgres

# JWT Secret
JWT_SECRET=여기에생성한시크릿키

# Node Environment
NODE_ENV=development
PORT=5000
```

---

## 6️⃣ 연결 테스트

환경 변수 설정 후 연결 테스트:

```bash
# 데이터베이스 연결 테스트
npm run dev

# 또는 직접 테스트
node -e "require('dotenv').config(); console.log(process.env.DATABASE_URL ? '✅ DATABASE_URL 설정됨' : '❌ DATABASE_URL 없음')"
```

---

## 📝 체크리스트

설정 완료 전 확인 사항:

- [ ] Project Reference ID 확인
- [ ] Database Password 확인/리셋
- [ ] DATABASE_URL 조합 완료
- [ ] JWT_SECRET 생성/설정
- [ ] `.env` 파일 생성 및 값 입력
- [ ] `.env` 파일이 `.gitignore`에 포함되어 있는지 확인
- [ ] 연결 테스트 성공

---

## ⚠️ 주의사항

1. **`.env` 파일은 절대 Git에 커밋하지 마세요!**
   - `.gitignore`에 포함되어 있는지 확인
   - 비밀번호나 시크릿 키가 노출되면 보안 문제 발생

2. **프로덕션 환경에서는 반드시:**
   - 강력한 JWT_SECRET 사용
   - HTTPS 사용
   - 환경 변수를 Vercel/플랫폼의 환경 변수 설정에서 관리

3. **Database Password:**
   - 안전한 곳에 백업
   - 정기적으로 변경 권장

---

## 🆘 문제 해결

### Connection string 섹션이 보이지 않을 때

1. **Settings → API 탭 확인:**
   - Database URL이 있는지 확인

2. **Settings → Database 탭 전체 스크롤:**
   - Connection string 섹션이 아래에 있을 수 있음

3. **직접 조합 방법 사용:**
   - 위의 "3️⃣ Database Connection URL 조합하기" 참고

### 연결 실패 시

1. **비밀번호 확인:**
   - 특수문자가 URL 인코딩 필요할 수 있음 (예: `@` → `%40`)

2. **포트 확인:**
   - 직접 연결: `5432`
   - Connection Pooling: `6543`

3. **SSL 설정:**
   - Supabase는 SSL 필수이므로 `?sslmode=require` 추가할 수 있음

---

## 📚 참고 자료

- [Supabase 공식 문서 - Database 연결](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Supabase 공식 문서 - 환경 변수](https://supabase.com/docs/guides/database/managing-env-vars)

---

**마지막 업데이트:** 2025-01-02

