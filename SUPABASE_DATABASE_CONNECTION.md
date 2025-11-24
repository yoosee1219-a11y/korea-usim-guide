# 🔐 Supabase Database Connection URL 찾기 가이드

## 현재 확인된 정보 ✅

- **Project ID**: `lthctjipvftelyqrjoyj`
- **Project URL**: `https://lthctjipvftelyqrjoyj.supabase.co` (REST API 엔드포인트)
- **Database Password**: `dbsdudgns0)`

## ⚠️ 현재 페이지는 데이터베이스 직접 연결 정보가 아닙니다

현재 보이는 **API Settings**와 **API Keys**는:
- Supabase 클라이언트 라이브러리용
- REST API 엔드포인트용
- **데이터베이스 직접 연결용이 아닙니다!**

---

## 📍 Database Connection URL 찾는 정확한 경로

### 단계별 안내:

1. **왼쪽 사이드바에서 "CONFIGURATION" 섹션 찾기**
   - 현재 보이는 화면 왼쪽 사이드바를 보세요

2. **"Database" 클릭**
   - "CONFIGURATION" 아래에 "Database" 항목이 있습니다
   - 오른쪽에 화살표(→) 아이콘이 있을 수 있습니다

3. **"Database" 페이지로 이동하면:**
   - **"Connection string"** 섹션이 있을 수 있습니다
   - 또는 **"Connection info"** 섹션이 있을 수 있습니다
   - 또는 **"Database password"** 섹션에서 비밀번호 확인 가능

---

## 🔍 Database 페이지에서 찾아야 할 것들

### 옵션 1: Connection string 섹션 (가장 쉬움)
```
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```
이런 형식의 문자열이 직접 제공될 수 있습니다.

### 옵션 2: Connection info 섹션
다음 정보들이 보일 수 있습니다:
- **Host**: `db.lthctjipvftelyqrjoyj.supabase.co`
- **Port**: `5432`
- **Database**: `postgres`
- **User**: `postgres`
- **Password**: `dbsdudgns0)` (이미 알고 있음)

이 정보들로 직접 조합:
```
postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/[DATABASE]
```

### 옵션 3: Connection Pooling 섹션
Connection Pooling을 사용하는 경우:
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

---

## 🎯 지금 해야 할 일

1. **왼쪽 사이드바의 "Database" 클릭**
   - "CONFIGURATION" 섹션 아래에 있습니다

2. **Database 페이지 전체 스크롤하며 확인:**
   - "Connection string" 섹션 찾기
   - "Connection info" 섹션 찾기
   - "Connection Pooling" 섹션 찾기

3. **보이는 정보를 스크린샷으로 보내주세요**

---

## 💡 예상되는 Database Connection URL

현재까지 확인된 정보로 조합하면:

### 직접 연결 형식:
```
postgresql://postgres:dbsdudgns0%29@db.lthctjipvftelyqrjoyj.supabase.co:5432/postgres
```
> 주의: 비밀번호의 `)`는 URL 인코딩되어 `%29`로 표시됩니다.

### 또는 Connection Pooling 형식 (권장):
```
postgresql://postgres.lthctjipvftelyqrjoyj:dbsdudgns0%29@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres
```
> Region은 프로젝트 생성 시 선택한 지역입니다 (예: `ap-northeast-2`).

---

## 🆘 Database 탭을 찾을 수 없을 때

1. **SQL Editor 확인:**
   - 왼쪽 사이드바에서 "SQL Editor" 클릭
   - 상단에 연결 정보가 표시될 수 있습니다

2. **Settings 전체 메뉴 확인:**
   - 왼쪽 사이드바의 Settings 아래 모든 메뉴를 확인
   - "Database" 또는 "Database Settings" 찾기

---

**다음 단계:** 왼쪽 사이드바의 "Database"를 클릭하고 스크린샷을 보내주세요! 📸

