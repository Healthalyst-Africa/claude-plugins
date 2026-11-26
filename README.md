# HealthAlyst Claude plugins

The Claude Code plugin marketplace for HealthAlyst Africa's repositories. It
holds one plugin, **healthalyst-sdlc**, which gives every repository the same
AI-native delivery lifecycle, described in the
[engineering handbook](https://github.com/Healthalyst-Africa/.github/tree/main/engineering).

## What the plugin provides

### Skills, by lifecycle stage

| Stage    | Skill                                 | Produces                                                                 |
| -------- | ------------------------------------- | ------------------------------------------------------------------------ |
| Plan     | `/healthalyst-sdlc:write-intent`      | `docs/changes/<issue>-<name>/intent.md`, and the intake issue on request |
| Design   | `/healthalyst-sdlc:write-spec`        | `spec.md`, with concerns listed for a person to decide                   |
| Build    | `/healthalyst-sdlc:write-plan`        | `plan.md`: files, order of work, risks, rejected options, proof          |
| Test     | `/healthalyst-sdlc:verify-change`     | Check results, browser evidence and reviewer verdicts                    |
| Any      | `/healthalyst-sdlc:write-adr`         | `docs/adrs/NNN-title.md` using MADR 4.0                                  |
| Deploy   | `/healthalyst-sdlc:open-pull-request` | A pull request into `dev` with evidence (started by a person only)       |
| Deploy   | `/healthalyst-sdlc:prepare-release`   | A read-only readiness report for `dev` → `main`                          |
| Maintain | `/healthalyst-sdlc:review-incident`   | A blameless review in `docs/incidents/` and what catches it next time    |

Skills read each repository's `AGENTS.md`, `CLAUDE.md` and `REVIEW.md`
instead of hard-coding one repository's rules.

### Agents

- `verifier` checks a finished change against its specification, plan and
  rules with fresh context, and answers Pass or Fail.
- `security-reviewer` reviews a change for security and personal or health
  data handling, read-only.

### Guardrail hooks

These run before every matching tool call, and they block the call if the
hook itself fails:

- **Sensitive files:** `Read`, `Edit`, `Write`, `NotebookEdit` and `Grep`
  never open `.env` files (templates such as `.env.example` are fine),
  private keys or credential files.
- **Shell commands:** `Bash` and `PowerShell` commands may not:
  - read those files;
  - push to `main`, `dev` or `staging`;
  - force-push without a lease, or pass `--no-verify`;
  - merge pull requests;
  - deploy to production unless the release manager set
    `HEALTHALYST_RELEASE_APPROVAL` for the session.

The protected branches can be changed in the plugin's settings
(`protected_branches`).

Hooks and permission rules are the enforcement layer on Windows, where Claude
Code has no sandbox. They complement, and never replace, GitHub rulesets,
secret scanning and code review.

## Install

A repository opts in through its `.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": {
    "healthalyst": {
      "source": {
        "source": "github",
        "repo": "Healthalyst-Africa/claude-plugins"
      }
    }
  },
  "enabledPlugins": { "healthalyst-sdlc@healthalyst": true }
}
```

Each developer then installs the plugin once:

```sh
claude plugin marketplace add Healthalyst-Africa/claude-plugins
claude plugin install healthalyst-sdlc@healthalyst --scope project
```

On a Team or Enterprise plan, an administrator can force the plugin on for
everyone with managed settings instead.

## Developing the plugin

```sh
npm test
claude plugin validate plugins/healthalyst-sdlc --strict
claude --plugin-dir plugins/healthalyst-sdlc
```

- Hook decisions live in `plugins/healthalyst-sdlc/hooks/hook-rules.mjs` as
  pure functions; every rule has allowed and blocked cases in `tests/`.
- Hooks use only Node.js built-ins, so they run anywhere Claude Code runs.
- Follow the HealthAlyst naming rule: complete words, no abbreviations.
- Bump `version` in `plugin.json` and add a `CHANGELOG.md` entry with every
  change. Repositories pick up the new version on their next plugin update.
- Changes to hooks and skills change how every repository's agent behaves:
  they need a pull request reviewed by a code owner, and the repositories'
  agent evals should pass against the new version.
