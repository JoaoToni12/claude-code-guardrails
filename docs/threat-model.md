# Threat model

## Assets

- uncommitted source and local Git history;
- credentials and private configuration;
- deployment, release, and remote-repository state;
- the user's ability to review high-impact actions before execution.

## Trust boundaries

Claude Code provides hook input over standard input. The toolkit treats that
payload, paths, commands, and custom policy files as untrusted. Decisions are
local and deterministic; no model or network call participates in a guard.

## Controls

- malformed hook input fails closed;
- command policies load inside the guarded execution path so invalid custom
  policy cannot degrade into a non-blocking hook error;
- broad filesystem deletion, destructive Git cleanup, unleased force-pushes,
  and raw-device writes are denied;
- remote, release, infrastructure, and recursive-delete commands require review;
- writes outside the workspace, through symlink escapes, into Git internals, or
  to credential-like files are denied;
- the workspace boundary comes from Claude Code's `CLAUDE_PROJECT_DIR`, not a
  session's mutable current working directory;
- JSON validation reports parser errors without echoing file contents;
- CI tests the allow, ask, deny, malformed-input, and path-escape paths.

## Explicit limitations

- command matching uses regular expressions, not a complete shell parser;
- the auto-allow set is intentionally narrow; commands that execute repository
  scripts, read arbitrary paths, or use shell control operators require review;
- hooks are guardrails, not a sandbox, endpoint security product, or substitute
  for least-privilege credentials and server-side authorization;
- a user who can edit the policy or hook files can weaken the controls;
- shell aliases, interpreters, encoded commands, and novel tool inputs can evade
  pattern matching;
- file checks do not prevent another process from racing a path after approval.

Keep Claude Code's native permission system enabled and use protected branches,
secret scanning, review, and narrow credentials for real projects.
