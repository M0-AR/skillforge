# What is a skill?

A skill is a folder of instructions that an AI agent can load when a task matches. It is not a
plugin, a daemon, or a database row. It is plain text with a small amount of structure.

## Anatomy

```text
my-skill/
├── SKILL.md
├── references/
│   ├── checklist.md
│   └── examples.md
└── scripts/
    └── check.mjs
```

`SKILL.md` is required. Everything else is optional and is loaded only when the skill points to
it. The folder name is the skill ID.

## Frontmatter

```yaml
---
name: release-notes
description: Turn merged pull requests into clear, customer-ready release notes.
---
```

- `name` should match the folder and use lowercase kebab-case.
- `description` is the routing signal. It tells the model when the skill is relevant.
- A skill without a description is manual-only on opencode 1.x.

## Progressive disclosure

At startup, opencode needs to know which skills exist. It reads the name and description, not the
whole body. When a request matches, the agent loads `SKILL.md` and any companion files it needs.

That is the entire performance story: you can keep a large, detailed playbook on disk without
paying for it on every turn.

## A skill is not an MCP server

| | Agent Skill | MCP server |
| --- | --- | --- |
| What it carries | Judgment, workflow, references | Tools and live actions |
| Context cost | Name + description until used | Tool definitions are always present |
| Runtime | None | A process or remote service |
| Review | Read the folder | Read the code and the permissions |
| Best for | Repeatable know-how | Calling APIs, databases, systems |

Use both when the job needs both. Use neither when a short prompt is enough.

## Auto vs manual

An **auto-advertised** skill keeps its description. The model may load it when the request fits.

A **manual-only** skill is installed and callable, but the model does not discover it on its own.
You invoke it by name. This is the safer default for a new or third-party skill.

The exact mechanics differ between opencode 1.x and 2.x. See [Visibility](visibility.md).

## What a skill is not

- Not a sandbox. The agent still has the tools and permissions you gave it.
- Not a package manager. There is no lockfile or signature by default.
- Not a secret store. Never put tokens in a skill.
- Not a replacement for tests. A skill can describe verification; it cannot guarantee it.

## Related

- [Installation](installation.md)
- [Authoring](authoring.md)
- [Security](security.md)
