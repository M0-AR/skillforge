# Getting started

This is the shortest path from zero to a verified skill. It takes about five minutes.

## 1. Check the basics

You need:

- opencode installed and working
- Node.js 18 or newer (only for the optional CLI)
- Git (only if you install from a repository)

```bash
opencode --version
node --version
git --version
```

## 2. Install the helper

From a checkout of this repository:

```bash
node bin/skillforge.js install
```

Or, once the package is published:

```bash
npx github:M0-AR/skillforge install
```

The installer copies the bundled `add-skill` skill into your global opencode config, makes it
manual-only, and writes the matching command file. It does not execute the skill.

## 3. Restart opencode

Skill state is loaded at startup. Close opencode and open it again.

## 4. Use it

```text
/add-skill https://github.com/owner/skill-repo
```

The helper will find the skill folder, review it with you, install it, and verify it.

## 5. Install something small first

Use the bundled example:

```bash
node bin/skillforge.js validate ./examples/hello-skill
node bin/skillforge.js add ./examples/hello-skill --manual
```

Restart opencode, then run:

```text
/hello-skill say hello
```

Once that works, you have proven the whole loop: discovery, validation, copy, command
registration, restart, and invocation.

## 6. Where things live

| Scope | Skills | Commands |
| --- | --- | --- |
| Global | `~/.config/opencode/skills/<id>/` | `~/.config/opencode/command/` (v1) or `commands/` (v2) |
| Project | `.opencode/skills/<id>/` | `.opencode/command/` (v1) or `commands/` (v2) |

## 7. Verify

```bash
opencode debug skill
```

Find the skill ID. If you chose manual-only on opencode 1.x, the skill should be registered but
have no description in the debug output.

## Next

- [Choose visibility](visibility.md)
- [Write your own skill](authoring.md)
- [Walk the learning path](learning-path.md)
