// Decision rules for the HealthAlyst guardrail hooks. Pure functions only, so
// every rule can be tested without Claude Code. Each rule returns null to
// allow the tool call, or a reason to block it that also tells Claude the
// approved route.

export const DEFAULT_PROTECTED_BRANCHES = ["main", "dev", "staging"];

const ENVIRONMENT_FILE_PATTERN = /^\.env(\..+)?$/i;
const ENVIRONMENT_TEMPLATE_PATTERN = /^\.env\.(example|sample|template)$/i;
const PRIVATE_KEY_PATTERN = /\.(pem|key|p12|pfx|keystore|jks)$/i;
const SECURE_SHELL_KEY_PATTERN = /^id_(rsa|dsa|ecdsa|ed25519)$/i;
const CREDENTIAL_FILE_NAMES = new Set([
  ".netrc",
  ".pgpass",
  ".git-credentials",
]);

export function normalisePath(filePath) {
  return String(filePath ?? "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .replaceAll("\\", "/");
}

export function baseName(filePath) {
  return normalisePath(filePath).split("/").pop() ?? "";
}

export function isSensitiveFile(filePath) {
  const normalisedPath = normalisePath(filePath);
  const fileName = baseName(normalisedPath);
  if (!fileName) return false;
  if (ENVIRONMENT_FILE_PATTERN.test(fileName)) {
    return !ENVIRONMENT_TEMPLATE_PATTERN.test(fileName);
  }
  if (PRIVATE_KEY_PATTERN.test(fileName)) return true;
  if (SECURE_SHELL_KEY_PATTERN.test(fileName)) return true;
  if (CREDENTIAL_FILE_NAMES.has(fileName.toLowerCase())) return true;
  return /(^|\/)\.aws\/credentials$/i.test(normalisedPath);
}

export function evaluateFileAccess(toolInput) {
  const candidatePaths = [
    toolInput?.file_path,
    toolInput?.notebook_path,
    toolInput?.path,
  ];
  const sensitivePath = candidatePaths.find(
    (candidatePath) =>
      typeof candidatePath === "string" && isSensitiveFile(candidatePath),
  );
  if (!sensitivePath) return null;
  return `Blocked: ${baseName(sensitivePath)} may hold secrets or private keys. Read the matching .env.example for variable names, or ask the person for the value you need.`;
}

// Splits a shell command into simple commands on ;, &&, ||, | and newlines,
// then into words, keeping quoted text together.
export function splitShellCommand(command) {
  const segments = [];
  let words = [];
  let currentWord = "";
  let quote = null;
  const finishWord = () => {
    if (currentWord !== "") words.push(currentWord);
    currentWord = "";
  };
  const finishSegment = () => {
    finishWord();
    if (words.length > 0) segments.push(words);
    words = [];
  };

  for (
    let characterIndex = 0;
    characterIndex < command.length;
    characterIndex += 1
  ) {
    const character = command[characterIndex];
    if (quote) {
      if (character === quote) quote = null;
      else currentWord += character;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
    } else if (
      character === ";" ||
      character === "\n" ||
      character === "|" ||
      character === "&"
    ) {
      finishSegment();
    } else if (/\s/.test(character)) {
      finishWord();
    } else {
      currentWord += character;
    }
  }
  finishSegment();
  return segments;
}

const FILE_READING_COMMANDS = new Set([
  "cat",
  "less",
  "more",
  "head",
  "tail",
  "type",
  "get-content",
  "gc",
  "sed",
  "awk",
  "grep",
  "rg",
  "findstr",
  "select-string",
  "sls",
  "strings",
  "xxd",
  "od",
  "base64",
  "source",
  ".",
  "bat",
  "nl",
]);

function commandName(words) {
  const firstWord =
    words.find((word) => !/^[A-Za-z_][A-Za-z0-9_]*=/.test(word)) ?? "";
  return baseName(firstWord)
    .toLowerCase()
    .replace(/\.exe$/, "");
}

function findGitSubcommand(words) {
  if (commandName(words) !== "git") return null;
  const gitIndex = words.findIndex(
    (word) =>
      baseName(word)
        .toLowerCase()
        .replace(/\.exe$/, "") === "git",
  );
  let wordIndex = gitIndex + 1;
  while (wordIndex < words.length && words[wordIndex].startsWith("-")) {
    // Options such as -C <directory> and -c <name=value> take a value.
    if (["-C", "-c", "--git-dir", "--work-tree"].includes(words[wordIndex]))
      wordIndex += 1;
    wordIndex += 1;
  }
  if (wordIndex >= words.length) return null;
  return {
    subcommand: words[wordIndex],
    subcommandArguments: words.slice(wordIndex + 1),
  };
}

function evaluatePush(pushArguments, protectedBranches, currentBranch) {
  const pullRequestRoute =
    "Push a feature branch and open a pull request into dev with /healthalyst-sdlc:open-pull-request.";
  if (pushArguments.includes("--no-verify")) {
    return "Blocked: --no-verify skips the repository's checks. Fix what the check reports instead.";
  }
  if (
    pushArguments.some(
      (argument) =>
        argument === "--force" ||
        argument === "-f" ||
        /^-[a-z]*f[a-z]*$/.test(argument),
    )
  ) {
    return "Blocked: a plain force push can destroy other people's work. Use --force-with-lease on your own feature branch.";
  }
  if (
    pushArguments.some(
      (argument) => argument === "--all" || argument === "--mirror",
    )
  ) {
    return `Blocked: pushing every branch would update protected branches. ${pullRequestRoute}`;
  }

  const positionalArguments = [];
  for (
    let argumentIndex = 0;
    argumentIndex < pushArguments.length;
    argumentIndex += 1
  ) {
    const argument = pushArguments[argumentIndex];
    if (
      ["-o", "--push-option", "--repo", "--receive-pack", "--exec"].includes(
        argument,
      )
    ) {
      argumentIndex += 1;
      continue;
    }
    if (!argument.startsWith("-")) positionalArguments.push(argument);
  }
  const refspecs = positionalArguments.slice(1);
  if (refspecs.some((refspec) => refspec.startsWith("+"))) {
    return "Blocked: a + refspec is a force push. Use --force-with-lease on your own feature branch.";
  }

  const deletes =
    pushArguments.includes("--delete") || pushArguments.includes("-d");
  const destinations =
    refspecs.length === 0
      ? [currentBranch]
      : refspecs.map((refspec) => {
          const destination = deletes
            ? refspec
            : (refspec.split(":").pop() ?? refspec);
          const branch = destination.replace(/^refs\/heads\//, "");
          return branch === "HEAD" || branch === "" ? currentBranch : branch;
        });
  const protectedDestination = destinations.find((branch) =>
    protectedBranches.includes(branch),
  );
  if (protectedDestination) {
    return `Blocked: ${protectedDestination} only changes through a reviewed pull request. ${pullRequestRoute}`;
  }
  return null;
}

const PRODUCTION_DEPLOY_PATTERNS = [
  /\bvercel\b.*\s--prod(uction)?\b/i,
  /\bvercel\s+promote\b/i,
  /\bdeploy\b.*\bprod(uction)?\b/i,
  /\b(railway|render|fly|flyctl)\b.*\b(prod|production)\b/i,
];

// Commands whose arguments are text rather than actions, such as a commit
// message that mentions "deploy to production".
const TEXT_COMMANDS = new Set([
  "git",
  "gh",
  "echo",
  "printf",
  "write-output",
  "write-host",
]);

// Strips shell punctuation that can sit on a file name: $(cat .env), <.env.
function cleanWord(word) {
  return word.replace(/^[<>`$(]+/, "").replace(/[)`]+$/, "");
}

export function evaluateShellCommand(command, context) {
  const protectedBranches =
    context.protectedBranches ?? DEFAULT_PROTECTED_BRANCHES;
  const commandText = String(command ?? "");
  // Command substitutions such as "$(cat .env)" run even inside double
  // quotes, so check them as commands of their own as well.
  const substitutions = [
    ...commandText.matchAll(/\$\(([^()]*)\)|`([^`]*)`/g),
  ].map((match) => match[1] ?? match[2]);
  const segments = [commandText, ...substitutions].flatMap(splitShellCommand);
  const readsFiles =
    /[<]/.test(commandText) ||
    segments.some((words) =>
      words.some((word) =>
        FILE_READING_COMMANDS.has(
          baseName(cleanWord(word))
            .toLowerCase()
            .replace(/\.exe$/, ""),
        ),
      ),
    );

  for (const words of segments) {
    const name = commandName(words);

    if (readsFiles) {
      const sensitiveWord = words
        .map(cleanWord)
        .find((word) => !word.startsWith("-") && isSensitiveFile(word));
      if (sensitiveWord) {
        return `Blocked: ${baseName(sensitiveWord)} may hold secrets or private keys. Read the matching .env.example for variable names, or ask the person for the value you need.`;
      }
    }

    const gitCommand = findGitSubcommand(words);
    if (gitCommand?.subcommand === "commit") {
      const skipsChecks = gitCommand.subcommandArguments.some(
        (argument) =>
          argument === "--no-verify" || /^-[a-zA-Z]*n[a-zA-Z]*$/.test(argument),
      );
      if (skipsChecks) {
        return "Blocked: --no-verify skips the repository's commit checks. Fix what the check reports instead.";
      }
    }
    if (gitCommand?.subcommand === "push") {
      const reason = evaluatePush(
        gitCommand.subcommandArguments,
        protectedBranches,
        context.currentBranch ?? "",
      );
      if (reason) return reason;
    }

    if (name === "gh" && words[1] === "pr" && words[2] === "merge") {
      return "Blocked: Claude never merges pull requests. A code owner approves and merges.";
    }

    const segmentText = words.join(" ");
    if (
      !context.releaseApproved &&
      !TEXT_COMMANDS.has(name) &&
      PRODUCTION_DEPLOY_PATTERNS.some((pattern) => pattern.test(segmentText))
    ) {
      return "Blocked: production deploys need the release manager's approval. Run /healthalyst-sdlc:prepare-release, then ask the release manager to start the session with HEALTHALYST_RELEASE_APPROVAL set.";
    }
  }
  return null;
}

export function readProtectedBranches(environment) {
  const configured =
    environment.CLAUDE_PLUGIN_OPTION_PROTECTED_BRANCHES ??
    environment.HEALTHALYST_PROTECTED_BRANCHES;
  if (!configured || configured.trim() === "")
    return DEFAULT_PROTECTED_BRANCHES;
  return configured
    .split(",")
    .map((branch) => branch.trim())
    .filter(Boolean);
}
