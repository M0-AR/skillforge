# Authoring a skill

A good skill is short, specific, and honest about what it does not know. Start with the scaffold,
then edit by hand.

## Scaffold

```bash
node bin/skillforge.js scaffold release-notes --dir ./skills
```

This creates:

```text
skills/release-notes/
├── SKILL.md
└── scripts/check.mjs
```

## The description is the routing layer

The description is not a summary for humans. It is the signal the model uses to decide whether
the skill is relevant.

Weak:

```yaml
description: Helps with releases.
```

Strong:

```yaml
description: Turn merged pull requests into clear, customer-ready release notes grouped by Added, Changed, Fixed, and Security.
```

Include the trigger, the object, and the output. Keep it under 1024 characters.

## Keep the body focused

A useful shape:

```markdown
# Release notes

## When to use
The user asks for release notes, a changelog, or a summary of what changed since a tag.

## Workflow
1. Read merged pull requests since the last tag.
2. Group changes into Added, Changed, Fixed, and Security.
3. Write short, factual bullets with links.
4. Ask before publishing.

## Guardrails
- Do not invent changes.
- Do not include customer names or secrets.
- Do not publish without explicit approval.

## Verification
Confirm every bullet links to a real change and the requested format is respected.
```

Short sections beat long essays. The agent needs a procedure, not motivation.

## Use companion files

Move detail out of `SKILL.md` when it is only needed sometimes:

- `references/checklist.md`
- `references/examples.md`
- `templates/pull-request.md`

Link them with relative Markdown links:

```markdown
Read [the checklist](references/checklist.md) before reviewing.
```

Relative links must stay inside the skill folder. The validator checks this.

## Scripts

Scripts are optional. If you include them:

- keep them readable source, not binaries
- document what they do and what they touch
- do not run them during installation
- never require secrets to be embedded
- make the safe path the default

The generated `scripts/check.mjs` is a self-contained sanity check. It verifies the skill folder
shape. It does not run the skill.

## Validate

```bash
node bin/skillforge.js validate ./skills/release-notes
```

Errors block installation. Warnings deserve a look:

- missing frontmatter
- name not matching the folder
- links leaving the folder
- large files
- symlinks pointing outside the folder

## Version and share

Skills are folders, so version them like code:

```bash
git add skills/release-notes
git commit -m "Add release-notes skill"
```

If you distribute a skill:

- tag releases
- keep a changelog
- state the supported opencode version
- include a license
- tell people to install manual-only first

## Review checklist

- [ ] Name matches folder and uses kebab-case.
- [ ] Description states the trigger and output.
- [ ] Body is a procedure, not a manifesto.
- [ ] Every relative link resolves.
- [ ] Guardrails are explicit.
- [ ] Verification is observable.
- [ ] No secrets, tokens, or private data.
- [ ] Scripts are readable and documented.
- [ ] License is present if you distribute it.

## Related

- [Security](security.md)
- [CLI reference](cli.md)
- [Learning path](learning-path.md)
