# Command templates

The installer writes the real command file for you. These files are the canonical templates.

| File | Purpose |
| --- | --- |
| `add-skill.md` | Manual-only command for the bundled `add-skill` helper. |

`{{SKILL_DIR}}` is replaced with the absolute installed skill directory (or a project-relative
path for a project-scoped install).

On opencode 1.x the command folder is `command/`. On opencode 2.x it is `commands/`. The installer
detects the version and writes to the right place. The legacy singular folder is also discovered by
current releases, but new files should use the plural folder on v2.
