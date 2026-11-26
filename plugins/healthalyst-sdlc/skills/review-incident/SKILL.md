---
name: review-incident
description: Write a blameless review of a production incident, failed release, CI health alert, security finding or repeated review finding, and add what will catch it next time. Use after something went wrong, or when an incident or ci-health issue needs to feed back into the lifecycle.
argument-hint: "[issue number or description]"
---

# Review an incident

Close the loop so the same failure is caught next time. Blame the system,
never a person.

## Steps

1. If personal or health data may have been exposed, stop and tell the
   person first: the organisation's incident response guide applies and a
   breach must be reported to the Nigeria Data Protection Commission within
   72 hours of discovery. Do not delay that for this review.
2. Gather facts: the issue (`gh issue view $ARGUMENTS`), failing runs
   (`gh run view <id> --log-failed`), the commits and releases involved, and
   what people observed. Read `docs/incidents/` for similar past reviews.
3. Find the cause. Separate what you observed from what you suspect, and
   ask "why" until you reach something the team controls.
4. Write `docs/incidents/<yyyy-mm-dd>-<short-name>.md` from
   [incident-review-template.md](incident-review-template.md), dated when the
   incident started. Add it to the table in `docs/incidents/README.md`.
5. Choose what will catch it next time, the smallest that works, and add it
   in the same change:
   - a test beside the code that failed;
   - a line under **Things Claude gets wrong** in `CLAUDE.md`, if Claude made
     the mistake;
   - a rule in `REVIEW.md`, if review should have caught it;
   - a lint rule or hook, if it must never happen again;
   - an eval in `evals/tasks/`, if it concerns how Claude works.
6. If the fix is small and clear, make it with a failing test first. If it
   needs design, write an intent with `/healthalyst-sdlc:write-intent` and
   stop there.
7. Report the cause, the review file, what now catches it and the next step.

## Rules

- Never put patient records, personal details, credentials or tokens in a
  review, issue or test. Describe data by type, not content.
- Keep timestamps in the 12-hour form the team uses, with the time zone.
