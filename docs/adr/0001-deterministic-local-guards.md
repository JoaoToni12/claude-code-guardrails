# ADR-0001: deterministic local guards before model-based review

- Status: accepted
- Date: 2026-08-04

## Context

Agentic coding tools can propose actions faster than a user can inspect every
detail. Some decisions are stable enough to encode: never wipe a broad
filesystem root, never write a private key, and always review a deployment.

## Decision

Run dependency-free command hooks before Bash and file-write tools. Match a
versioned policy in the order `deny`, `ask`, `allow`, then use a conservative
default. The hook returns Claude Code's structured `PreToolUse` decision.

The guards make no LLM or network call. Post-write JSON validation is separated
from pre-action authorization because it observes the resulting file.

## Consequences

- decisions are fast, auditable, reproducible, and testable offline;
- teams can review policy changes as code;
- regex classification is intentionally incomplete and must be layered with
  native permissions, least privilege, branch protection, and human review;
- unknown commands prompt for review instead of being silently auto-approved.
