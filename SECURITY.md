# Security policy

## Supported version

Only the latest commit on `main` is supported.

## Reporting

Use GitHub private vulnerability reporting when available. Do not open a public
issue containing a credential, personal record, private endpoint, or production
payload.

## Design boundary

The hooks are local guardrails, not a sandbox or authorization system. They
reduce common mistakes but cannot secure a compromised workstation or replace
server-side access control, branch protection, secret scanning, and review.
