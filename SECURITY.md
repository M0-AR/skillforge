# Security policy

## Supported versions

| Version | Supported |
| --- | --- |
| 1.x | Yes |

## Reporting a vulnerability

Do not open a public issue for a vulnerability.

Report it privately through GitHub Security Advisories:

1. Open the repository on GitHub.
2. Go to **Security**.
3. Choose **Advisories**.
4. Click **Report a vulnerability**.

Include:

- what the issue is
- how to reproduce it
- the affected version or commit
- the impact you believe it has
- any suggested fix

You should receive an acknowledgment within a few days. Please give us time to investigate and
release a fix before public disclosure.

## What counts

- the installer copying files outside the chosen destination
- command injection through a skill name, path, or URL
- path traversal through a companion link
- symlink escapes that write outside the skill folder
- a manual-only install that is still advertised to the model
- secret leakage in logs or generated files
- a validation bypass that allows a broken or unsafe skill to install

## What does not count

- a third-party skill being malicious; report that to its maintainer
- the agent following a reviewed skill’s instructions within its permissions
- issues that require an already-compromised machine
- missing sandboxing; skills are instructions, not a sandbox

## Safe installation

- Review before installing.
- Start manual-only.
- Pin third-party skills to a tag or commit.
- Use least-privilege tokens.
- Keep backups or version control for anything a skill can change.

See [docs/security.md](docs/security.md) for the full review checklist.
