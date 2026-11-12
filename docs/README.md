# SkillForge documentation

Start with the guide that matches your job.

| If you want to… | Read |
| --- | --- |
| Install a skill in five minutes | [Getting started](getting-started.md) |
| Understand what a skill actually is | [What is a skill?](what-is-a-skill.md) |
| Install from a repo, path, or project scope | [Installation](installation.md) |
| Choose manual-only or auto-advertised | [Visibility](visibility.md) |
| Write and validate your own skill | [Authoring](authoring.md) |
| Review a skill for risk | [Security](security.md) |
| Learn the whole model, step by step | [Learning path](learning-path.md) |
| Look up a command or flag | [CLI reference](cli.md) |
| Fix a skill that will not appear | [Troubleshooting](troubleshooting.md) |
| Publish the site and repo | [Publishing](publishing.md) |
| Get short answers | [FAQ](faq.md) |

## The two-minute model

1. A skill is a folder with `SKILL.md` and optional companion files.
2. opencode discovers it globally (`~/.config/opencode/skills`) or per project
   (`.opencode/skills`).
3. Auto-advertised skills keep a `description`; the model sees the name and description and
   loads the body only when the task matches.
4. Manual-only skills are callable but not advertised. On opencode 1.x that means removing the
   description and adding a command file. On opencode 2.x it means
   `metadata.opencode/autoinvoke: false`.
5. Install the whole folder, restart opencode, and verify with `opencode debug skill`.

## The one rule

Review before you install. A skill is instructions an agent may follow with your tools and
permissions. It is not sandboxed by itself.
