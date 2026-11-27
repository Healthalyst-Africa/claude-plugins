# Changelog

All notable changes to the healthalyst-sdlc plugin. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the plugin uses
[Semantic Versioning](https://semver.org/).

## [1.0.1] - 2026-11-27

### Changed

- `open-pull-request` leaves the pull request template's **Manual review**
  box unticked for the person, writes Claude's self-review findings under it,
  and explains that the Claude review check fails until a person reviews
  while the repository has no Anthropic API key.

## [1.0.0] - 2026-11-26

### Added

- Lifecycle skills: `write-intent`, `write-spec`, `write-plan`,
  `verify-change`, `write-adr`, `open-pull-request`, `prepare-release` and
  `review-incident`, with templates.
- `verifier` and `security-reviewer` agents.
- Guardrail hooks that keep environment files, private keys and credential
  files unread, and block pushes to protected branches, plain force pushes,
  `--no-verify`, merging pull requests, and unapproved production deploys.
