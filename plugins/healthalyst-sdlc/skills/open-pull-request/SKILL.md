---
name: open-pull-request
description: Open a pull request for the current branch into the integration branch, with the repository's template, verification evidence and screenshots. Only a person starts this.
disable-model-invocation: true
argument-hint: "[issue number]"
---

# Open a pull request

Opening a pull request publishes work, so do it only when the person asked.
Never merge it, approve it, or push to a protected branch.

## Steps

1. Confirm the branch is a feature branch, not `main`, `dev` or `staging`,
   and that verification ran (`/healthalyst-sdlc:verify-change`). If it did
   not, run it first.
2. Choose the base: `dev` where it exists, otherwise the repository's
   default branch. A change into `main` only ever comes from `dev`, as its
   own release pull request.
3. Make sure every new or changed screen has a screenshot committed under
   `docs/screenshots/<change-name>/`. If any is missing, take it first.
4. Read the repository's pull request template (`.github/PULL_REQUEST_TEMPLATE.md`,
   or the organisation default) and fill every section from the real work:
   - **Checks run:** the result lines from verification, never a check that
     did not run.
   - **Not checked:** what could not be verified, and why.
   - **Change record:** the `docs/changes/` folder, or "Small fix".
   - **Personal or health data:** tick only if this change handles such data
     in a new way, and link the assessment.
   - **AI assistance:** tick it; the person confirms they understood the
     change before review.
   - **Manual review:** never tick this box; only a person does, after their
     own review. Write the verifier's and security reviewer's findings under
     it, labelled "Claude's self-review", so the person can check them. Until
     the repository has an Anthropic API key, the Claude review check fails
     until the person ticks the box or someone else approves; say so when
     reporting the link.
   - Link the issue with `Closes #<number>` when `$ARGUMENTS` or the branch
     names one.
5. Show the title and body. After the person confirms, push the branch with
   `git push -u origin <branch>` and run
   `gh pr create --base <base> --title "<title>" --body-file <file>`.
   The title follows Conventional Commits, for example
   `feat(health-schedule): triage and vitals`.
6. Report the pull request link. Claude review and the checks run on it; a
   code owner approves and merges.
