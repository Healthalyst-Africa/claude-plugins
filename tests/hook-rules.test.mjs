import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  DEFAULT_PROTECTED_BRANCHES,
  evaluateFileAccess,
  evaluateShellCommand,
  isSensitiveFile,
  readProtectedBranches,
  splitShellCommand,
} from "../plugins/healthalyst-sdlc/hooks/hook-rules.mjs";

const onFeatureBranch = {
  currentBranch: "feat/triage",
  releaseApproved: false,
};
const onDevelopmentBranch = { currentBranch: "dev", releaseApproved: false };

const blocked = (command, context = onFeatureBranch) =>
  assert.ok(
    evaluateShellCommand(command, context),
    `expected to block: ${command}`,
  );
const allowed = (command, context = onFeatureBranch) =>
  assert.equal(
    evaluateShellCommand(command, context),
    null,
    `expected to allow: ${command}`,
  );

describe("isSensitiveFile", () => {
  test("blocks environment files but not their templates", () => {
    for (const filePath of [
      ".env",
      "apps/organization/.env.local",
      "C:\\Users\\PC\\project\\apps\\web\\.env.production.local",
      "/home/runner/work/.env.development",
    ]) {
      assert.equal(isSensitiveFile(filePath), true, filePath);
    }
    for (const filePath of [
      "apps/organization/.env.example",
      ".env.sample",
      ".env.template",
      "src/environment.ts",
      ".envrc.md",
    ]) {
      assert.equal(isSensitiveFile(filePath), false, filePath);
    }
  });

  test("blocks private keys and credential files but not public keys", () => {
    for (const filePath of [
      "certs/server.pem",
      "~/.ssh/id_ed25519",
      "C:\\Users\\PC\\.aws\\credentials",
      ".netrc",
      "signing.key",
    ]) {
      assert.equal(isSensitiveFile(filePath), true, filePath);
    }
    for (const filePath of [
      "~/.ssh/id_ed25519.pub",
      "keyboard.tsx",
      "docs/keys.md",
    ]) {
      assert.equal(isSensitiveFile(filePath), false, filePath);
    }
  });
});

describe("evaluateFileAccess", () => {
  test("blocks Read, Edit, Write and Grep on secret files", () => {
    assert.match(
      evaluateFileAccess({ file_path: "apps/organization/.env.local" }),
      /Blocked/,
    );
    assert.match(evaluateFileAccess({ path: ".env" }), /Blocked/);
    assert.match(
      evaluateFileAccess({ notebook_path: "secrets/server.pem" }),
      /Blocked/,
    );
  });

  test("allows ordinary files and directories", () => {
    assert.equal(
      evaluateFileAccess({ file_path: "apps/organization/.env.example" }),
      null,
    );
    assert.equal(evaluateFileAccess({ path: "apps" }), null);
    assert.equal(evaluateFileAccess({}), null);
  });
});

describe("splitShellCommand", () => {
  test("splits on separators and keeps quoted text together", () => {
    assert.deepEqual(
      splitShellCommand('git commit -m "fix: a; b" && git push'),
      [
        ["git", "commit", "-m", "fix: a; b"],
        ["git", "push"],
      ],
    );
  });
});

describe("reading secrets through the shell", () => {
  test("blocks shell and PowerShell reads of environment files", () => {
    blocked("cat apps/organization/.env.local");
    blocked("Get-Content .env.local");
    blocked("gc C:\\project\\.env");
    blocked("type .env");
    blocked("grep DATABASE_URL .env.production");
    blocked('echo "$(cat .env)"');
    blocked("node script.js < .env.local");
  });

  test("allows working with templates and creating local files from them", () => {
    allowed("cat apps/organization/.env.example");
    allowed(
      "cp -n apps/organization/.env.example apps/organization/.env.local",
    );
    allowed('grep -rn "process.env" apps/organization/src');
  });
});

describe("pushing", () => {
  test("blocks pushes to protected branches", () => {
    blocked("git push origin dev");
    blocked("git push origin main");
    blocked("git push origin HEAD:dev");
    blocked("git push origin feat/triage:refs/heads/main");
    blocked("git push -u origin staging");
    blocked("git -C ../backend push origin main");
    blocked("git push origin --delete dev");
  });

  test("blocks a bare push while on a protected branch", () => {
    blocked("git push", onDevelopmentBranch);
    blocked("git push origin HEAD", onDevelopmentBranch);
  });

  test("blocks force pushes, pushing everything and skipping checks", () => {
    blocked("git push --force origin feat/triage");
    blocked("git push -f");
    blocked("git push -uf origin feat/triage");
    blocked("git push origin +feat/triage");
    blocked("git push --all origin");
    blocked("git push --no-verify");
  });

  test("allows pushing a feature branch, including with a lease", () => {
    allowed("git push -u origin feat/triage");
    allowed("git push");
    allowed("git push --force-with-lease origin feat/triage");
    allowed("git push origin HEAD");
  });

  test("respects configured protected branches", () => {
    const context = {
      ...onFeatureBranch,
      protectedBranches: ["main", "release"],
    };
    blocked("git push origin release", context);
    allowed("git push origin dev", context);
  });
});

describe("committing and merging", () => {
  test("blocks commits that skip checks", () => {
    blocked('git commit --no-verify -m "fix: things"');
    blocked('git commit -nm "fix: things"');
  });

  test("allows ordinary commits whose messages mention anything", () => {
    allowed('git commit -m "docs: explain how to deploy to production"');
    allowed("git commit --amend --no-edit");
  });

  test("Claude never merges pull requests", () => {
    blocked("gh pr merge 42 --merge");
    allowed("gh pr view 42");
    allowed("gh pr create --base dev --fill");
  });
});

describe("production deploys", () => {
  test("blocks production deploys without release approval", () => {
    blocked("vercel --prod");
    blocked("vercel deploy --prebuilt --prod");
    blocked("vercel promote https://example.vercel.app");
    blocked("pnpm run deploy:production");
  });

  test("allows them once the release manager approved", () => {
    allowed("vercel --prod", { ...onFeatureBranch, releaseApproved: true });
  });

  test("allows preview deploys and text that only mentions production", () => {
    allowed("vercel deploy");
    allowed('echo "deploy to production after review"');
    allowed("gh issue create --title 'Deploy production fix'");
  });
});

describe("readProtectedBranches", () => {
  test("reads the plugin option, then the environment, then the default", () => {
    assert.deepEqual(
      readProtectedBranches({
        CLAUDE_PLUGIN_OPTION_PROTECTED_BRANCHES: "main, release",
      }),
      ["main", "release"],
    );
    assert.deepEqual(
      readProtectedBranches({ HEALTHALYST_PROTECTED_BRANCHES: "main" }),
      ["main"],
    );
    assert.deepEqual(readProtectedBranches({}), DEFAULT_PROTECTED_BRANCHES);
  });
});
