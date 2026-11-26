---
name: write-plan
description: Write plan.md before any code is written, the build-planning stage of the HealthAlyst delivery lifecycle. Use in plan mode when a specification is accepted, or when someone asks to plan an implementation, a feature or a substantial fix.
argument-hint: "[change record folder or issue]"
---

# Write an implementation plan

Nothing is built without an accepted plan. Stay read-only until the
developer accepts it; use plan mode (Shift+Tab) when it is available.

## Steps

1. Read the change's `spec.md` and `intent.md`. For a fix with no change
   record, read the issue or the description in `$ARGUMENTS` and create the
   folder `docs/changes/<issue-number>-<short-name>/`.
2. Read every file the change will touch and the tests around them. Look for
   shared components, hooks, services and utilities to reuse.
3. Write `plan.md` from [plan-template.md](plan-template.md). Name real files.
   Order the work so each step can be checked on its own.
4. Give every step its proof: the test that fails before and passes after,
   the command to run, or the screen to capture.
5. Before presenting it, answer: what could break, which step is riskiest,
   and which alternative you rejected and why. Put the answers in the plan.
6. The plan is ready when someone who never saw this conversation could
   build from it. Present it and wait for acceptance.
7. While building: if the work departs from the plan, update `plan.md` in
   the same commit as the code.

## Rules

- Split work by the files it touches. Independent parts can run in parallel
  sessions, each in its own worktree; parts that share files run in order.
- A bug fix starts with a failing test that shows the bug.
