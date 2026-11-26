// PreToolUse hook for file tools: keeps environment files, private keys and
// credential files out of Claude's reach. The hook is configured to fail
// closed, so an unreadable input blocks the call rather than allowing it.

import { blockToolCall, readHookInput } from "./hook-input.mjs";
import { evaluateFileAccess } from "./hook-rules.mjs";

const hookInput = readHookInput();
const reason = evaluateFileAccess(hookInput.tool_input ?? {});
if (reason) blockToolCall(reason);
process.exit(0);
