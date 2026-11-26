// Reads a hook's JSON input from standard input. Claude Code sends one JSON
// object per call; see https://code.claude.com/docs/en/hooks.

import { readFileSync } from "node:fs";

export function readHookInput() {
  const text = readFileSync(0, "utf8");
  return text.trim() === "" ? {} : JSON.parse(text);
}

// Exit code 2 blocks a PreToolUse call and shows the reason to Claude.
export function blockToolCall(reason) {
  process.stderr.write(`${reason}\n`);
  process.exit(2);
}
