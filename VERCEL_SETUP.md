# Vercel 배포 빠른 가이드

## ⚡ 빠른 배포 (GitHub 연동)

1. **Vercel Dashboard 접속**
   - https://vercel.com/dashboard
   - GitHub로 로그인

2. **프로젝트 추가**
   - "Add New Project" 클릭
   - `yoosee1219-a11y/korea-usim-guide` 저장소 선택
   - **프로젝트 설정:**
     - Framework Preset: **Other**
     - Root Directory: `./` (기본값)
     - Build Command: `npm run build`
     - Output Directory: `dist/public`
     - Install Command: `npm install`

3. **환경 변수 추가**
   - Settings → Environment Variables
   - 다음 변수 추가:
     ```
     DATABASE_URL=postgresql://postgres:[비밀번호]@db.[프로젝트ID].supabase.co:5432/postgres
     JWT_SECRET=OabLHz3ActpOxcmYZEUnXGe1w0kYNAimr7GXnDgKYXc=
     NODE_ENV=production
     ```

4. **도메인 연결**
   - Settings → Domains
   - `koreausimguide.com` 추가
   - DNS 설정 안내 따르기

5. **배포 완료!**
   - 자동으로 배포 시작
   - 배포 완료 후 `https://koreausimguide.com` 접속

## 📝 참고사항

- Vercel은 GitHub에 푸시할 때마다 자동 배포됩니다
- 환경 변수는 프로덕션/프리뷰/개발 환경별로 다르게 설정 가능
- 빌드 실패 시 Vercel Dashboard에서 로그 확인

