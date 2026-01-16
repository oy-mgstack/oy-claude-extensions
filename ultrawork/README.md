# Ultrawork v4.0

> **멀티 에이전트 오케스트레이션** for Claude Code

Copilot CLI 기반 11개 전문 에이전트 시스템. GPT-5.2, Claude, Gemini를 조합하여 복잡한 작업을 병렬로 처리합니다.

![Version](https://img.shields.io/badge/version-4.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 설치

### 원라이너 설치

```bash
curl -fsSL https://raw.githubusercontent.com/oy-mgstack/oy-claude-extensions/main/ultrawork/install.sh | bash
```

### 수동 설치

```bash
git clone https://github.com/oy-mgstack/oy-claude-extensions.git
cd oy-claude-extensions/ultrawork
./install.sh
```

## 요구사항

### 필수
- **Node.js** 18+
- **Claude Code** CLI

### 선택 (Full Mode)
- **Copilot CLI** (`brew install copilot-cli`)
- **GitHub Copilot 구독** ($10/월 또는 Pro/Enterprise)

> **Copilot 없이도 사용 가능!** Lite Mode로 7개 Claude 기반 에이전트 사용

## 사용법

Claude Code에서 다음 키워드로 활성화:

```
ulw: 인증 시스템 구현해줘
ultrawork: 이 모듈 리팩토링해줘
끝까지 해줘: 5개 버그 전부 수정
```

## 11개 전문 에이전트

### 기획 그룹 (Copilot 기반)
| 에이전트 | 역할 | Full Mode | Lite Mode |
|----------|------|-----------|-----------|
| **Strategist** | 전략/계획 수립 | GPT-5.2 | Claude Task(Plan) |
| **Reviewer** | 코드/문서 리뷰 | GPT-5.2 | Claude 직접 |
| **Analyst** | 심층 분석/추론 | GPT-5.2 | Claude 직접 |
| **DocWriter** | 문서 작성 | GPT-5.2 | Claude 직접 |

### 실행 그룹 (Claude 기반)
| 에이전트 | 역할 | 모델 |
|----------|------|------|
| **Architect** | 아키텍처 설계 | Opus |
| **Debugger** | 버그 분석/수정 | Sonnet |
| **Coder** | 코드 구현 | Sonnet |
| **Explorer** | 파일/패턴 검색 | Haiku |

### 지원 그룹
| 에이전트 | 역할 | 도구 |
|----------|------|------|
| **Refactorer** | AST 기반 리팩토링 | ast-grep + Serena |
| **Inspector** | UI/스크린샷 분석 | Puppeteer Vision |
| **Conductor** | 전체 조율 (PM) | Main Agent |

## Full Mode vs Lite Mode

| 기능 | Full Mode | Lite Mode |
|------|-----------|-----------|
| 에이전트 수 | 11개 | 7개 (Claude 기반) |
| 멀티 LLM | ✅ GPT + Gemini + Claude | ❌ Claude only |
| 더블체크 | ✅ 교차 검증 | ⚠️ 제한적 |
| 병렬 실행 | ✅ | ✅ |
| LSP 통합 | ✅ | ✅ |
| TODO 완료 강제 | ✅ | ✅ |

### Full Mode 활성화

```bash
# Copilot CLI 설치
brew install copilot-cli

# 로그인 (GitHub 인증)
copilot /login
```

## 핵심 철학: Sisyphus Mode

> "Sisyphus처럼 끝없이 굴러떨어지는 바위를 다시 밀어올린다"

1. **절대 포기하지 않음**: 에러가 나도 다른 접근법 시도
2. **TODO 완료 강제**: 모든 TODO가 completed될 때까지 작업 계속
3. **병렬 활용 최대화**: 독립적인 작업은 동시에 실행
4. **멀티 LLM 활용**: Claude + GPT + Gemini 조합
5. **컨텍스트 공유**: 대화 문맥을 다른 모델에 전달

## 워크플로우 예시

### 복잡한 기능 구현

```
=== Phase 1: 전략 수립 (병렬) ===
[Strategist] 로드맵 수립
[Analyst] 요구사항 분석
[Explorer] 기존 코드 탐색

=== Phase 2: 설계 ===
[Architect] 아키텍처 설계
[Reviewer] 설계 검토

=== Phase 3: 구현 (병렬) ===
[Coder] 핵심 로직 구현
[Coder] API 엔드포인트 구현
[DocWriter] API 문서 초안

=== Phase 4: 검증 ===
[Reviewer] 코드 리뷰 (더블체크)
[Debugger] 잠재적 버그 분석
[Conductor] 최종 통합
```

### 더블체크 패턴 (Full Mode)

```
Claude가 코드 작성 → GPT Reviewer가 검토
Copilot Writer가 문서 작성 → Claude가 기술 검토
Claude가 아키텍처 설계 → GPT Analyst가 분석 → 통합
```

## 제거

```bash
curl -fsSL https://raw.githubusercontent.com/oy-mgstack/oy-claude-extensions/main/ultrawork/uninstall.sh | bash
```

## 문제 해결

### Copilot 응답 없음
```bash
# 인증 상태 확인
copilot /login

# Claude Code 재시작
```

### MCP 서버 연결 실패
```bash
# 빌드 확인
cd ~/.claude/mcp-servers/copilot-bridge
npm run build

# Claude Code 재시작
```

## 기여

1. Fork this repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 라이선스

MIT License

## 크레딧

- 원작: [Oh My OpenCode](https://github.com/anthropics/opencode) Ultrawork 모드
- Copilot Edition: [@oy-mgstack](https://github.com/oy-mgstack)

---

*Made with ❤️ for Claude Code users*
