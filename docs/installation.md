# Installation

## Prerequisites

- opencode installed
- Node.js 18+ for the CLI
- Git for repository sources

## Install the bundled helper

```bash
node bin/skillforge.js install
```

Options:

```bash
node bin/skillforge.js install --project    # ./.opencode instead of the global config
node bin/skillforge.js install --auto      # advertise it to the model
node bin/skillforge.js install --force     # replace an existing install
```

Default behavior is manual-only, global, and no overwrite.

## Install from a local folder

```bash
node bin/skillforge.js add ./examples/hello-skill --manual
```

The source can be the skill folder itself or a parent folder that contains one skill. If the
parent contains several, the CLI refuses to guess; use `--name`:

```bash
node bin/skillforge.js add ./skills --name release-notes
```

## Install from Git

```bash
node bin/skillforge.js add https://github.com/owner/skill-repo --manual
node bin/skillforge.js add git@github.com:owner/skill-repo.git --name release-notes
```

The CLI clones with `--depth 1` into a temporary folder, validates, copies the selected skill,
and removes the clone. It never modifies the source checkout.

## Project scope

```bash
node bin/skillforge.js add ./examples/hello-skill --project --manual
```

This writes to `./.opencode/skills/hello-skill` and `./.opencode/command/hello-skill.md` (or
`commands/` on opencode 2.x). Project skills travel with the repository and are a good fit for
team-specific workflows.

## Dry run

```bash
node bin/skillforge.js add ./examples/hello-skill --dry-run
```

Shows the derived ID, destination, mode, and warnings without writing anything.

## Overwrite

```bash
node bin/skillforge.js add ./examples/hello-skill --force
```

`--force` replaces the destination folder. It does not merge. Keep local edits in version control
or re-apply them after the update.

## Manual installation

If you prefer not to use the CLI:

```bash
mkdir -p ~/.config/opencode/skills
cp -a ./my-skill ~/.config/opencode/skills/my-skill
```

Then choose visibility:

- Auto: keep the `description` in `SKILL.md`.
- Manual on 1.x: remove `description` and create
  `~/.config/opencode/command/my-skill.md`.
- Manual on 2.x: keep `description` and add
  `metadata.opencode/autoinvoke: false`.

## Verify

```bash
opencode debug skill
```

Restart opencode first. Search for the skill ID, then check whether the description is present.

## Uninstall

```bash
rm -rf ~/.config/opencode/skills/<id>
rm -f ~/.config/opencode/command/<id>.md
```

Project scope uses `.opencode/` instead. Restart opencode afterward.

## Related

- [Visibility](visibility.md)
- [CLI reference](cli.md)
- [Troubleshooting](troubleshooting.md)
