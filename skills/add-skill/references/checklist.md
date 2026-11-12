# Install checklist

Use this before and after installing any skill.

## Before

- [ ] The source is the repository or folder the user intended.
- [ ] There is no official MCP server or native integration that does the job better.
- [ ] `SKILL.md` exists in its own folder.
- [ ] `name` and `description` are present and honest.
- [ ] Every relative link resolves inside the skill folder.
- [ ] Companion files are present.
- [ ] Scripts and templates are readable text, not opaque binaries.
- [ ] No instruction requests secrets or broad access it does not need.
- [ ] No instruction tries to override the user or run destructive commands.
- [ ] The license allows the intended use.
- [ ] Existing installs are not overwritten without explicit approval.

## Install

- [ ] Global or project scope is confirmed.
- [ ] The whole folder is copied, not only `SKILL.md`.
- [ ] The folder name is a portable lowercase kebab-case ID.
- [ ] Auto-advertised or manual-only is confirmed.

## After

- [ ] Manual-only v1: `description` removed and command file created.
- [ ] Manual-only v2: `metadata.opencode/autoinvoke: false` set.
- [ ] `opencode debug skill` shows the skill as registered.
- [ ] Advertised state matches the chosen mode.
- [ ] The user knows to restart opencode.
- [ ] The user knows the exact invocation.
- [ ] Warnings were reported, not hidden.
