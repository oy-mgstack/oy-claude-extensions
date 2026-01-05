# PR 자동화 스킬 설치 가이드

Claude Code PR 자동화 스킬을 설치하는 방법입니다.

## 📋 사전 요구사항

- Claude Code CLI 설치됨
- Git 프로젝트 존재
- GitHub 계정 및 Repository 접근 권한

---

## 📥 설치 방법

### 1. 압축 파일 다운로드

`pr-automation-skill.tar.gz` 파일을 받으세요.

### 2. 압축 해제

```bash
# Claude skills 디렉토리로 이동
cd ~/.claude/skills

# 압축 해제
tar -xzf ~/Downloads/pr-automation-skill.tar.gz

# 설치 확인
ls -la pr-automation/
```

다음 파일들이 있어야 합니다:
```
pr-automation/
├── SKILL.md                    # 메인 스킬 정의
├── config.json                 # 프로젝트 설정
├── reviewers.json              # 리뷰어 관리
├── review-guidelines.md        # 코드리뷰 체크리스트
├── README.md                   # 사용 가이드
└── INSTALL.md                  # 이 파일
```

---

## ⚙️ 초기 설정 (필수!)

### Step 1: GitHub Organization 확인

먼저 프로젝트의 GitHub org를 확인하세요:

```bash
cd ~/WORKSPACE/your-project
git remote get-url origin
# 예: https://github.com/YOUR-ORG/your-repo.git
#                      ↑↑↑↑↑↑↑↑
#                      이 부분
```

### Step 2: config.json 수정

```bash
vi ~/.claude/skills/pr-automation/config.json
```

**수정 전**:
```json
{
  "defaultSettings": {
    "jiraBaseUrl": "https://your-jira.atlassian.net/browse"  // ⚠️ Jira URL 확인
  },
  "projects": {
    "my-project": {
      "githubOrg": "your-org",        // ⚠️ 본인의 org로 변경
      "githubRepo": "my-project"
    }
  }
}
```

**수정 후** (예시):
```json
{
  "defaultSettings": {
    "jiraBaseUrl": "https://your-jira.com/jira/browse"  // ✅ 본인 Jira URL
  },
  "projects": {
    "my-project": {                    // ✅ 프로젝트명
      "path": "~/workspace/my-project", // ✅ 프로젝트 경로
      "githubOrg": "my-company",        // ✅ GitHub org
      "githubRepo": "my-project"        // ✅ 레포지토리명
    }
  }
}
```

### Step 3: 팀원 GitHub Username 확인

```bash
cd ~/workspace/your-project
git log --pretty=format:"%an|%ae" --since="3 months ago" | sort -u
```

또는 GitHub 웹에서:
```
https://github.com/YOUR-ORG/YOUR-REPO → Contributors
```

### Step 4: reviewers.json 수정

```bash
vi ~/.claude/skills/pr-automation/reviewers.json
```

**수정 전**:
```json
{
  "my-project": {
    "defaultReviewers": [
      "github-user1",
      "github-user2"
    ]
  }
}
```

**수정 후** (예시):
```json
{
  "my-project": {
    "defaultReviewers": [
      "john-doe",          // ✅ 본인 팀원 GitHub username
      "jane-smith",
      "bob-wilson"
    ],
    "minReviewers": 2      // 최소 리뷰어 수
  }
}
```

### Step 5: GitHub CLI 인증

#### 방법 1: 브라우저 인증 (권장)
```bash
gh auth login
```

#### 방법 2: 토큰 인증
```bash
# Personal Access Token 생성: https://github.com/settings/tokens
# repo, workflow 권한 필요

echo "ghp_YOUR_TOKEN_HERE" | gh auth login --with-token
```

인증 확인:
```bash
gh auth status
# ✓ Logged in to github.com
```

### Step 6: Slack 웹훅 설정 (선택)

PR 생성 후 Slack 채널에 자동 알림을 보내고 싶다면 이 단계를 진행하세요.
**사용하지 않으려면 이 단계를 건너뛰세요.**

#### 옵션 A: Slack 웹훅 사용 안 함 (기본값)

`config.json`에서 `enabled`를 `false`로 설정:
```json
{
  "slack": {
    "webhookUrl": "",
    "enabled": false,
    "askBeforeSend": true
  }
}
```

#### 옵션 B: 새 Slack 웹훅 생성

1. **Slack 앱 생성/선택**
   - https://api.slack.com/apps 접속
   - "Create New App" 또는 기존 앱 선택

2. **Incoming Webhooks 활성화**
   - 좌측 메뉴 → "Incoming Webhooks"
   - "Activate Incoming Webhooks" → On

3. **웹훅 URL 생성**
   - "Add New Webhook to Workspace" 클릭
   - 알림 받을 채널 선택 (예: `#pr-requests`, `#dev-notifications`)
   - "허용" 클릭
   - 생성된 웹훅 URL 복사
     ```
     https://hooks.slack.com/services/TXXXXX/BXXXXX/XXXXXXXXXX
     ```

4. **config.json에 설정**
   ```bash
   vi ~/.claude/skills/pr-automation/config.json
   ```

   ```json
   {
     "slack": {
       "webhookUrl": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
       "enabled": true,
       "askBeforeSend": true,
       "mentionUser": true,
       "slackMemberId": "UXXXXXXXXXX"
     }
   }
   ```

5. **Slack Member ID 찾기** (@멘션용)

   PR 알림에 `@본인` 멘션을 추가하려면 Slack Member ID가 필요합니다.

   **방법 1: Slack 프로필에서 확인**
   - Slack에서 본인 프로필 클릭
   - "프로필 보기" → 더보기(⋮) → "멤버 ID 복사"

   **방법 2: 웹 브라우저에서 확인**
   - Slack 웹 버전 접속
   - 본인 프로필 클릭 → URL에서 확인
     ```
     https://app.slack.com/client/.../UXXXXXXXXXX
                                      ↑↑↑↑↑↑↑↑↑↑↑
                                      이 부분이 Member ID
     ```

   **방법 3: Slack API 사용**
   ```bash
   # users.list API로 조회 (Slack 앱 토큰 필요)
   curl -H "Authorization: Bearer xoxb-YOUR-TOKEN" \
     "https://slack.com/api/users.list" | jq '.members[] | {name, id}'
   ```

6. **웹훅 테스트**
   ```bash
   # @멘션 없이 테스트
   curl -X POST -H 'Content-type: application/json' \
     --data '{"text":"🎉 PR 자동화 웹훅 테스트 성공!"}' \
     "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

   # @멘션 포함 테스트 (본인 Member ID로 변경)
   curl -X POST -H 'Content-type: application/json' \
     --data '{"text":"<@UXXXXXXXXXX> 🎉 @멘션 테스트 성공!"}' \
     "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
   ```
   선택한 채널에 메시지가 도착하면 설정 완료!

#### 옵션 설명

| 옵션 | 설명 | 권장값 |
|------|------|--------|
| `webhookUrl` | Slack 웹훅 URL | 본인 팀 채널 URL |
| `enabled` | 웹훅 사용 여부 | `true` 또는 `false` |
| `askBeforeSend` | PR 생성 후 "알림 보낼까요?" 확인 | `true` (권장) |
| `mentionUser` | @멘션 사용 여부 | `true` (권장) |
| `slackMemberId` | 본인 Slack Member ID | `U...` 형식 |

**@멘션의 장점:**
- PR 요청자에게 Slack 알림 → "내가 PR 올렸구나" 환기
- 제3자도 "홍길동이 PR 올렸구나" 파악 가능
- `#테크플랫폼센터-코드리뷰` 같은 공용 채널에 붙여넣기 쉬운 형식으로 메시지 생성

> ⚠️ **보안 주의**: 웹훅 URL은 민감 정보입니다. Git에 커밋하지 마세요!

---

## 🎯 사용 방법

### 기본 사용
```
do it PR
```

또는
```
PR 작성해줘
풀리퀘스트 날려
```

### 워크플로우

1. **브랜치 확인** - 자동으로 현재 브랜치 확인
2. **Jira 티켓 조회** - 브랜치명에서 티켓 번호 추출
3. **PR 타입 선택** - 🚢 ship / 🎪 circus / ❓ ask
4. **타겟 브랜치 선택** - develop / release
5. **PR 본문 생성** - Jira + Git 기반 자동 생성
6. **Draft PR 생성** - GitHub에 생성
7. **자동 코드리뷰** - 보안/성능/품질 체크
8. **Ready for review** - 리뷰어 알림
9. **Slack 알림** (선택) - 팀 채널에 PR 알림 발송. `#테크플랫폼센터-코드리뷰` 같은 공용 채널에 붙여넣기 쉬운 형식으로 메시지도 함께 생성해줘요!

---

## 🔍 문제 해결

### Q1. "do it PR" 명령어가 작동하지 않아요

**확인사항**:
```bash
# 스킬 파일 존재 확인
ls ~/.claude/skills/pr-automation/SKILL.md

# keywords 확인
grep "keywords" ~/.claude/skills/pr-automation/SKILL.md
```

**해결**: Claude Code 재시작
```bash
# 터미널 재시작 또는
claude --version  # 스킬 다시 로드
```

### Q2. GitHub 인증 오류

**에러**: `You are not logged into any GitHub hosts`

**해결**:
```bash
gh auth login
# 또는
echo "YOUR_TOKEN" | gh auth login --with-token
```

### Q3. Jira 티켓을 못 찾아요

**확인사항**:
1. 브랜치명에 티켓 번호 포함되어 있는지 확인
   - 예: `feature/PROJ-123-xxx`
2. Jira MCP 연동 확인
   ```bash
   claude mcp list | grep atlassian
   ```

**해결**:
- 브랜치명 규칙: `feature/{JIRA-TICKET}-{description}`
- Jira MCP 설정 확인

### Q4. 리뷰어가 자동 지정 안 돼요

**확인사항**:
```bash
cat ~/.claude/skills/pr-automation/reviewers.json
```

**해결**: 프로젝트명이 `config.json`과 `reviewers.json`에서 일치하는지 확인

### Q5. Slack 알림이 안 가요

**확인사항**:
```bash
# config.json에서 slack 설정 확인
cat ~/.claude/skills/pr-automation/config.json | grep -A5 '"slack"'
```

**체크리스트**:
- [ ] `enabled`가 `true`인가?
- [ ] `webhookUrl`이 올바른 형식인가? (`https://hooks.slack.com/services/...`)
- [ ] 웹훅이 해당 채널에 권한이 있는가?

**웹훅 테스트**:
```bash
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"테스트 메시지"}' \
  "YOUR_WEBHOOK_URL"
```

**해결**:
- 웹훅 URL 재확인 또는 재생성
- Slack 앱 권한 확인 (해당 채널에 추가되어 있는지)

---

## 🎨 커스터마이징

### 코드리뷰 기준 수정

팀의 코딩 컨벤션에 맞게:
```bash
vi ~/.claude/skills/pr-automation/review-guidelines.md
```

### 새 프로젝트 추가

```bash
vi ~/.claude/skills/pr-automation/config.json
```

projects 섹션에 추가:
```json
{
  "projects": {
    "existing-project": { ... },
    "new-project": {
      "path": "~/workspace/new-project",
      "githubOrg": "your-org",
      "githubRepo": "new-project"
    }
  }
}
```

리뷰어도 추가:
```bash
vi ~/.claude/skills/pr-automation/reviewers.json
```

---

## 📚 더 알아보기

- 사용 가이드: `~/.claude/skills/pr-automation/README.md`
- 코드리뷰 가이드라인: `~/.claude/skills/pr-automation/review-guidelines.md`
- 스킬 정의: `~/.claude/skills/pr-automation/SKILL.md`

---

## 🆘 지원

문제가 생기면:
1. README.md 확인
2. GitHub Issues
3. 팀 내부 공유 채널

---

**Happy PR Automation! 🚀**
