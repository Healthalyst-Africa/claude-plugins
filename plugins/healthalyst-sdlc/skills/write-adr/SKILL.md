---
name: write-adr
description: Record a significant architecture or engineering decision as an architecture decision record in docs/adrs, using MADR 4.0 sections. Use when a decision is hard to reverse, affects several packages, adds a dependency or vendor, touches personal or health data, or when asked to "write an ADR" or "record this decision".
argument-hint: "[decision to record]"
---

# Write an architecture decision record

## Steps

1. Read `docs/adrs/` to find the next number and any related or superseded
   records. File names are `NNN-short-title.md`, three digits, in order.
2. Gather the context from `$ARGUMENTS`, the conversation, the change record
   and the code. Ask who made the decision, if it is not clear.
3. Write the record from [adr-template.md](adr-template.md). List at least
   two considered options, including the one not chosen, with honest pros
   and cons. Fill **Confirmation** with how the decision will be checked: a
   test, a lint rule, a review rule or a CI check.
4. Set `status: proposed`. The record becomes `accepted` when its pull
   request merges; the person merging updates the status.
5. Add the record to the table in `docs/adrs/README.md` if the repository
   keeps one.
6. If it replaces an earlier decision, set the earlier record's status to
   `superseded by NNN` and link both ways. Never rewrite an accepted record.
