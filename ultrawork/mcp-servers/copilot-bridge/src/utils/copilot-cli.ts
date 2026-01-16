/**
 * Copilot CLI Wrapper
 * Claude Code에서 Copilot CLI를 호출하여 멀티 모델(GPT/Claude/Gemini) 사용
 *
 * [OOM 방지 패턴 적용]
 * - Codex MCP의 OOM 버그에서 학습
 * - 스트리밍으로 응답 수신, 버퍼 크기 제한
 * - 최종 응답만 저장
 *
 * [핵심 기능]
 * - 대화 컨텍스트를 Copilot에 전달하여 문맥 파악
 * - 모델 선택 지원 (gpt-5.2, claude-opus-4.5, gemini-3-flash 등)
 */

import { spawn, ChildProcess } from "child_process";
import { Readable } from "stream";

// 지원 모델 목록
export type CopilotModel =
  | "auto"
  | "gpt-5.2-codex"
  | "gpt-4.1"
  | "claude-opus-4.5"
  | "claude-sonnet-4.5"
  | "gemini-3-pro"
  | "gemini-3-flash";

export interface CopilotRequest {
  prompt: string;
  model?: CopilotModel;
  conversationContext?: string;  // 🔑 Claude Code 대화 컨텍스트
}

export interface CopilotResponse {
  content: string;
  model: string;
  success: boolean;
  error?: string;
}

// 기본 설정
const DEFAULT_MODEL: CopilotModel = "gpt-5.2-codex";
const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000; // 10분 (긴 reasoning 고려)
const MAX_OUTPUT_SIZE = 1024 * 1024; // 1MB 최대 출력 (OOM 방지)

/**
 * Copilot CLI로 질의 (OOM 방지 스트리밍 버전)
 *
 * @param request - 요청 객체 (prompt, model, conversationContext)
 * @param timeoutMs - 타임아웃 (기본 10분)
 */
export async function askCopilot(
  request: CopilotRequest,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<CopilotResponse> {
  const model = request.model || DEFAULT_MODEL;

  // 대화 컨텍스트를 포함한 전체 프롬프트 구성
  const fullPrompt = buildFullPrompt(request.prompt, request.conversationContext);

  // -p 옵션으로 비대화형 모드 실행
  const args = buildCopilotArgs(model, fullPrompt);

  return new Promise((resolve) => {
    let outputBuffer = "";
    let errorBuffer = "";
    let outputSize = 0;
    let resolved = false;

    // 타임아웃 설정
    const timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        copilotProcess.kill("SIGTERM");
        resolve({
          content: "",
          model,
          success: false,
          error: `타임아웃 (${timeoutMs / 1000}초 초과)`,
        });
      }
    }, timeoutMs);

    // Copilot CLI 프로세스 시작 (-p 옵션으로 비대화형)
    const copilotProcess: ChildProcess = spawn("copilot", args, {
      stdio: ["ignore", "pipe", "pipe"],  // stdin 불필요
      env: {
        ...process.env,
        // 색상 출력 비활성화 (파싱 용이)
        NO_COLOR: "1",
        FORCE_COLOR: "0",
      },
    });

    // 🔥 스트리밍으로 stdout 읽기 (OOM 방지)
    if (copilotProcess.stdout) {
      copilotProcess.stdout.on("data", (chunk: Buffer) => {
        const chunkStr = chunk.toString();
        outputSize += chunk.length;

        // OOM 방지: 최대 크기 초과 시 중단
        if (outputSize > MAX_OUTPUT_SIZE) {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeoutId);
            copilotProcess.kill("SIGTERM");
            resolve({
              content: outputBuffer,
              model,
              success: false,
              error: `출력 크기 초과 (${MAX_OUTPUT_SIZE / 1024}KB 제한)`,
            });
          }
          return;
        }

        outputBuffer += chunkStr;
      });
    }

    // stderr 캡처
    if (copilotProcess.stderr) {
      copilotProcess.stderr.on("data", (chunk: Buffer) => {
        errorBuffer += chunk.toString();
      });
    }

    // 프로세스 종료 처리
    copilotProcess.on("close", (code) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeoutId);

        if (code === 0) {
          // 성공: 응답 파싱
          const content = parseResponse(outputBuffer);
          resolve({
            content,
            model,
            success: true,
          });
        } else {
          // 실패
          resolve({
            content: outputBuffer,
            model,
            success: false,
            error: errorBuffer || `프로세스 종료 코드: ${code}`,
          });
        }
      }
    });

    // 프로세스 에러 처리
    copilotProcess.on("error", (err) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeoutId);
        resolve({
          content: "",
          model,
          success: false,
          error: `프로세스 실행 실패: ${err.message}`,
        });
      }
    });
  });
}

/**
 * 대화 컨텍스트를 포함한 전체 프롬프트 구성
 *
 * 🔑 핵심: Claude Code의 대화 문맥을 Copilot에 전달
 */
function buildFullPrompt(prompt: string, conversationContext?: string): string {
  if (!conversationContext) {
    return prompt;
  }

  return `## 배경 컨텍스트 (Claude Code 대화에서 전달됨)
${conversationContext}

---

## 현재 요청
${prompt}

---

위 배경 컨텍스트를 참고하여 현재 요청에 답변해주세요.`;
}

/**
 * Copilot CLI 인자 구성
 *
 * @param model - 사용할 모델
 * @param prompt - 전체 프롬프트 (컨텍스트 포함)
 */
function buildCopilotArgs(model: CopilotModel, prompt: string): string[] {
  const args: string[] = [];

  // 모델 지정 (auto가 아닌 경우)
  if (model !== "auto") {
    args.push("--model", model);
  }

  // 🔑 핵심: -p 옵션으로 비대화형 모드 실행
  args.push("-p", prompt);

  return args;
}

/**
 * Copilot CLI 응답 파싱
 * 불필요한 ANSI 코드, 프롬프트 등 제거
 */
function parseResponse(rawOutput: string): string {
  // ANSI 이스케이프 코드 제거
  let cleaned = rawOutput.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, "");

  // Copilot CLI 프롬프트/장식 제거
  cleaned = cleaned
    .replace(/^.*Welcome to GitHub.*$/gm, "")
    .replace(/^.*COPILOT.*$/gm, "")
    .replace(/^.*CLI Version.*$/gm, "")
    .replace(/^>\s*/gm, "")
    .replace(/^─+$/gm, "")
    .trim();

  return cleaned;
}

/**
 * Copilot CLI 사용 가능 여부 확인
 */
export async function checkCopilotAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const process = spawn("copilot", ["--version"], {
      stdio: ["ignore", "pipe", "ignore"],
    });

    process.on("close", (code) => {
      resolve(code === 0);
    });

    process.on("error", () => {
      resolve(false);
    });

    // 5초 타임아웃
    setTimeout(() => {
      process.kill();
      resolve(false);
    }, 5000);
  });
}
