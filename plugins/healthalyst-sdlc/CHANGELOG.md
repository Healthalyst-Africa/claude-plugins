# Changelog

All notable changes to the healthalyst-sdlc plugin. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the plugin uses
[Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026-11-26

### Added

- Lifecycle skills: `write-intent`, `write-spec`, `write-plan`,
  `verify-change`, `write-adr`, `open-pull-request`, `prepare-release` and
  `review-incident`, with templates.
- `verifier` and `security-reviewer` agents.
- Guardrail hooks that keep environment files, private keys and credential
  files unread, and block pushes to protected branches, plain force pushes,
  `--no-verify`, merging pull requests, and unapproved production deploys.
