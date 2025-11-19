# Claude Code 설정

이 디렉토리는 Claude Code의 설정과 Skills를 포함합니다.

## 설치된 도구

### 1. SuperClaude (CLI)
```bash
# 버전 확인
superclaude --version
# 4.1.9

# 사용법
superclaude chat
```

### 2. MCP (Model Context Protocol)
- **Supabase MCP**: `.mcp.json`에 설정됨
- Supabase DB 직접 접근 가능

### 3. Claude Skills
- **translate-and-deploy**: 번역 + 배포 자동화
- **verify-deployment**: 배포 검증
- **auto-translate**: 완전 자동 번역 워크플로우

## Skills 사용법

### 방법 1: Claude Code에서 Skill 도구 사용
```
Skill 도구를 사용하여 "translate-and-deploy" skill 실행
```

### 방법 2: 자동화 스크립트 실행
```bash
# Windows (Git Bash)
bash scripts/auto-workflow.sh

# 완전 자동으로 실행됨:
# 1. 번역
# 2. 검증
# 3. Git commit
# 4. GitHub push
# 5. 보고서 생성
```

## SuperClaude + Skills 동시 사용

**SuperClaude**: 터미널에서 Claude와 대화
```bash
superclaude chat
> "블로그를 12개 언어로 번역해줘"
```

**Claude Skills**: Claude Code 내에서 자동화 워크플로우
```
Skill: translate-and-deploy
→ 자동으로 모든 작업 수행
```

**둘 다 사용**: SuperClaude로 대화하면서 Skills로 자동화
```bash
# SuperClaude에서
> "auto-translate skill을 실행해줘"

# → Claude Code가 자동으로:
#   1. 번역 시작
#   2. 진행 상황 모니터링
#   3. 완료 시 Git 작업
#   4. 최종 보고서 생성
```

## 파일 구조

```
.claude/
├── README.md                    # 이 파일
├── skills/
│   ├── translate-and-deploy.md # 번역+배포 skill
│   ├── verify-deployment.md    # 배포 검증 skill
│   └── auto-translate.md       # 자동 번역 skill
└── .mcp.json                   # MCP 설정 (상위 폴더)

scripts/
└── auto-workflow.sh            # 완전 자동화 스크립트
```

## 다음번 사용 시

퇴근 전에 한 번만 실행하세요:

```bash
bash scripts/auto-workflow.sh
```

출근하면 모든 작업이 완료되어 있습니다! 🎉
