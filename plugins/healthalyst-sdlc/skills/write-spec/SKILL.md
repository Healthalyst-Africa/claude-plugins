---
name: write-spec
description: Turn an accepted intent.md into spec.md, the design stage of the HealthAlyst delivery lifecycle, applying the repository's rules and listing conflicts as concerns for a person to decide. Use when a change record has an intent and someone asks for a specification, design, requirements or the next step.
argument-hint: "[change record folder]"
---

# Write a specification

Read the change's `intent.md` and write `spec.md` beside it. The lead
developer accepts it; changes touching authentication, permissions or patient
data also need the owner of that area.

## Steps

1. Find the change folder (`$ARGUMENTS`, or search `docs/changes/`). If
   `intent.md` is not `Accepted`, say so and ask whether to continue.
2. Read the rules that apply: the root `AGENTS.md` and `CLAUDE.md`, the
   nearest application `AGENTS.md`, and the documents in `docs/` that the
   change touches (architecture, authentication, forms, offline, user
   journeys). Read `docs/adrs/` for decisions already made.
3. Read the code the change will sit beside: the feature folder, reusable
   shared components, and the API services it will call. Prefer reuse.
4. If the change needs an API that does not exist, describe the contract the
   client needs and mark it **Backend dependency**. Never present an
   invented endpoint as existing.
5. Write `spec.md` from [spec-template.md](spec-template.md).
6. Under **Concerns**, list every place where the intent conflicts with a
   rule, is ambiguous, or touches authentication, permissions, patient or
   personal data. Name who should decide each one. Do not settle conflicts
   silently.
7. Tell the person the next step: settle the concerns, accept the
   specification, then plan in plan mode with `/healthalyst-sdlc:write-plan`.

## Rules

- Describe behaviour and states, not implementation detail; the plan covers
  files and order of work.
- Every screen lists its loading, empty, error, unauthorised and success
  states.
- Never invent verification outcomes, compliance claims or regulatory
  status.
