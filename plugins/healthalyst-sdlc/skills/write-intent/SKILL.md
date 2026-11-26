---
name: write-intent
description: Capture a new idea, request, bug pattern or incident as intent.md, the first stage of the HealthAlyst delivery lifecycle. Use when someone describes a feature, problem or change they want and no change record exists for it yet, or asks to "write an intent", "capture this idea" or "start a change".
argument-hint: "[idea, issue link or incident]"
---

# Write an intent

Turn the request into an `intent.md`: the problem and the outcome in the
originator's own words. It is a proto-specification, not a design.

## Steps

1. Read what you were given: `$ARGUMENTS`, a linked issue
   (`gh issue view <number>`) or an incident review. Search `docs/changes/`
   for an existing record on the same topic and `docs/incidents/` for related
   history. If one exists, update it instead of starting another.
2. Ask only what the repository cannot tell you: who has the problem, what
   outcome they want, and any deadline, approval or constraint. Ask in one
   message, at most five questions.
3. Draft `intent.md` from [intent-template.md](intent-template.md). Keep the
   originator's wording for the problem. Do not propose screens, components,
   endpoints or code.
4. Show the draft. Once the person confirms it, offer to open the intake
   issue. Open it only if they say yes:
   `gh issue create --title "<title>" --body-file <draft> --label change-request`.
   Create the `change-request` label first if it does not exist.
5. Save the record as `docs/changes/<issue-number>-<short-name>/intent.md`.
   Without an issue, use `docs/changes/draft-<short-name>/intent.md` and
   rename the folder when the issue exists.
6. Tell the person the next step: the product owner accepts the intent by
   merging it or changing its status to `Accepted`, then
   `/healthalyst-sdlc:write-spec`.

## Rules

- Never write patient records, personal details, credentials or tokens into
  the intent or the issue. Describe data by type ("appointment times"), never
  by content.
- Mark anything that touches personal or health data in **Constraints**; the
  specification must then consider a data protection impact assessment.
