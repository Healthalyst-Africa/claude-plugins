---
name: prepare-release
description: Check whether the integration branch is ready to go to production and report what the release contains, its risks and its rollback. Use before merging dev into main, before a production deploy, or when asked whether a release is ready. Changes nothing.
---

# Prepare a release

Produce a readiness report for promoting `dev` to `main` (or `staging` to
`main` where the repository uses one). Read only: do not merge, push, tag or
deploy. The release manager does that.

## Steps

1. Fetch and compare: `git fetch origin`, then
   `git log --oneline origin/main..origin/dev`. List the merged pull
   requests in the range (`gh pr list --base dev --state merged --limit 100`)
   and match them to the commits.
2. For each pull request, confirm:
   - its checks passed (`gh pr checks <number>`);
   - someone other than its author approved it, or the recorded
     administrator bypass was used, and say which;
   - a feature has an accepted change record in `docs/changes/`.
3. Check the latest CI run on `dev` passed
   (`gh run list --branch dev --limit 5`).
4. Look for release risks in `git diff origin/main...origin/dev`:
   - new or renamed environment variables (`.env.example` files, `turbo.json`,
     configuration packages) that production needs before deploy;
   - changes to service worker caching rules, authentication, or API
     contracts that need a backend release first;
   - database or API changes the backend has not deployed yet;
   - new dependencies, and any open Dependabot or code scanning alerts
     (`gh api repos/{owner}/{repo}/code-scanning/alerts?state=open`).
5. Read `docs/incidents/` for anything that applies to this release.
6. Report:
   - **Ready** or **Not ready**, with the reason.
   - **Included changes**, one line each with its pull request.
   - **Before release:** environment variables to set, backend releases to
     wait for, people to tell.
   - **Rollback:** how to return to the previous production version (for a
     Vercel project, promote the previous production deployment; then revert
     the merge on `main` through a pull request).
