# Visibility: auto-advertised vs manual-only

Visibility answers one question: can the model discover and load this skill on its own?

## Auto-advertised

Keep the `description` in `SKILL.md`. opencode lists the skill’s name and description, and the
agent may load the body when a request matches.

```yaml
---
name: release-notes
description: Turn merged pull requests into clear, customer-ready release notes.
---
```

Use this when:

- you wrote the skill and reviewed every line
- it has been used safely in a real project
- you want natural-language discovery

## Manual-only on opencode 1.x

On opencode 1.x, only skills with a description are advertised. To hide a skill from automatic
discovery while keeping it callable:

1. Remove the `description` from `SKILL.md`.
2. Add a command file that reads the skill and forwards the user's request.

Global command path:

```text
~/.config/opencode/command/<id>.md
```

Project command path:

```text
.opencode/command/<id>.md
```

Command template:

```markdown
---
description: Manual-only my-skill — loads its playbook on demand
---

Read `~/.config/opencode/skills/my-skill/SKILL.md` in full and follow it.

Treat that folder as the skill base directory and read the companion files it selects.

User request: $ARGUMENTS

If there is no request above, ask what to do.
```

A custom command with the same name as the skill wins, and only the command supports
`$ARGUMENTS`.

## Manual-only on opencode 2.x

Keep the description and add the metadata flag:

```yaml
---
name: my-skill
description: ...
metadata:
  opencode/autoinvoke: false
---
```

Equivalent syntax:

```yaml
disable-model-invocation: true
```

Invoke it with `@my-skill` or the matching command.

## Which should I choose?

| Situation | Recommendation |
| --- | --- |
| First install of a third-party skill | Manual-only |
| Skill that runs scripts or changes files | Manual-only until reviewed |
| Team-wide, reviewed workflow | Auto-advertised |
| Personal experiment | Manual-only |
| Skill with a narrow, obvious trigger | Auto-advertised after testing |

## Verify the mode

```bash
opencode debug skill
```

The debug list includes registered skills, not only advertised ones. Check the description field:

- description present: advertised
- description absent: manual-only on 1.x

Restart opencode after changing visibility.

## Related

- [Installation](installation.md)
- [Security](security.md)
- [Troubleshooting](troubleshooting.md)
