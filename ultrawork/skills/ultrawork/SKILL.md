---
name: ultrawork
description: Ultrawork v4.0 - Copilot CLI 기반 멀티 에이전트 시스템. "ultrawork", "ulw" 키워드로 활성화. Copilot 미구독자도 Claude 기반 에이전트 사용 가능.
---

# Ultrawork Mode v4.0 (Copilot Edition)

Copilot CLI 기반 멀티 LLM + 11개 전문 에이전트 시스템.
**GPT-5.2 / Claude Opus 4.5 / Gemini 3** 모델 선택 가능.

> **v4.0 핵심 변경**: Codex → Copilot CLI 전환, Claude Code 대화 컨텍스트 공유 지원

## 자동 실행 트리거

다음 키워드가 포함되면 이 스킬이 자동 활성화:
- "ultrawork", "ulw"
- "시지프스 모드", "Sisyphus"
- "병렬 에이전트", "parallel agents"
- "끝까지 해줘", "완료될 때까지"
- "GPT 리뷰", "더블체크"
- "전문 에이전트", "multi-agent"

---

## 핵심 원칙 (Sisyphus 철학)

> "Sisyphus처럼 끝없이 굴러떨어지는 바위를 다시 밀어올린다"

1. **절대 포기하지 않음**: 에러가 나도 다른 접근법 시도
2. **TODO 완료 강제**: 모든 TODO가 completed될 때까지 작업 계속
3. **병렬 활용 최대화**: 독립적인 작업은 동시에 실행
4. **멀티 LLM 활용**: Copilot을 통해 GPT/Gemini 조합
5. **컨텍스트 공유**: Claude Code 대화 문맥을 Copilot에 전달
6. **LSP 우선**: 텍스트 검색보다 구조화된 코드 분석 선호

---

## 요구사항 및 Fallback

### Copilot 구독자 (Full Mode)
- **모든 11개 에이전트** 사용 가능
- GPT-5.2, Gemini-3 등 멀티 모델 활용
- 더블체크, 교차 검증 워크플로우 완전 지원

### Copilot 미구독자 (Lite Mode)
- **7개 Claude 기반 에이전트** 사용 가능:
  - Architect, Debugger, Coder, Explorer, Refactorer, Inspector, Conductor
- Copilot 기반 4개 에이전트는 **Claude로 대체**:
  - Strategist → Claude Task(Plan) 사용
  - Reviewer → Claude 직접 리뷰
  - Analyst → Claude 분석
  - DocWriter → Claude 문서 작성

> **참고**: Lite Mode에서도 ULW의 핵심 가치 (Sisyphus 철학, 병렬 실행, TODO 완료 강제)는 그대로 적용됩니다.

---

## 에이전트 구성

### 기획 그룹 (Planning) - Copilot Bridge 사용

| 에이전트 | Copilot 도구 | Fallback (Lite Mode) |
|----------|-------------|----------------------|
| **Strategist** | `copilot_planner` | Task(Plan) |
| **Reviewer** | `copilot_reviewer` | Claude 직접 리뷰 |
| **Analyst** | `copilot_reasoner` | Claude 분석 |
| **DocWriter** | `copilot_writer` | Claude 문서 작성 |

### 실행 그룹 (Execution) - Claude 기반

| 에이전트 | 역할 | 구현 방식 | 모델 |
|----------|------|-----------|------|
| **Architect** | 아키텍처 설계, 구조 결정 | `Task(Plan)` | Opus |
| **Debugger** | 버그 분석, 원인 추적, 수정 | `Task + Serena LSP` | Sonnet |
| **Coder** | 메인 코드 구현 | `Task(general-purpose)` | Sonnet |
| **Explorer** | 빠른 파일/패턴 검색 | `Task(Explore)` | Haiku |

### 지원 그룹 (Support) - Claude 기반

| 에이전트 | 역할 | 구현 방식 | 모델 |
|----------|------|-----------|------|
| **Refactorer** | AST 기반 안전한 리팩토링 | `ast-grep + Serena` | Sonnet |
| **Inspector** | UI/이미지/스크린샷 분석 | `Puppeteer Vision` | Claude Vision |
| **Conductor** | 전체 조율, 최종 결정 (PM) | `Main Agent` | Opus |

---

## Copilot 도구 (Full Mode 전용)

### 사용 가능한 도구

| 도구 | 용도 | 추천 모델 |
|------|------|----------|
| `copilot_planner` | 전략/계획 수립 | GPT-5.2 |
| `copilot_writer` | 문서 작성 (5개 프리셋) | GPT-5.2 |
| `copilot_reasoner` | 심층 분석/추론 | GPT-5.2 |
| `copilot_reviewer` | 코드/문서 리뷰 | GPT-5.2 |
| `copilot_debugger` | 버그 분석 | GPT-5.2 |
| `copilot_coder` | 코드 생성 (더블체크용) | GPT-5.2 |
| `copilot_translator` | 코드 번역/변환 | GPT-5.2 |

### Writer 프리셋

```
preset: "slack-to-report"    # 슬랙 대화 → 보고용 문구
preset: "meeting-summary"    # 회의 내용 → 회의록
preset: "status-update"      # 진행상황 공유 메시지
preset: "pr-description"     # PR 설명 초안
preset: "release-note"       # 릴리즈 노트
```

### 컨텍스트 공유 (중요!)

**모든 Copilot 도구 호출 시 `conversationContext` 파라미터 필수 전달!**

```typescript
mcp__copilot-bridge__copilot_planner({
  task: "인증 시스템 리팩토링 계획",
  conversationContext: `
    현재 작업: oliveyoung-auth 프로젝트
    이전 논의: JWT 토큰 갱신 로직에 버그 발견
    관련 파일: TokenService.java, AuthFilter.java
  `,
  model: "gpt-5.2-codex"
});
```

---

## 지원 모델 (Copilot 구독)

| 모델 | 용도 | 비용 |
|------|------|------|
| `gpt-5.2-codex` | 기본, 코드 생성 | 구독 포함 |
| `gpt-4.1` | 범용 | 구독 포함 |
| `claude-opus-4.5` | 심층 분석 | 프리미엄 |
| `claude-sonnet-4.5` | 빠른 응답 | 구독 포함 |
| `gemini-3-pro` | 대용량 컨텍스트 | 프리미엄 |
| `gemini-3-flash` | 빠른 응답 | 구독 포함 |

---

## 워크플로우 패턴

### 1. 복잡한 기능 구현

```
사용자: "ulw: 인증 시스템 구현해줘"

=== Phase 1: 전략 수립 (병렬) ===
[Strategist] 로드맵 수립 (copilot_planner 또는 Task(Plan))
[Analyst] 요구사항 분석 (copilot_reasoner 또는 Claude)
[Explorer] 기존 코드 탐색

=== Phase 2: 설계 ===
[Architect] 아키텍처 설계
[Reviewer] 설계 검토 (copilot_reviewer 또는 Claude)

=== Phase 3: 구현 (병렬) ===
[Coder] 핵심 로직 구현
[Coder] API 엔드포인트 구현
[DocWriter] API 문서 초안

=== Phase 4: 검증 ===
[Reviewer] 코드 리뷰 (더블체크)
[Debugger] 잠재적 버그 분석
[Conductor] 최종 통합
```

### 2. 병렬 실행 패턴

```markdown
# 여러 에이전트를 동시에 실행
[병렬 실행]
├── Task(Explore): 코드베이스 탐색
├── copilot_planner: 전략 수립 (또는 Task(Plan))
└── mcp__serena__get_symbols_overview: 구조 분석

# 결과 취합 후 다음 단계
[순차 실행]
└── Conductor: 결과 종합 및 다음 액션 결정
```

### 3. 더블체크 패턴 (Full Mode)

```markdown
# 중요한 작업은 교차 검증
작업 유형별 더블체크:
├── 코드 구현: Claude 작성 → Copilot Reviewer 검토
├── 문서 작성: Copilot Writer 작성 → Claude 기술 검토
├── 아키텍처: Claude 설계 + Copilot 분석 → 최종 통합
└── 리팩토링: ast-grep 수정 → LSP 영향 분석 → Reviewer 검토
```

---

## 설정

### 자동 활성화 조건

1. **키워드 포함**: ultrawork, ulw
2. **복잡한 작업**: 5개 이상 하위 작업 예상
3. **더블체크 요청**: "리뷰해줘", "검토해줘"
4. **문서 요청**: "README", "문서 작성"
5. **리팩토링 요청**: "리팩토링", "정리해줘"

### 비활성화 방법
```
"일반 모드로 해줘" 또는 "ultrawork 없이"
```

### 에이전트 선택적 사용
```
"Strategist만 써서 계획 세워줘"
"Debugger로 이 버그 분석해줘"
"Refactorer로 console.log 다 제거해줘"
```

---

## 문제 해결

### Copilot 에이전트 응답 없음
- Copilot CLI 인증: `copilot /login`
- MCP 서버 재시작: Claude Code 재시작

### LSP 도구 실패
- Serena 프로젝트 활성화 확인
- 지원 언어: TypeScript, Python, Java 등

### ast-grep 패턴 미매칭
- 언어 지정: `-l typescript`
- 패턴 테스트: `ast-grep -p 'PATTERN' --debug-query`

### 병렬 실행 충돌
- 파일 동시 수정 피하기
- Conductor가 순서 조율

---

## 지원 기능 (v4.0)

| 기능 | Full Mode | Lite Mode |
|------|-----------|-----------|
| 11개 전문 에이전트 | ✅ | 7개 (Claude 기반) |
| 병렬 에이전트 | ✅ | ✅ |
| 멀티 LLM | ✅ GPT/Gemini | ❌ Claude only |
| 컨텍스트 공유 | ✅ | N/A |
| LSP 통합 | ✅ | ✅ |
| ast-grep | ✅ | ✅ |
| 더블체크 | ✅ | ⚠️ 제한적 |
| Vision 분석 | ✅ | ✅ |
| 백그라운드 태스크 | ✅ | ✅ |
| TODO 기반 완료 | ✅ | ✅ |

---

*버전: 4.0 | 업데이트: 2026-01-16*
*Copilot CLI + 대화 컨텍스트 공유 + Lite Mode 지원*
