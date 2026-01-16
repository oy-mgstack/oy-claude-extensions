#!/bin/bash
#
# Ultrawork v4.0 Installer
# Claude Code 멀티 에이전트 오케스트레이션 스킬
#
# 설치: curl -fsSL https://raw.githubusercontent.com/oy-mgstack/oy-claude-extensions/main/ultrawork/install.sh | bash
#

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 이모지
CHECK="✅"
CROSS="❌"
WARN="⚠️"
ROCKET="🚀"
GEAR="⚙️"
BOOK="📚"

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC}  ${ROCKET} ${GREEN}Ultrawork v4.0 Installer${NC}                              ${BLUE}║${NC}"
echo -e "${BLUE}║${NC}     멀티 에이전트 오케스트레이션 for Claude Code          ${BLUE}║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# 변수
CLAUDE_DIR="$HOME/.claude"
SKILLS_DIR="$CLAUDE_DIR/skills"
MCP_DIR="$CLAUDE_DIR/mcp-servers"
ULTRAWORK_SKILL_DIR="$SKILLS_DIR/ultrawork"
COPILOT_MCP_DIR="$MCP_DIR/copilot-bridge"
REPO_BASE="https://raw.githubusercontent.com/oy-mgstack/oy-claude-extensions/main/ultrawork"

# 함수: 의존성 체크
check_dependencies() {
    echo -e "${GEAR} 의존성 확인 중..."

    # Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        echo -e "  ${CHECK} Node.js: ${NODE_VERSION}"
    else
        echo -e "  ${CROSS} Node.js: 미설치"
        echo -e "     ${YELLOW}설치 방법: brew install node${NC}"
        exit 1
    fi

    # npm
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm -v)
        echo -e "  ${CHECK} npm: ${NPM_VERSION}"
    else
        echo -e "  ${CROSS} npm: 미설치"
        exit 1
    fi

    # Copilot CLI (선택)
    if command -v copilot &> /dev/null; then
        COPILOT_VERSION=$(copilot --version 2>/dev/null || echo "unknown")
        echo -e "  ${CHECK} Copilot CLI: ${COPILOT_VERSION}"
        COPILOT_AVAILABLE=true
    else
        echo -e "  ${WARN} Copilot CLI: 미설치 ${YELLOW}(Lite Mode로 설치됨)${NC}"
        echo -e "     ${YELLOW}Full Mode 사용을 원하시면: brew install copilot-cli && copilot /login${NC}"
        COPILOT_AVAILABLE=false
    fi

    echo ""
}

# 함수: 디렉토리 생성
create_directories() {
    echo -e "${GEAR} 디렉토리 생성 중..."

    mkdir -p "$SKILLS_DIR"
    mkdir -p "$MCP_DIR"
    mkdir -p "$ULTRAWORK_SKILL_DIR"
    mkdir -p "$COPILOT_MCP_DIR/src/utils"

    echo -e "  ${CHECK} $SKILLS_DIR"
    echo -e "  ${CHECK} $MCP_DIR"
    echo ""
}

# 함수: 스킬 파일 다운로드
download_skill() {
    echo -e "${GEAR} 스킬 파일 다운로드 중..."

    curl -fsSL "$REPO_BASE/skills/ultrawork/SKILL.md" -o "$ULTRAWORK_SKILL_DIR/SKILL.md"

    echo -e "  ${CHECK} SKILL.md"
    echo ""
}

# 함수: MCP 서버 다운로드 및 빌드
setup_mcp_server() {
    echo -e "${GEAR} MCP 서버 설정 중..."

    # 파일 다운로드
    curl -fsSL "$REPO_BASE/mcp-servers/copilot-bridge/package.json" -o "$COPILOT_MCP_DIR/package.json"
    curl -fsSL "$REPO_BASE/mcp-servers/copilot-bridge/tsconfig.json" -o "$COPILOT_MCP_DIR/tsconfig.json"
    curl -fsSL "$REPO_BASE/mcp-servers/copilot-bridge/src/index.ts" -o "$COPILOT_MCP_DIR/src/index.ts"
    curl -fsSL "$REPO_BASE/mcp-servers/copilot-bridge/src/utils/copilot-cli.ts" -o "$COPILOT_MCP_DIR/src/utils/copilot-cli.ts"

    echo -e "  ${CHECK} 소스 파일 다운로드 완료"

    # npm install & build
    echo -e "  ${GEAR} 의존성 설치 중..."
    cd "$COPILOT_MCP_DIR"
    npm install --silent
    echo -e "  ${CHECK} npm install 완료"

    echo -e "  ${GEAR} TypeScript 빌드 중..."
    npm run build --silent
    echo -e "  ${CHECK} 빌드 완료"

    cd - > /dev/null
    echo ""
}

# 함수: Claude Code 설정 업데이트
update_claude_config() {
    echo -e "${GEAR} Claude Code 설정 업데이트 중..."

    CLAUDE_CONFIG="$HOME/.claude.json"

    if [ -f "$CLAUDE_CONFIG" ]; then
        # jq가 있으면 사용, 없으면 수동 안내
        if command -v jq &> /dev/null; then
            # copilot-bridge MCP 서버 추가
            TEMP_CONFIG=$(mktemp)
            jq '.mcpServers["copilot-bridge"] = {
                "type": "stdio",
                "command": "node",
                "args": ["'"$COPILOT_MCP_DIR"'/dist/index.js"]
            }' "$CLAUDE_CONFIG" > "$TEMP_CONFIG"
            mv "$TEMP_CONFIG" "$CLAUDE_CONFIG"
            echo -e "  ${CHECK} MCP 서버 자동 등록 완료"
        else
            echo -e "  ${WARN} jq 미설치 - 수동 설정 필요"
            echo ""
            echo -e "${YELLOW}~/.claude.json의 mcpServers에 다음을 추가하세요:${NC}"
            echo ""
            echo '  "copilot-bridge": {'
            echo '    "type": "stdio",'
            echo '    "command": "node",'
            echo "    \"args\": [\"$COPILOT_MCP_DIR/dist/index.js\"]"
            echo '  }'
            echo ""
        fi
    else
        echo -e "  ${WARN} ~/.claude.json 파일 없음 - 수동 설정 필요"
    fi

    echo ""
}

# 함수: 설치 완료 메시지
print_success() {
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║${NC}  ${CHECK} ${GREEN}Ultrawork v4.0 설치 완료!${NC}                             ${GREEN}║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""

    if [ "$COPILOT_AVAILABLE" = true ]; then
        echo -e "${BOOK} ${GREEN}Full Mode${NC}로 설치되었습니다."
        echo "   - 11개 에이전트 모두 사용 가능"
        echo "   - GPT-5.2, Gemini-3 멀티 모델 지원"
        echo "   - 더블체크, 교차 검증 워크플로우"
    else
        echo -e "${BOOK} ${YELLOW}Lite Mode${NC}로 설치되었습니다."
        echo "   - 7개 Claude 기반 에이전트 사용 가능"
        echo "   - Copilot 도구는 Claude로 대체 실행"
        echo ""
        echo -e "   ${YELLOW}Full Mode 업그레이드:${NC}"
        echo "   brew install copilot-cli && copilot /login"
    fi

    echo ""
    echo -e "${ROCKET} ${GREEN}사용법:${NC}"
    echo '   Claude Code에서 "ulw: 작업 설명" 입력'
    echo ""
    echo -e "${WARN} ${YELLOW}Claude Code를 재시작해주세요!${NC}"
    echo ""
}

# 메인 실행
main() {
    check_dependencies
    create_directories
    download_skill
    setup_mcp_server
    update_claude_config
    print_success
}

main
