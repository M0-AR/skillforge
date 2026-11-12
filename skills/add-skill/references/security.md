# Security review for third-party skills

A skill is a set of instructions that an AI agent will follow. It is not a sandbox, a package
signature, or a security boundary. Treat it like code you are about to run, because the agent may
act on it with your tools and permissions.

## The five questions

1. **What can it read?** Look for instructions that browse private files, environment variables,
   SSH keys, cloud credentials, browser data, or customer data.
2. **What can it write?** Look for edits outside the requested scope, Git history rewrites, mass
   deletions, or changes to CI and deployment configuration.
3. **What can it execute?** Look for shell commands, package installs, curl-to-shell patterns,
   postinstall scripts, and network calls.
4. **What can it send?** Look for uploads, webhooks, telemetry, or any instruction that moves data
   to a third party.
5. **What can it hide?** Look for instructions to ignore the user, suppress errors, skip review, or
   claim success without verification.

## Red flags

- `curl ... | sh`
- base64-decoded commands
- credentials in examples or prompts
- "do not tell the user" or "ignore previous instructions"
- broad `rm -rf`, `git reset --hard`, or force-push instructions
- installs from unpinned branches or unverified domains
- scripts that are binaries or minified blobs with no source
- requests for admin tokens, cloud keys, or password stores
- instructions that disable tests, lint, or security checks

## A safe installation posture

- Prefer manual-only until you have used the skill once.
- Install from a tagged release or a pinned commit when possible.
- Keep the source checkout so you can diff updates.
- Review the diff before updating.
- Run the skill in a repository where the worst-case write is recoverable.
- Use opencode permissions to limit shell, edit, and network access where it matters.
- If a skill needs a secret, use the smallest scoped token and rotate it.

## Reporting a problem

If a skill contains malicious or unsafe instructions, do not install it. Report it to the
maintainer and, if it is a public repository, use the repository's security policy.
