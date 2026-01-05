---
name: pr-automation
description: GitHub PR 제목과 본문을 자동 생성하고 코드리뷰까지 수행. "do it PR", "PR 작성", "풀리퀘스트" 키워드로 자동 활성화
keywords: ["do it PR", "PR 작성", "풀리퀘스트", "pull request", "pr 날려"]
---

# PR 자동화 스킬

이 스킬은 현재 브랜치의 변경사항을 분석하여 GitHub Pull Request를 자동으로 생성하고, 코드리뷰까지 수행합니다.

## 🎯 주요 기능

1. **브랜치명 기반 Jira 티켓 자동 추출**
   - `feature/PROJ-4935-080-pre-batch` → `PROJ-4935`

2. **Jira 티켓 내용 자동 조회 (MCP 활용)**
   - 티켓 제목, 설명, Acceptance Criteria 추출

3. **Git 변경사항 분석**
   - 타겟 브랜치와의 diff 분석
   - 커밋 메시지 요약
   - 파일 수, 라인 수 통계

4. **PR 메타데이터 설정**
   - 이모지 선택 (🚢 ship / 🎪 circus / ❓ ask)
   - 타겟 브랜치 선택 (dev / release)
   - 리뷰어 자동 지정

5. **자동 코드리뷰**
   - 보안, 성능, 품질 체크
   - Inline comment 작성
   - 리뷰 요약 생성

6. **PR 생성 및 전환**
   - Draft PR 생성
   - 자동 리뷰 완료 후 Ready for review 전환

7. **Slack 알림 발송** (선택)
   - PR 생성 후 Slack 채널에 알림 메시지 발송
   - 타겟 브랜치 기반 환경 자동 판단 (DEV/STG/QA)

## 📝 워크플로우

### Step 1: 환경 확인
```bash
# 현재 브랜치 확인
git branch --show-current

# Git remote 확인 (프로젝트 자동 감지)
git remote get-url origin

# gh CLI 인증 확인
gh auth status
```

### Step 2: 사용자 입력 받기
다음 정보를 사용자에게 물어봅니다:

1. **현재 브랜치 확인**
   - "현재 브랜치가 `feature/PROJ-4935-080-pre-batch`가 맞나요?"

2. **PR 타입 선택** (이모지)
   - 🚢 ship: 일반적인 기능 배포
   - 🎪 circus: 실험적이거나 큰 변경
   - ❓ ask: 리뷰가 특별히 필요한 사항

3. **타겟 브랜치 선택**
   - `develop` (개발 배포)
   - `release/YYYYMMDD` (운영 배포)
     - release 선택 시: 다음 목요일 날짜 자동 계산하여 제안
     - 예: 오늘이 2025-11-18(월)이면 `release/20251120` 제안

### Step 3: Jira 티켓 조회
```javascript
// 브랜치명에서 티켓 번호 추출
const match = branchName.match(/([A-Z]+-\d+)/);
const ticketNumber = match[1]; // "PROJ-4935"

// MCP로 Jira 티켓 조회
mcp__mcp-atlassian__jira_get_issue({
  issue_key: ticketNumber,
  fields: "summary,description,customfield_10010" // AC 포함
})
```

### Step 4: Git 변경사항 분석
```bash
# 타겟 브랜치와의 diff
git diff ${targetBranch}...HEAD --stat
git diff ${targetBranch}...HEAD

# 커밋 메시지 목록
git log ${targetBranch}..HEAD --oneline

# 변경된 파일 목록
git diff ${targetBranch}...HEAD --name-only
```

### Step 5: 리뷰어 선택
`~/.claude/skills/pr-automation/reviewers.json`에서:
1. 현재 프로젝트의 기본 리뷰어 조회
2. 변경된 파일 경로 기반으로 CODEOWNERS 매칭
3. 최종 리뷰어 목록 생성

### Step 6: PR 본문 생성
템플릿 기반으로 PR 본문 생성:

```markdown
## 📋 Summary
{Jira 티켓 제목}

{Jira 티켓 설명 요약}

## 🔄 Changes
**변경 규모**: {N}개 파일, +{XXX}/-{YYY} lines

### 주요 변경사항
{커밋 메시지 + diff 분석 기반}
- 변경사항 1
- 변경사항 2
- ...

### 영향 범위
{변경된 디렉토리/모듈 분석}

## 🧪 Test Plan
{Jira AC 기반}
- [ ] 단위 테스트 추가/수정
- [ ] API 테스트 확인
- [ ] 시나리오 테스트

## 🔍 Review Focus
{자동 코드리뷰 결과 요약}

## 📌 Related
- Jira: [PROJ-XXXX](https://your-jira.atlassian.net/browse/PROJ-XXXX)

---
🤖 Generated with Claude Code PR Automation
```

### Step 7: Draft PR 생성
```bash
# PR 생성 (Draft 모드)
gh pr create \
  --draft \
  --title "[PROJ-4935] 🚢 {제목}" \
  --body "{본문}" \
  --base ${targetBranch} \
  --reviewer ${reviewers}
```

### Step 8: 자동 코드리뷰
`~/.claude/skills/pr-automation/review-guidelines.md` 기준으로:

1. **전체 코드 분석**
   - 보안 이슈 체크
   - 성능 문제 감지
   - 코드 품질 검토

2. **Inline 코멘트 작성**
```bash
# 특정 라인에 코멘트
gh pr comment ${PR_NUMBER} \
  --body "**⚠️ 성능 이슈**

N+1 쿼리가 발생할 수 있습니다.

\`\`\`java
// 현재 코드
for (Member member : members) {
  member.getOrders(); // Lazy Loading
}

// 개선 제안
memberRepository.findAllWithOrders();
\`\`\`
"
```

3. **리뷰 요약 코멘트**
```bash
gh pr comment ${PR_NUMBER} --body "
## 🤖 자동 코드리뷰 결과

### ✅ 통과 항목
- 보안: SQL Injection 이슈 없음
- 테스트: 단위 테스트 포함됨

### ⚠️ 검토 필요
- 성능: N+1 쿼리 가능성 (3개소)
- 품질: 중복 코드 발견 (2개소)

자세한 내용은 Inline 코멘트를 참고하세요.
"
```

### Step 9: Ready for Review 전환
사용자에게 확인 후:
```bash
gh pr ready ${PR_NUMBER}
```

### Step 10: Slack 알림 발송 (선택)
PR 생성 완료 후 Slack 채널에 알림을 보냅니다.

#### 환경 자동 판단
| 타겟 브랜치 | 환경 |
|-------------|------|
| `dev`, `develop` | DEV |
| `release/*` | STG |
| `main`, `master` | PROD |
| 그 외 | QA |

#### 메시지 형식
`mentionUser`가 `true`인 경우, PR 요청자를 @멘션하여 알림:
```
<@UXXXXXXXXXX> [{프로젝트명}] {환경} PR 요청드립니다
git: {PR URL}
jira: {Jira URL}
{PR 제목}
```

**@멘션의 장점:**
- PR 요청자에게 Slack 알림 → "내가 PR 올렸구나" 환기
- 제3자도 "홍길동이 PR 올렸구나" 파악 가능
- `#테크플랫폼센터-코드리뷰` 같은 공용 채널에 붙여넣기 쉬운 형식

#### 발송 방법
```bash
# config.json에서 설정 읽기
WEBHOOK_URL=$(cat ~/.claude/skills/pr-automation/config.json | jq -r '.slack.webhookUrl')
SLACK_MEMBER_ID=$(cat ~/.claude/skills/pr-automation/config.json | jq -r '.slack.slackMemberId')

# 메시지 발송 (@멘션 포함)
curl -X POST -H 'Content-type: application/json' \
  --data '{
    "text": "<@'"$SLACK_MEMBER_ID"'> [my-project] STG PR 요청드립니다\ngit: https://github.com/your-org/my-project/pull/123\njira: https://your-jira.atlassian.net/browse/PROJ-5068\nOY 적립금 - 본인인증 페이지 수정"
  }' \
  ${WEBHOOK_URL}
```

#### 사용자 확인
PR 생성 후 "Slack에 알림을 보낼까요?" 질문

## ⚙️ 설정 파일

### config.json
프로젝트별 설정 관리:
```json
{
  "defaultSettings": {
    "workspace": "~/WORKSPACE",
    "defaultTargetBranch": "develop",
    "releaseDay": "목요일",
    "jiraBaseUrl": "https://your-jira.atlassian.net/browse",
    "defaultPRType": "ship"
  },
  "slack": {
    "webhookUrl": "https://hooks.slack.com/services/XXXXX/YYYYY/ZZZZZ",
    "enabled": true,
    "askBeforeSend": true,
    "mentionUser": true,
    "slackMemberId": "UXXXXXXXXXX"
  },
  "projects": {
    "my-project": {
      "path": "~/WORKSPACE/my-project",
      "githubOrg": "your-org",
      "githubRepo": "my-project",
      "description": "메인 프로젝트",
      "defaultTargetBranch": "dev"
    },
    "my-auth-project": {
      "path": "~/WORKSPACE/my-auth-project",
      "githubOrg": "your-org",
      "githubRepo": "my-auth-project",
      "description": "인증 프로젝트",
      "defaultTargetBranch": "develop"
    }
  }
}
```

#### Slack 옵션 설명
| 옵션 | 설명 | 기본값 |
|------|------|--------|
| `webhookUrl` | Slack 웹훅 URL | `""` |
| `enabled` | 웹훅 사용 여부 | `false` |
| `askBeforeSend` | 발송 전 확인 여부 | `true` |
| `mentionUser` | @멘션 사용 여부 | `false` |
| `slackMemberId` | Slack 사용자 ID (예: `UXXXXXXXXXX`) | `""` |

### reviewers.json
프로젝트별 리뷰어 관리:
```json
{
  "my-project": {
    "defaultReviewers": ["github-user1", "github-user2"],
    "codeOwners": {
      "olive-domain": ["domain-expert"],
      "olive-api": ["api-expert"]
    }
  }
}
```

### review-guidelines.md
코드리뷰 체크리스트 (자연어로 작성)

## 🔧 멀티 프로젝트 지원

현재 디렉토리에서 프로젝트 자동 감지:
```bash
# Git remote에서 레포 이름 추출
git remote get-url origin
# → git@github.com:your-org/my-project.git
# → my-project 추출

# config.json에서 해당 프로젝트 설정 조회
# reviewers.json에서 해당 프로젝트 리뷰어 조회
```

## 📌 참고사항

1. **브랜치 전략**: Git Flow
   - 개발: `develop` 브랜치
   - 운영: `release/YYYYMMDD` (매주 목요일 정기배포)

2. **Jira 티켓 형식**: `PROJ-XXXX`

3. **브랜치 네이밍**: `feature/{TICKET}-{optional-suffix}`
   - 예: `feature/PROJ-4935-080-pre-batch`

4. **PR 제목 형식**: `[PROJ-XXXX] {이모지} {작업 내용}`
   - 예: `[PROJ-4935] 🚢 회원 승급 배치 로직 개선`

## 🚨 주의사항

1. **Git 정책 준수**: 이 스킬은 PR 생성까지만 수행하며, 커밋/푸시는 사용자가 직접 수행해야 합니다.

2. **gh CLI 필수**: GitHub CLI(`gh`)가 설치되고 인증되어 있어야 합니다.
   ```bash
   gh auth status
   ```

3. **MCP Jira 연동**: mcp-atlassian 서버가 활성화되어 있어야 합니다.

4. **설정 파일 관리**: 팀원과 공유 시 `reviewers.json`과 `config.json`을 함께 공유하세요.

## 🎓 사용 예시

### 일반적인 사용
```
사용자: do it PR
Claude: 현재 브랜치가 feature/PROJ-4935-080-pre-batch가 맞나요? (네/브랜치명 입력)
사용자: 네
Claude: PR 타입을 선택하세요:
  1. 🚢 ship - 일반 배포
  2. 🎪 circus - 실험적 변경
  3. ❓ ask - 특별 리뷰 필요
사용자: 1
Claude: 타겟 브랜치를 선택하세요:
  1. develop (개발 배포)
  2. release/20251120 (운영 배포 - 다음 목요일)
사용자: 1
Claude: [Jira 티켓 조회 중...]
       [Git diff 분석 중...]
       [PR 본문 생성 중...]
       [Draft PR 생성 완료]
       [자동 코드리뷰 실행 중...]
       [리뷰 완료 - 3개 코멘트 작성]

       PR이 생성되었습니다: https://github.com/.../pull/123

       Ready for review로 전환할까요? (y/n)
사용자: y
Claude: [Ready for review 전환 완료]
       리뷰어들에게 알림이 전송되었습니다.
```

### 운영 배포 PR
```
사용자: 운영 배포 PR 작성해줘
Claude: [자동으로 release/20251120 제안]
       ...
```

## 🔄 업데이트 방법

1. **리뷰어 추가**
   ```bash
   vi ~/.claude/skills/pr-automation/reviewers.json
   ```

2. **코드리뷰 기준 수정**
   ```bash
   vi ~/.claude/skills/pr-automation/review-guidelines.md
   ```

3. **프로젝트 추가**
   ```bash
   vi ~/.claude/skills/pr-automation/config.json
   # projects 섹션에 새 프로젝트 추가
   ```
