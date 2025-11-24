# Vercel 배포 가이드

## 1. Vercel 프로젝트 연결

### 방법 1: Vercel CLI 사용
```bash
npm i -g vercel
vercel login
vercel
```

### 방법 2: GitHub 연동 (권장)
1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. "Add New Project" 클릭
3. GitHub 저장소 `yoosee1219-a11y/korea-usim-guide` 선택
4. 프로젝트 설정:
   - **Framework Preset:** Other
   - **Root Directory:** `./` (기본값)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist/public`
   - **Install Command:** `npm install`

## 2. 환경 변수 설정

Vercel Dashboard → Project Settings → Environment Variables에서 다음 변수 추가:

### 필수 환경 변수
```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
JWT_SECRET=your-super-secret-jwt-key-change-in-production
NODE_ENV=production
PORT=3000
```

### 환경 변수 설정 위치
- **Production:** 프로덕션 환경
- **Preview:** 프리뷰 환경
- **Development:** 개발 환경

모든 환경에 동일한 값 설정하거나, 환경별로 다르게 설정 가능합니다.

## 3. 커스텀 도메인 연결

1. Vercel Dashboard → Project Settings → Domains
2. "Add Domain" 클릭
3. `koreausimguide.com` 입력
4. DNS 설정 안내에 따라 도메인 DNS 레코드 추가:
   - **Type:** CNAME
   - **Name:** @ 또는 www
   - **Value:** cname.vercel-dns.com

## 4. 빌드 및 배포 확인

배포 후:
1. Vercel Dashboard에서 배포 상태 확인
2. `https://koreausimguide.com` 접속 테스트
3. API 엔드포인트 테스트: `https://koreausimguide.com/api/auth/token`

## 5. 문제 해결

### 빌드 실패 시
- Vercel Dashboard → Deployments → 실패한 배포 클릭
- 빌드 로그 확인
- 로컬에서 `npm run build` 실행하여 오류 확인

### 환경 변수 오류
- 환경 변수가 제대로 설정되었는지 확인
- 변수 이름이 정확한지 확인 (대소문자 구분)

### 데이터베이스 연결 오류
- `DATABASE_URL` 형식 확인
- Supabase에서 연결 허용 IP 확인 (Vercel IP는 동적이므로 Supabase 설정에서 모든 IP 허용 필요)

## 참고사항

- Vercel은 서버리스 함수를 사용하므로, Express 앱이 자동으로 서버리스 함수로 변환됩니다.
- `vercel.json` 파일이 자동 감지되어 라우팅 설정이 적용됩니다.
- 정적 파일은 `dist/public`에서 자동으로 서빙됩니다.

