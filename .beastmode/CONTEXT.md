# Context — How We Build

Architecture, conventions, and implementation knowledge organized by workflow phase.

## Design
Architecture and technology decisions for how we build beastmode. System follows a plugin architecture on Claude Code with markdown-first skill definitions, git worktree isolation, and four-domain knowledge organization.
@context/DESIGN.md

## Plan
Conventions and structure for implementation. Naming patterns, code style, directory layout, and where different types of files belong.
@context/PLAN.md

## Implement
Agent safety rules and testing strategy for implementation. Multi-agent collaboration requires explicit safety boundaries — never guess, always verify in code.
@context/IMPLEMENT.md

## Validate
Quality gates and verification strategy before release. Currently relies on manual verification via skill invocation and content inspection.
@context/VALIDATE.md

## Release
Release workflow and versioning conventions. Squash-per-release commits, archive tagging, version detection, changelog generation, and marketplace publishing.
@context/RELEASE.md
