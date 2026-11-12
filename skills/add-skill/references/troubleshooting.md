# Troubleshooting

## The skill does not appear

1. Confirm `SKILL.md` is in a folder under a discovery path:
   - `~/.config/opencode/skills/<id>/SKILL.md`
   - `.opencode/skills/<id>/SKILL.md`
2. Restart opencode. Skill state loads once at startup.
3. Run `opencode debug skill` and search for the ID.
4. For auto-advertised skills, confirm `description` exists and
   `metadata.opencode/autoinvoke` is not `false`.

## The skill is registered but the model never uses it

- The description may be too vague. Make it specific about when to use the skill.
- The skill may be manual-only by design. Invoke it explicitly.
- A permission rule may be hiding it. Check the `skill` action rules for the active agent.

## `/skill-name` is not available

- On opencode 1.x, create the command file under `~/.config/opencode/command/`.
- On opencode 2.x, create it under `~/.config/opencode/commands/`.
- Confirm the command file is Markdown and has a `description` in frontmatter.

## Companion links are broken

- Copy the whole skill folder, not only `SKILL.md`.
- Keep relative links inside the skill folder.
- Re-run the validator after moving files.

## An update overwrote my changes

- Keep the source checkout and re-apply local edits after updating.
- Use version control for your installed skills if you customize them.
- Prefer a project-scoped install for customizations.

## The skill asks for permissions I do not want

- Do not install it until you have read the scripts it asks to run.
- Use opencode permission rules to deny shell, edit, or network actions.
- Consider a manual-only install and invoke it in a sandboxed project.

## I need to uninstall

Remove the skill folder:

```bash
rm -rf ~/.config/opencode/skills/<id>
```

Remove the manual command too, if you created one:

```bash
rm -f ~/.config/opencode/command/<id>.md
```

Restart opencode.
