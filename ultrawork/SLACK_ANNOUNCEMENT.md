# 슬랙 홍보 메시지

아래 내용을 슬랙에 붙여넣기 하세요:

---

:짠: **Claude Code용 Ultrawork v4.0 만들었습니다!**

복잡한 작업을 Claude에게 시키면 중간에 포기하거나 TODO를 빼먹는 경험 해보셨나요?
이 문제를 해결하기 위한 **멀티 에이전트 오케스트레이션 스킬**을 만들었습니다.

:사각모: **11개 전문 에이전트 활용!**
- Strategist: 전략/계획 수립
- Coder: 코드 구현
- Reviewer: 코드 리뷰
- Debugger: 버그 분석
- Explorer: 파일 탐색 (빠른 Haiku 모델)
- 그 외 6개...

:전구: **이걸 왜 만들었나요?**
- `oh-my-opencode`의 Ultrawork 모드가 좋아서 Claude Code에 포팅
- **Sisyphus 철학**: TODO 완료될 때까지 절대 포기 안함
- 병렬 에이전트 실행으로 복잡한 작업 빠르게 처리
- **더블체크 워크플로우**: Claude가 코드 작성 → GPT가 리뷰

:반짝임: **멀티 LLM 지원 (Copilot 구독 시)**
- GPT-5.2, Gemini-3 등 다양한 모델 활용
- Claude Code 대화 컨텍스트를 다른 모델에 공유!
- Copilot 미구독자도 Lite Mode로 사용 가능 (7개 Claude 에이전트)

:포장: **설치 (원라이너)**
```
curl -fsSL https://raw.githubusercontent.com/oy-mgstack/oy-claude-extensions/main/ultrawork/install.sh | bash
```

:사용법: **사용법**
```
ulw: 인증 시스템 구현해줘
ultrawork: 이 5개 버그 전부 수정해줘
끝까지 해줘: 테스트 코드 다 작성해줘
```

:링크: GitHub: https://github.com/oy-mgstack/oy-claude-extensions/tree/main/ultrawork

:경고: **제약사항**
- Full Mode: Copilot 구독 필요 ($10/월)
- Lite Mode: Copilot 없이도 사용 가능 (7개 Claude 에이전트)

궁금한 점 있으시면 DM 주세요! :손흔들기:

---

# 스레드용 상세 설명

**Q: Copilot 구독 안 해도 되나요?**
A: 네! Lite Mode로 7개 Claude 기반 에이전트(Architect, Coder, Debugger, Explorer, Refactorer, Inspector, Conductor)는 그대로 사용 가능합니다.
Full Mode(GPT/Gemini 연동, 더블체크)를 원하시면 Copilot 구독이 필요해요.

**Q: 기존에 쓰던 스킬이랑 충돌하나요?**
A: 아니요. `ulw` 키워드로만 활성화되니 평소에는 영향 없습니다.

**Q: Sisyphus 철학이 뭔가요?**
A: "끝없이 굴러떨어지는 바위를 다시 밀어올리는" 신화에서 따왔어요.
에러나도 포기 안 하고, TODO 남아있으면 계속 작업합니다!

**Q: 어떤 상황에서 쓰면 좋나요?**
- 5개 이상의 버그를 한 번에 수정할 때
- 새 기능을 처음부터 끝까지 구현할 때
- 레거시 코드 대규모 리팩토링할 때
- "이거 다 해줘" 류의 광범위한 요청할 때
