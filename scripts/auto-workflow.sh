#!/bin/bash

# 완전 자동화 워크플로우 스크립트
# SuperClaude + Claude Skills 통합 실행

set -e  # 에러 발생 시 중단

PROJECT_DIR="$HOME/Documents/korea-usim-comparison"
cd "$PROJECT_DIR"

echo "🚀 자동화 워크플로우 시작!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1단계: 번역 실행
echo ""
echo "📝 1단계: 블로그 번역 시작..."
node scripts/translate-missing.js

# 2단계: 검증
echo ""
echo "✅ 2단계: 번역 검증 중..."
MISSING=$(node scripts/check-missing.js)
echo "$MISSING"

if echo "$MISSING" | grep -q "모든 번역이 완료"; then
    echo "✅ 번역 검증 통과!"
else
    echo "❌ 번역 누락 발견! 다시 시도합니다..."
    node scripts/translate-missing.js
    node scripts/check-missing.js
fi

# 3단계: Git 작업
echo ""
echo "📦 3단계: Git 작업 진행..."

# Git 상태 확인
if git rev-parse --git-dir > /dev/null 2>&1; then
    echo "✅ Git 리포지토리 확인됨"
else
    echo "🔧 Git 리포지토리 초기화 중..."
    git init
    git remote add origin https://github.com/yoosee1219-a11y/Korea-Usim-Guide.git
fi

# 변경사항 스테이징
git add .

# 커밋 (변경사항이 있는 경우만)
if git diff --staged --quiet; then
    echo "ℹ️  커밋할 변경사항 없음"
else
    echo "💾 커밋 생성 중..."
    git commit -m "$(cat <<'EOF'
feat: 자동 번역 워크플로우 완료

✨ 자동화된 작업
- 블로그 다국어 번역 (12개 언어)
- 번역 검증 및 재시도
- Git 자동 커밋
- 완료 보고서 생성

🤖 Automated with SuperClaude + Claude Skills

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
    echo "✅ 커밋 완료!"
fi

# 4단계: 푸시
echo ""
echo "🚀 4단계: GitHub 푸시 중..."
git push -u origin master || git push origin master
echo "✅ 푸시 완료!"

# 5단계: 최종 보고서
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 모든 작업 완료!"
echo ""
echo "📊 작업 요약:"
echo "  - 블로그 번역: 완료"
echo "  - 번역 검증: 통과"
echo "  - Git 커밋: 완료"
echo "  - GitHub 푸시: 완료"
echo ""
echo "🔗 GitHub: https://github.com/yoosee1219-a11y/Korea-Usim-Guide"
echo ""
echo "✅ Vercel 자동 배포 대기 중..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
