# PR 자동화 스킬 사용 가이드

Claude Code PR 자동화 스킬에 오신 것을 환영합니다! 🎉

## 🚀 빠른 시작

### 1. 초기 설정

#### Step 1: GitHub CLI 인증 확인
```bash
gh auth status
```

인증이 안 되어 있다면:
```bash
gh auth login
```

#### Step 2: 설정 파일 수정

**config.json** - GitHub Organization 설정
```bash
vi ~/.claude/skills/pr-automation/config.json
```

`YOUR_GITHUB_ORG`를 실제 GitHub Organization 이름으로 변경하세요.

```json
{
  "projects": {
    "my-project": {
      "githubOrg": "your-org",  // 여기를 수정
      "githubRepo": "my-project"
    }
  }
}
```

**reviewers.json** - 리뷰어 설정
```bash
vi ~/.claude/skills/pr-automation/reviewers.json
```

팀원들의 GitHub username으로 변경하세요.

```json
{
  "my-project": {
    "defaultReviewers": [
      "홍길동-github-id",
      "김철수-github-id"
    ]
  }
}
```

### 2. 사용 방법

#### 기본 사용
```
사용자: do it PR
```

또는

```
사용자: PR 작성해줘
사용자: 풀리퀘스트 날려
```

#### 운영 배포 PR
```
사용자: 운영 배포 PR 작성
사용자: release PR 만들어줘
```

## 📋 워크플로우

### 전체 흐름
```
1. 브랜치 확인
   ↓
2. PR 타입 선택 (ship/circus/ask)
   ↓
3. 타겟 브랜치 선택 (dev/release)
   ↓
4. Jira 티켓 조회
   ↓
5. Git diff 분석
   ↓
6. PR 본문 생성
   ↓
7. Draft PR 생성
   ↓
8. 자동 코드리뷰
   ↓
9. Ready for review 전환
   ↓
10. Slack 알림 (선택) - @멘션으로 팀 채널에 PR 알림!
```

### 상세 과정

#### 1️⃣ 브랜치 확인
현재 브랜치가 `feature/PROJ-4935-xxx` 형식인지 확인합니다.

```
Claude: 현재 브랜치가 feature/PROJ-4935-080-pre-batch가 맞나요?
사용자: 네
```

#### 2️⃣ PR 타입 선택
```
Claude: PR 타입을 선택하세요:
  1. 🚢 ship - 일반적인 기능 배포
  2. 🎪 circus - 실험적이거나 큰 변경
  3. ❓ ask - 리뷰가 특별히 필요

사용자: 1
```

- **🚢 ship**: 안정적인 기능 추가/개선
- **🎪 circus**: 대규모 리팩토링, 실험적 기능
- **❓ ask**: 아키텍처 변경, 중요한 의사결정 필요

#### 3️⃣ 타겟 브랜치 선택
```
Claude: 타겟 브랜치를 선택하세요:
  1. develop (개발 배포)
  2. release/20251120 (운영 배포 - 다음 목요일)

사용자: 1
```

- **develop**: 개발서버 배포용
- **release/YYYYMMDD**: 운영 배포용 (매주 목요일 정기배포)

#### 4️⃣ Jira 티켓 조회
브랜치명에서 티켓 번호를 추출하여 Jira에서 정보를 가져옵니다.

```
[Jira 티켓 조회 중...]
✓ PROJ-4935: 회원 승급 배치 로직 개선
```

#### 5️⃣ Git diff 분석
타겟 브랜치와의 변경사항을 분석합니다.

```
[Git 변경사항 분석 중...]
✓ 파일 12개 변경
✓ +456 / -123 lines
✓ 커밋 7개 분석 완료
```

#### 6️⃣ PR 본문 생성
Jira 티켓과 Git diff를 기반으로 PR 본문을 자동 생성합니다.

```markdown
## 📋 Summary
회원 승급 배치 로직 개선

기존 일 배치로 처리되던 회원 승급 로직을 시간 단위로 개선하여
실시간성을 향상시킴.

## 🔄 Changes
**변경 규모**: 12개 파일, +456/-123 lines

### 주요 변경사항
- 회원 승급 배치 스케줄러 시간 단위로 변경
- 승급 대상자 조회 쿼리 성능 개선
- 승급 이력 테이블 추가

...
```

#### 7️⃣ Draft PR 생성
```
[Draft PR 생성 중...]
✓ PR 생성 완료: https://github.com/your-org/my-project/pull/1234
```

#### 8️⃣ 자동 코드리뷰
```
[자동 코드리뷰 실행 중...]
✓ 보안 체크 완료 (0 이슈)
✓ 성능 분석 완료 (2 제안)
✓ 코드 품질 체크 완료 (1 제안)

총 3개 코멘트 작성 완료
```

#### 9️⃣ Ready for Review 전환
```
Claude: PR과 자동 리뷰가 완료되었습니다.
       Ready for review로 전환할까요? (y/n)

사용자: y

✓ Ready for review 전환 완료
✓ 리뷰어들에게 알림 전송됨
```

## ⚙️ 설정 파일 상세

### config.json

```json
{
  "defaultSettings": {
    "workspace": "~/WORKSPACE",              // 프로젝트 기본 경로
    "defaultTargetBranch": "develop",        // 기본 타겟 브랜치
    "releaseDay": "목요일",                   // 정기 배포 요일
    "jiraBaseUrl": "https://your-jira.atlassian.net/browse",
    "defaultPRType": "ship"                  // 기본 PR 타입
  },
  "slack": {
    "webhookUrl": "https://hooks.slack.com/services/...",  // ⭐ 본인 웹훅 URL
    "enabled": true,                         // 웹훅 사용 여부
    "askBeforeSend": true,                   // 발송 전 확인
    "mentionUser": true,                     // @멘션 사용
    "slackMemberId": "UXXXXXXXXXX"           // ⭐ 본인 Slack Member ID
  },
  "projects": {
    "my-project": {
      "path": "~/WORKSPACE/my-project",
      "githubOrg": "YOUR_GITHUB_ORG",        // ⭐ 수정 필요
      "githubRepo": "my-project",
      "description": "메인 프로젝트"
    },
    "my-auth-project": {
      "path": "~/WORKSPACE/my-auth-project",
      "githubOrg": "YOUR_GITHUB_ORG",        // ⭐ 수정 필요
      "githubRepo": "my-auth-project",
      "description": "인증 프로젝트"
    }
  }
}
```

> 💡 **Slack Member ID 찾기**: Slack에서 본인 프로필 → 더보기(⋮) → "멤버 ID 복사"

### reviewers.json

```json
{
  "my-project": {
    "defaultReviewers": [
      "github-username-1",                   // ⭐ 수정 필요
      "github-username-2"                    // ⭐ 수정 필요
    ],
    "codeOwners": {
      "olive-domain": ["domain-expert"],
      "olive-api": ["api-expert"],
      "olive-batch": ["batch-expert"]
    },
    "minReviewers": 1
  },
  "my-auth-project": {
    "defaultReviewers": [
      "auth-reviewer-1",                     // ⭐ 수정 필요
      "auth-reviewer-2"                      // ⭐ 수정 필요
    ],
    "codeOwners": {
      "src/main/java/auth": ["auth-expert"]
    },
    "minReviewers": 1
  }
}
```

### review-guidelines.md

자연어로 작성된 코드리뷰 체크리스트입니다.
팀의 코딩 컨벤션에 맞게 자유롭게 수정할 수 있습니다.

```bash
vi ~/.claude/skills/pr-automation/review-guidelines.md
```

## 🎓 활용 팁

### 1. 프로젝트 추가하기

새 프로젝트를 추가하려면:

```bash
vi ~/.claude/skills/pr-automation/config.json
```

projects 섹션에 추가:
```json
{
  "projects": {
    "새-프로젝트": {
      "path": "~/WORKSPACE/새-프로젝트",
      "githubOrg": "your-org",
      "githubRepo": "새-프로젝트",
      "description": "프로젝트 설명"
    }
  }
}
```

리뷰어도 추가:
```bash
vi ~/.claude/skills/pr-automation/reviewers.json
```

### 2. 리뷰어 변경하기

팀원이 바뀌었을 때:
```bash
vi ~/.claude/skills/pr-automation/reviewers.json
```

### 3. 코드리뷰 기준 커스터마이징

팀의 코딩 컨벤션에 맞게:
```bash
vi ~/.claude/skills/pr-automation/review-guidelines.md
```

예시: Spring Boot 전용 체크 항목 추가
```markdown
## Spring Boot 관련

### @Transactional 사용
- Service 계층에 적절히 적용되었는가?
- readOnly 옵션을 고려했는가?

### RestController
- @RestController vs @Controller 선택이 적절한가?
- ResponseEntity 사용이 일관적인가?
```

### 4. 팀원과 설정 공유하기

```bash
# 설정 파일 복사
cp ~/.claude/skills/pr-automation/config.json ~/team-shared/
cp ~/.claude/skills/pr-automation/reviewers.json ~/team-shared/
cp ~/.claude/skills/pr-automation/review-guidelines.md ~/team-shared/
```

팀원들이 동일한 설정을 사용하면 일관된 PR과 코드리뷰가 가능합니다.

## 🔧 문제 해결

### gh CLI 인증 문제
```bash
# 인증 상태 확인
gh auth status

# 재인증
gh auth login

# 토큰 확인
gh auth token
```

### Jira 연동 문제
```bash
# MCP 서버 상태 확인
claude mcp list

# mcp-atlassian 활성화 확인
# Jira 토큰 재설정
```

### PR 생성 실패
```bash
# Git remote 확인
git remote -v

# 브랜치 확인
git branch --show-current

# 권한 확인
gh repo view
```

### 코드리뷰 코멘트 실패
```bash
# PR 번호 확인
gh pr list

# 수동 코멘트 테스트
gh pr comment PR번호 --body "테스트"
```

## 📚 참고자료

### Git Flow
- 개발: `feature/* → develop`
- 운영: `feature/* → release/YYYYMMDD`

### Jira 티켓 규칙
- 형식: `PROJ-XXXX`
- 브랜치: `feature/PROJ-XXXX-{optional-suffix}`

### PR 제목 형식
- `[PROJ-XXXX] {이모지} {작업 내용}`
- 예: `[PROJ-4935] 🚢 회원 승급 배치 로직 개선`

### GitHub CLI 명령어
```bash
# PR 목록
gh pr list

# PR 상세
gh pr view 123

# PR 병합
gh pr merge 123

# PR 닫기
gh pr close 123
```

## 🆘 도움말

문제가 생기면:

1. **설정 확인**
   ```bash
   cat ~/.claude/skills/pr-automation/config.json
   cat ~/.claude/skills/pr-automation/reviewers.json
   ```

2. **Claude에게 질문**
   ```
   사용자: PR 스킬 설정이 이상해
   사용자: Jira 연동이 안 돼
   ```

3. **수동 PR 생성 (백업)**
   ```bash
   gh pr create --title "[PROJ-4935] 🚢 제목" --body "본문" --base develop
   ```

## 🎉 즐거운 PR 작성되세요!

이제 PR 작성에 소요되는 시간을 90% 줄이고,
코드 품질은 향상시킬 수 있습니다.

**Happy Coding! 🚀**
