# Troubleshooting

## The skill does not appear

1. Confirm the folder is in a discovery path:
   - `~/.config/opencode/skills/<id>/SKILL.md`
   - `.opencode/skills/<id>/SKILL.md`
2. Confirm the file is named exactly `SKILL.md`.
3. Restart opencode. Skill state is loaded at startup.
4. Run `opencode debug skill` and search for the ID.
5. If you expected auto-discovery, confirm `description` exists and
   `metadata.opencode/autoinvoke` is not `false`.

## The skill is registered but never used

- The description may be too vague. Name the trigger and the output.
- The skill may be manual-only. Invoke it explicitly.
- A permission rule may hide the `skill` action for the active agent.
- Another skill with a similar description may win. Make the trigger specific.

## `/skill-name` is not available

- opencode 1.x: the command file goes in `~/.config/opencode/command/<id>.md`.
- opencode 2.x: the command file goes in `~/.config/opencode/commands/<id>.md`.
- The command must be a Markdown file with a `description` in frontmatter.
- A custom command with the same name as the skill wins.
- Restart after adding it.

## The command runs but ignores my request

The command must include `$ARGUMENTS`. If it does not, the user's text is not forwarded.

## Broken companion links

- Copy the whole skill folder, not only `SKILL.md`.
- Keep relative links inside the folder.
- Re-run `skillforge validate`.

## The installer says “multiple skills found”

The source contains more than one `SKILL.md`. Choose one:

```bash
skillforge add ./repo --name release-notes
```

The CLI refuses to guess on purpose.

## The installer says “already installed”

Use `--force` only after reviewing the replacement:

```bash
skillforge add ./repo --name release-notes --force
```

`--force` replaces the folder; it does not merge.

## Validation fails on a link that looks fine

- Links are resolved relative to the skill folder, not the current directory.
- Absolute paths and links that leave the folder are warnings or errors.
- Code fences are ignored, so a link inside an example does not need to exist.
- Check for typos and case differences. Some filesystems are case-insensitive; others are not.

## Windows paths

Use forward slashes in Markdown links. The CLI normalizes paths for display, but relative links in
`SKILL.md` should stay portable.

## `opencode debug skill` is not valid JSON

Older or newer releases may print a different shape. Search the output for the skill ID and the
description field. If the command is unavailable, verify the install by checking the folder and
restarting opencode.

## I changed visibility and nothing happened

Restart opencode. Changing `SKILL.md` or the command file does not update the running process.

## I need to start over

Remove the skill and command, then reinstall:

```bash
rm -rf ~/.config/opencode/skills/<id>
rm -f ~/.config/opencode/command/<id>.md
```

Project scope uses `.opencode/`. Restart opencode.

## Still stuck

Open an issue with:

- opencode version
- Node version
- the exact command
- the skill folder tree
- the validator output
- the relevant part of `opencode debug skill`

Do not paste secrets or private repository contents.
