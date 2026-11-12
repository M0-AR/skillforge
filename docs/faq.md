# FAQ

## What is SkillForge?

A zero-dependency CLI and learning site for opencode Agent Skills. It installs skills safely,
validates them before they touch your setup, scaffolds new ones, and teaches the model in plain
language.

## Is it a package manager?

No. It copies folders and writes command files. There is no registry, lockfile, or signature. That
is a feature at this size: everything is inspectable.

## Does it work with other agents?

The concepts are portable. The install paths and visibility flags are specific to opencode. A
different agent may use the same folder shape with different discovery rules.

## Do I need the CLI?

No. A skill is a folder. You can copy it by hand and write the command file yourself. The CLI
automates the careful parts: validation, whole-folder copy, visibility, and verification.

## Why manual-only by default?

Because a new skill is unreviewed code. Manual-only keeps it installed and callable without
advertising it to the model on every turn. You can switch to auto after you trust it.

## Why remove the description on opencode 1.x?

On 1.x, the description is the advertisement. Without it, the skill is not offered to the model,
but the command can still read and follow it.

## Why keep the description on opencode 2.x?

Version 2 supports an explicit metadata flag. The description stays useful for humans and for
`@` invocation, while `metadata.opencode/autoinvoke: false` stops automatic discovery.

## Where do skills live?

Global: `~/.config/opencode/skills/<id>/SKILL.md`.

Project: `.opencode/skills/<id>/SKILL.md`.

## How do I know it worked?

Restart opencode, then run `opencode debug skill`. Find the ID. Check whether the description is
present. That tells you whether it is advertised.

## Can I install a skill from a subfolder?

Yes. Point `add` at the folder that contains `SKILL.md`, or at a parent and use `--name` to choose.

## Can I install several skills at once?

Not in one command. Install them one at a time so each review and verification stays deliberate.

## What happens on update?

`--force` replaces the folder. It does not merge. Keep customizations in version control or
re-apply them.

## Is there an uninstall command?

Not yet. Remove the skill folder and the command file, then restart opencode.

## Is it safe?

Only as safe as your review. A skill is instructions an agent may follow with your tools and
permissions. Read the files, check the blast radius, and start manual-only.

## Does it collect telemetry?

No. The CLI is local. The website is static and stores learning progress in your browser only.

## How do I contribute?

See [CONTRIBUTING.md](../CONTRIBUTING.md). Small, tested changes are welcome.

## Where is the site?

`https://m0-ar.github.io/skillforge/` once Pages is enabled. The repository also includes
`preview.html`, generated from `index.html`.
