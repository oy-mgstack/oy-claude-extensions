#!/usr/bin/env node
/**
 * Copilot Bridge MCP Server
 * Claude Code에서 Copilot CLI를 통해 멀티 모델(GPT/Claude/Gemini)을 호출
 *
 * [핵심 기능]
 * - 대화 컨텍스트 공유: Claude Code의 문맥을 Copilot에 전달
 * - OOM 방지: 스트리밍 + 버퍼 제한
 * - 멀티 모델: GPT-5.2, Claude Opus 4.5, Gemini 3 등
 *
 * [도구]
 * - copilot_planner: 전략/계획 수립
 * - copilot_writer: 문서 작성
 * - copilot_reasoner: 복잡한 추론
 * - copilot_reviewer: 코드/문서 검토
 * - copilot_debugger: 버그 분석/디버깅
 * - copilot_coder: 코드 생성 (더블체크용)
 * - copilot_translator: 코드 번역/변환
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";

import { askCopilot, checkCopilotAvailable, type CopilotModel } from "./utils/copilot-cli.js";

// MCP 서버 생성
const server = new Server(
  {
    name: "copilot-bridge",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 🔑 공통 컨텍스트 스키마 (모든 도구에 포함)
const conversationContextSchema = {
  type: "string",
  description: `[중요] Claude Code의 현재 대화 컨텍스트를 전달합니다.
예시:
- 현재 작업 중인 기능/파일
- 이전 대화에서 논의된 내용
- 관련 코드 스니펫
- 사용자의 원래 요청

이 컨텍스트가 있으면 Copilot이 전체 맥락을 이해하고 더 정확한 답변을 제공합니다.`,
};

const modelSchema = {
  type: "string",
  enum: ["auto", "gpt-5.2-codex", "gpt-4.1", "claude-opus-4.5", "claude-sonnet-4.5", "gemini-3-pro", "gemini-3-flash"],
  description: "사용할 모델 (기본: gpt-5.2-codex)",
};

// 도구 정의
const tools: Tool[] = [
  {
    name: "copilot_planner",
    description: `Copilot을 활용한 전략/계획 수립 도구입니다.
로드맵, 마일스톤, 프로젝트 계획 등 전략적 사고가 필요한 작업에 적합합니다.
GPT-4o의 창의적 기획 능력을 활용합니다.`,
    inputSchema: {
      type: "object" as const,
      properties: {
        task: {
          type: "string",
          description: "계획을 세울 작업이나 프로젝트 설명",
        },
        context: {
          type: "string",
          description: "추가 컨텍스트 (선택사항)",
        },
        conversationContext: conversationContextSchema,
        model: modelSchema,
      },
      required: ["task"],
    },
  },
  {
    name: "copilot_writer",
    description: `Copilot을 활용한 문서 작성 도구입니다.
README, 사용자 문서, 기술 문서 등 자연스러운 문체가 필요한 문서 작성에 적합합니다.
GPT의 뛰어난 글쓰기 능력을 활용합니다.

[프리셋]
- slack-to-report: 슬랙 대화 → 보고용 문구
- meeting-summary: 회의 내용 → 회의록 요약
- status-update: 진행상황 공유 메시지
- pr-description: PR 설명 초안
- release-note: 릴리즈 노트 작성`,
    inputSchema: {
      type: "object" as const,
      properties: {
        preset: {
          type: "string",
          enum: ["slack-to-report", "meeting-summary", "status-update", "pr-description", "release-note"],
          description: "프리셋 (선택 시 documentType, style 자동 설정)",
        },
        documentType: {
          type: "string",
          description: "문서 유형 (예: README, API 문서, 사용자 가이드). 프리셋 사용 시 생략 가능",
        },
        content: {
          type: "string",
          description: "문서에 포함할 내용이나 요구사항",
        },
        style: {
          type: "string",
          description: "문체 스타일 (예: 공식적, 친근한, 기술적). 프리셋 사용 시 생략 가능",
        },
        conversationContext: conversationContextSchema,
        model: modelSchema,
      },
      required: ["content"],
    },
  },
  {
    name: "copilot_reasoner",
    description: `Copilot을 활용한 복잡한 추론 도구입니다.
논리적 분석, 수학적 추론, 알고리즘 분석 등 깊은 사고가 필요한 작업에 적합합니다.
GPT-o1의 단계별 추론 능력을 활용합니다.`,
    inputSchema: {
      type: "object" as const,
      properties: {
        problem: {
          type: "string",
          description: "분석할 문제나 질문",
        },
        context: {
          type: "string",
          description: "관련 컨텍스트나 제약 조건",
        },
        conversationContext: conversationContextSchema,
        model: modelSchema,
      },
      required: ["problem"],
    },
  },
  {
    name: "copilot_reviewer",
    description: `Copilot을 활용한 코드/문서 검토 도구입니다.
Claude가 작성한 코드나 문서를 Copilot의 다른 관점에서 리뷰합니다.
더블체크 워크플로우에서 교차 검증에 활용됩니다.`,
    inputSchema: {
      type: "object" as const,
      properties: {
        content: {
          type: "string",
          description: "검토할 코드 또는 문서",
        },
        reviewType: {
          type: "string",
          description: "리뷰 유형 (예: 코드 리뷰, 문서 검토, 아키텍처 검토)",
        },
        criteria: {
          type: "string",
          description: "검토 기준이나 중점 사항",
        },
        conversationContext: conversationContextSchema,
        model: modelSchema,
      },
      required: ["content", "reviewType"],
    },
  },
  {
    name: "copilot_debugger",
    description: `Copilot을 활용한 버그 분석/디버깅 도구입니다.
에러 메시지, 스택 트레이스, 버그 증상을 분석하여 원인을 추론합니다.
Claude와 다른 관점에서 버그 원인을 파악하는 더블체크에 활용됩니다.`,
    inputSchema: {
      type: "object" as const,
      properties: {
        errorInfo: {
          type: "string",
          description: "에러 메시지, 스택 트레이스, 또는 버그 증상 설명",
        },
        codeContext: {
          type: "string",
          description: "관련 코드 스니펫 (선택사항)",
        },
        expectedBehavior: {
          type: "string",
          description: "기대했던 동작 (선택사항)",
        },
        conversationContext: conversationContextSchema,
        model: modelSchema,
      },
      required: ["errorInfo"],
    },
  },
  {
    name: "copilot_coder",
    description: `Copilot을 활용한 코드 생성 도구입니다.
Claude가 작성한 코드를 검증하거나, 다른 접근 방식의 코드를 생성합니다.
더블체크 워크플로우에서 교차 검증에 활용됩니다.`,
    inputSchema: {
      type: "object" as const,
      properties: {
        task: {
          type: "string",
          description: "구현할 기능이나 코드 작성 요청",
        },
        language: {
          type: "string",
          description: "프로그래밍 언어 (예: TypeScript, Python, Java)",
        },
        constraints: {
          type: "string",
          description: "제약 조건이나 요구사항 (선택사항)",
        },
        referenceCode: {
          type: "string",
          description: "참고할 기존 코드 (선택사항, 더블체크용)",
        },
        conversationContext: conversationContextSchema,
        model: modelSchema,
      },
      required: ["task", "language"],
    },
  },
  {
    name: "copilot_translator",
    description: `Copilot을 활용한 코드 번역/변환 도구입니다.
한 프로그래밍 언어에서 다른 언어로 코드를 변환합니다.
Python → TypeScript, Java → Kotlin 등 언어 마이그레이션에 활용됩니다.`,
    inputSchema: {
      type: "object" as const,
      properties: {
        sourceCode: {
          type: "string",
          description: "변환할 원본 코드",
        },
        sourceLanguage: {
          type: "string",
          description: "원본 언어 (예: Python, Java)",
        },
        targetLanguage: {
          type: "string",
          description: "대상 언어 (예: TypeScript, Kotlin)",
        },
        preserveComments: {
          type: "boolean",
          description: "주석 유지 여부 (기본: true)",
        },
        conversationContext: conversationContextSchema,
        model: modelSchema,
      },
      required: ["sourceCode", "sourceLanguage", "targetLanguage"],
    },
  },
];

// 도구 목록 핸들러
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// 도구 실행 핸들러
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  // Copilot CLI 사용 가능 여부 확인
  const isAvailable = await checkCopilotAvailable();
  if (!isAvailable) {
    return {
      content: [
        {
          type: "text" as const,
          text: `❌ Copilot CLI를 찾을 수 없습니다.

설치 방법:
\`\`\`bash
brew install copilot-cli
copilot /login
\`\`\``,
        },
      ],
      isError: true,
    };
  }

  try {
    switch (name) {
      case "copilot_planner": {
        const { task, context, conversationContext, model } = args as {
          task: string;
          context?: string;
          conversationContext?: string;
          model?: CopilotModel;
        };

        const prompt = buildPlannerPrompt(task, context);
        const result = await askCopilot({
          prompt,
          model,
          conversationContext,
        });

        return formatResponse("전략가", result);
      }

      case "copilot_writer": {
        const { preset, documentType, content, style, conversationContext, model } = args as {
          preset?: string;
          documentType?: string;
          content: string;
          style?: string;
          conversationContext?: string;
          model?: CopilotModel;
        };

        const prompt = buildWriterPrompt(content, preset, documentType, style);
        const result = await askCopilot({
          prompt,
          model,
          conversationContext,
        });

        return formatResponse("문서가", result);
      }

      case "copilot_reasoner": {
        const { problem, context, conversationContext, model } = args as {
          problem: string;
          context?: string;
          conversationContext?: string;
          model?: CopilotModel;
        };

        const prompt = buildReasonerPrompt(problem, context);
        const result = await askCopilot({
          prompt,
          model,
          conversationContext,
        });

        return formatResponse("분석가", result);
      }

      case "copilot_reviewer": {
        const { content, reviewType, criteria, conversationContext, model } = args as {
          content: string;
          reviewType: string;
          criteria?: string;
          conversationContext?: string;
          model?: CopilotModel;
        };

        const prompt = buildReviewerPrompt(content, reviewType, criteria);
        const result = await askCopilot({
          prompt,
          model,
          conversationContext,
        });

        return formatResponse("검토자", result);
      }

      case "copilot_debugger": {
        const { errorInfo, codeContext, expectedBehavior, conversationContext, model } = args as {
          errorInfo: string;
          codeContext?: string;
          expectedBehavior?: string;
          conversationContext?: string;
          model?: CopilotModel;
        };

        const prompt = buildDebuggerPrompt(errorInfo, codeContext, expectedBehavior);
        const result = await askCopilot({
          prompt,
          model,
          conversationContext,
        });

        return formatResponse("디버거", result);
      }

      case "copilot_coder": {
        const { task, language, constraints, referenceCode, conversationContext, model } = args as {
          task: string;
          language: string;
          constraints?: string;
          referenceCode?: string;
          conversationContext?: string;
          model?: CopilotModel;
        };

        const prompt = buildCoderPrompt(task, language, constraints, referenceCode);
        const result = await askCopilot({
          prompt,
          model,
          conversationContext,
        });

        return formatResponse("코더", result);
      }

      case "copilot_translator": {
        const { sourceCode, sourceLanguage, targetLanguage, preserveComments, conversationContext, model } = args as {
          sourceCode: string;
          sourceLanguage: string;
          targetLanguage: string;
          preserveComments?: boolean;
          conversationContext?: string;
          model?: CopilotModel;
        };

        const prompt = buildTranslatorPrompt(sourceCode, sourceLanguage, targetLanguage, preserveComments);
        const result = await askCopilot({
          prompt,
          model,
          conversationContext,
        });

        return formatResponse("번역기", result);
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text" as const,
          text: `오류 발생: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// 응답 포맷팅
function formatResponse(
  role: string,
  result: { content: string; model: string; success: boolean; error?: string }
) {
  if (!result.success) {
    return {
      content: [
        {
          type: "text" as const,
          text: `❌ Copilot ${role} 오류: ${result.error || "알 수 없는 오류"}`,
        },
      ],
      isError: true,
    };
  }

  return {
    content: [
      {
        type: "text" as const,
        text: `## Copilot ${role} 응답\n\n${result.content}\n\n---\n_모델: ${result.model}_`,
      },
    ],
  };
}

// 프롬프트 빌더 함수들
function buildPlannerPrompt(task: string, context?: string): string {
  return `당신은 전략적 계획 수립 전문가입니다.

## 작업
${task}

${context ? `## 추가 컨텍스트\n${context}\n` : ""}

## 요청 사항
위 작업에 대한 체계적인 계획을 수립해주세요:
1. 목표 정의
2. 단계별 마일스톤
3. 각 단계의 구체적인 작업 항목
4. 예상 리스크와 대응 방안
5. 성공 기준

명확하고 실행 가능한 계획을 제시해주세요.`;
}

// 프리셋 설정
const WRITER_PRESETS: Record<string, { documentType: string; style: string; instructions: string }> = {
  "slack-to-report": {
    documentType: "보고용 메시지",
    style: "공식적, 간결한 업무 보고체",
    instructions: `위 슬랙 대화/메모 내용을 바탕으로 팀장/임원에게 공유할 보고용 메시지를 작성해주세요.

작성 가이드:
1. 핵심 내용만 간결하게 요약
2. 불필요한 대화체/이모지 제거
3. 결론/액션아이템을 명확히
4. 공식적이지만 딱딱하지 않게
5. 한국어 비즈니스 문체 사용`,
  },
  "meeting-summary": {
    documentType: "회의록",
    style: "구조화된 회의록 형식",
    instructions: `위 회의 내용을 바탕으로 회의록을 작성해주세요.

작성 가이드:
1. 참석자, 일시, 안건 정리
2. 논의 내용 요약
3. 결정 사항 명시
4. 액션 아이템 (담당자, 기한)
5. 다음 회의 일정 (있다면)`,
  },
  "status-update": {
    documentType: "진행상황 공유",
    style: "간결한 상태 보고",
    instructions: `위 내용을 바탕으로 진행상황 공유 메시지를 작성해주세요.

작성 가이드:
1. 완료된 작업
2. 진행 중인 작업
3. 이슈/블로커 (있다면)
4. 다음 계획
5. 필요한 지원 (있다면)`,
  },
  "pr-description": {
    documentType: "PR 설명",
    style: "기술적이면서 명확한",
    instructions: `위 내용을 바탕으로 GitHub PR 설명을 작성해주세요.

작성 가이드:
## Summary
- 변경 사항 요약 (1-3줄)

## Changes
- 주요 변경 내용 bullet point

## Test Plan
- 테스트 방법/체크리스트`,
  },
  "release-note": {
    documentType: "릴리즈 노트",
    style: "사용자 친화적",
    instructions: `위 내용을 바탕으로 릴리즈 노트를 작성해주세요.

작성 가이드:
1. 버전 정보
2. 새로운 기능 (New Features)
3. 개선 사항 (Improvements)
4. 버그 수정 (Bug Fixes)
5. 주의 사항 (Breaking Changes, 있다면)`,
  },
};

function buildWriterPrompt(
  content: string,
  preset?: string,
  documentType?: string,
  style?: string
): string {
  // 프리셋이 있으면 프리셋 설정 사용
  if (preset && WRITER_PRESETS[preset]) {
    const presetConfig = WRITER_PRESETS[preset];
    return `당신은 비즈니스 문서 작성 전문가입니다.

## 문서 유형
${presetConfig.documentType}

## 문체 스타일
${presetConfig.style}

## 원본 내용
${content}

## 요청 사항
${presetConfig.instructions}`;
  }

  // 프리셋 없으면 기존 방식
  return `당신은 기술 문서 작성 전문가입니다.

## 문서 유형
${documentType || "일반 문서"}

## 포함할 내용
${content}

${style ? `## 문체 스타일\n${style}\n` : ""}

## 요청 사항
위 내용을 바탕으로 완성도 높은 문서를 작성해주세요.
자연스럽고 읽기 쉬운 문체를 사용하세요.`;
}

function buildReasonerPrompt(problem: string, context?: string): string {
  return `당신은 논리적 분석 전문가입니다.

## 문제
${problem}

${context ? `## 관련 컨텍스트\n${context}\n` : ""}

## 요청 사항
위 문제를 단계별로 분석해주세요:
1. 문제 이해 및 정의
2. 가능한 접근 방법들
3. 각 접근 방법의 장단점
4. 최적의 해결책 도출
5. 결론 및 추천

깊이 있는 논리적 분석을 제공해주세요.`;
}

function buildReviewerPrompt(
  content: string,
  reviewType: string,
  criteria?: string
): string {
  return `당신은 ${reviewType} 전문가입니다.

## 검토 대상
\`\`\`
${content}
\`\`\`

${criteria ? `## 검토 기준\n${criteria}\n` : ""}

## 요청 사항
위 내용을 꼼꼼히 검토해주세요:
1. 전반적인 품질 평가
2. 발견된 문제점이나 개선점
3. 잘된 부분
4. 구체적인 수정 제안
5. 최종 평가

건설적이고 구체적인 피드백을 제공해주세요.`;
}

function buildDebuggerPrompt(
  errorInfo: string,
  codeContext?: string,
  expectedBehavior?: string
): string {
  return `당신은 버그 분석 및 디버깅 전문가입니다.

## 에러 정보
${errorInfo}

${codeContext ? `## 관련 코드\n\`\`\`\n${codeContext}\n\`\`\`\n` : ""}
${expectedBehavior ? `## 기대했던 동작\n${expectedBehavior}\n` : ""}

## 요청 사항
위 버그를 분석해주세요:
1. 에러 메시지/증상 해석
2. 가능한 원인들 (가장 가능성 높은 순)
3. 각 원인에 대한 디버깅 방법
4. 수정 제안
5. 재발 방지를 위한 권장사항

체계적이고 실용적인 분석을 제공해주세요.`;
}

function buildCoderPrompt(
  task: string,
  language: string,
  constraints?: string,
  referenceCode?: string
): string {
  return `당신은 ${language} 코드 작성 전문가입니다.

## 구현 요청
${task}

## 프로그래밍 언어
${language}

${constraints ? `## 제약 조건\n${constraints}\n` : ""}
${referenceCode ? `## 참고 코드 (검증/비교용)\n\`\`\`\n${referenceCode}\n\`\`\`\n` : ""}

## 요청 사항
위 요구사항에 맞는 코드를 작성해주세요:
1. 클린 코드 원칙 준수
2. 적절한 에러 처리
3. 필요한 경우 주석 추가
4. 테스트 가능한 구조

${referenceCode ? "참고 코드가 있다면, 다른 접근 방식이나 개선점도 제안해주세요." : ""}`;
}

function buildTranslatorPrompt(
  sourceCode: string,
  sourceLanguage: string,
  targetLanguage: string,
  preserveComments?: boolean
): string {
  return `당신은 프로그래밍 언어 변환 전문가입니다.

## 원본 코드 (${sourceLanguage})
\`\`\`${sourceLanguage.toLowerCase()}
${sourceCode}
\`\`\`

## 대상 언어
${targetLanguage}

## 요청 사항
위 ${sourceLanguage} 코드를 ${targetLanguage}로 변환해주세요:
1. 언어별 관용적 표현(idiom) 사용
2. ${preserveComments !== false ? "주석 유지 및 번역" : "주석 제거"}
3. 타입 시스템 차이 고려
4. 언어별 베스트 프랙티스 적용

변환된 코드와 함께 주요 변경 사항을 설명해주세요.`;
}

// 서버 시작
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Copilot Bridge MCP server running on stdio");
}

main().catch(console.error);
