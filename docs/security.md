# Security

A skill is plain text, but the agent reading it may have tools. Treat installation as a code
review, not a content download.

## Threat model

A malicious or careless skill can try to:

- read private files, environment variables, or credentials
- write outside the requested scope
- execute shell commands or install packages
- send data to a third party
- hide errors or claim success without verification
- override the user's instructions

The skill itself cannot grant permissions. The risk comes from what the agent is already allowed
to do when it follows the instructions.

## Review before install

1. **Read `SKILL.md` end to end.** Do not skim only the description.
2. **List the companion files.** Check that relative links stay inside the folder.
3. **Read every script.** If it is minified or binary, treat that as a red flag.
4. **Identify network calls.** Look for uploads, webhooks, telemetry, and unpinned downloads.
5. **Check the blast radius.** What is the worst write this skill could cause?
6. **Check the license.** Confirm the intended use is allowed.
7. **Start manual-only.** Use it once in a recoverable repository.

## Red flags

- `curl ... | sh`
- base64-decoded commands
- credentials in examples, prompts, or default config
- “do not tell the user”, “ignore previous instructions”, or “skip review”
- broad `rm -rf`, `git reset --hard`, force-push, or history rewrites
- installs from unpinned branches or unverified domains
- scripts that are binaries or minified blobs with no source
- requests for admin tokens, cloud keys, or password stores
- instructions that disable tests, lint, or security checks

## Safe defaults

- Install manual-only until the skill has earned trust.
- Pin a tag or commit for third-party skills.
- Keep the source checkout so you can diff updates.
- Review the diff before replacing a working install.
- Use least-privilege tokens and rotate them.
- Run new skills in a repository where a bad edit is recoverable.
- Use opencode permission rules to limit shell, edit, and network access.

## Updating

```bash
# Keep the original source
git -C ~/src/skill-repo fetch --tags
git -C ~/src/skill-repo diff v1.0.0..v1.1.0
```

If the diff is acceptable, reinstall with `--force`. If not, stay on the old version.

## Reporting

If a skill is malicious or unsafe:

1. Do not install it.
2. Preserve the source URL and the exact file.
3. Report it to the maintainer through their security policy.
4. Tell your team so nobody else installs it.

## Related

- [Authoring](authoring.md)
- [Visibility](visibility.md)
- [Installation](installation.md)
