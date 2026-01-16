#!/bin/bash
#
# Ultrawork v4.0 Uninstaller
#

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

echo ""
echo -e "${RED}Ultrawork v4.0 제거 중...${NC}"
echo ""

# 스킬 제거
if [ -d "$HOME/.claude/skills/ultrawork" ]; then
    rm -rf "$HOME/.claude/skills/ultrawork"
    echo "✅ 스킬 제거 완료"
fi

# MCP 서버 제거
if [ -d "$HOME/.claude/mcp-servers/copilot-bridge" ]; then
    rm -rf "$HOME/.claude/mcp-servers/copilot-bridge"
    echo "✅ MCP 서버 제거 완료"
fi

# 설정에서 제거 (jq 필요)
if command -v jq &> /dev/null && [ -f "$HOME/.claude.json" ]; then
    TEMP_CONFIG=$(mktemp)
    jq 'del(.mcpServers["copilot-bridge"])' "$HOME/.claude.json" > "$TEMP_CONFIG"
    mv "$TEMP_CONFIG" "$HOME/.claude.json"
    echo "✅ 설정에서 MCP 서버 제거 완료"
else
    echo "⚠️  ~/.claude.json에서 copilot-bridge 항목을 수동으로 제거해주세요"
fi

echo ""
echo -e "${GREEN}Ultrawork v4.0 제거 완료!${NC}"
echo "Claude Code를 재시작해주세요."
echo ""
