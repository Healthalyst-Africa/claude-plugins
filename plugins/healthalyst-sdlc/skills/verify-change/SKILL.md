---
name: verify-change
description: Prove a change works before calling it done, the test stage of the HealthAlyst delivery lifecycle. Use after implementing anything, before opening a pull request, or when asked to verify, test or check work.
---

# Verify a change

Claude checks its own work before a person sees it. Report only what you
actually ran.

## Steps

1. List what changed: `git status --short` and `git diff --stat`, against
   the integration branch when on a feature branch. Work out which
   applications and packages are affected.
2. Read the **Verifying your work** section of the repository's `CLAUDE.md`.
   Run its narrowest checks for each affected workspace first, then the full
   gate it names. Fix failures in the code. Never weaken a test, lint rule or
   type to make a check pass.
3. For a bug fix, confirm the test written for the bug failed before the fix
   and passes now, and that it was not changed after it first failed.
4. For any interface change, start the development server, open each changed
   screen at desktop and mobile widths, exercise its loading, empty, error
   and success states and its keyboard focus, and read the browser console
   and network requests for errors. Save a screenshot of each new or changed
   screen where `CLAUDE.md` says.
5. Ask the `verifier` agent for a fresh-context check, giving it the change
   record folder (or a description of the change). Fix what it confirms and
   run the affected checks again.
6. For changes touching authentication, permissions, uploads, external input
   or personal data, also ask the `security-reviewer` agent.
7. Report in this shape:
   - **Ran:** each command and its result line.
   - **Browser:** each screen checked, the widths, and screenshot paths.
   - **Reviewers:** the verifier's and security reviewer's verdicts.
   - **Not verified:** anything you could not run, and why.
