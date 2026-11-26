// PreToolUse hook for shell commands: protected branches change only through
// reviewed pull requests, checks are never skipped, Claude never merges, and
// production deploys wait for the release manager. Configured to fail closed.

import { execFileSync } from "node:child_process";

import { blockToolCall, readHookInput } from "./hook-input.mjs";
import { evaluateShellCommand, readProtectedBranches } from "./hook-rules.mjs";

function readCurrentBranch(workingDirectory) {
  try {
    return execFileSync("git", ["branch", "--show-current"], {
      cwd: workingDirectory,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

const hookInput = readHookInput();
const command = hookInput.tool_input?.command;
if (typeof command === "string" && command.trim() !== "") {
  const reason = evaluateShellCommand(command, {
    protectedBranches: readProtectedBranches(process.env),
    currentBranch: readCurrentBranch(hookInput.cwd || process.cwd()),
    releaseApproved: Boolean(process.env.HEALTHALYST_RELEASE_APPROVAL),
  });
  if (reason) blockToolCall(reason);
}
process.exit(0);
