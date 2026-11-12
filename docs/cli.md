# CLI reference

```text
skillforge <command> [options]
```

The CLI has no runtime dependencies. Node.js 18 or newer is required.

## Commands

### `install`

Install the bundled `add-skill` helper.

```bash
skillforge install [--project] [--auto|--manual] [--force]
```

Default: global, manual-only, no overwrite.

### `add <source>`

Install a skill from a local path or Git URL.

```bash
skillforge add ./path/to/skill [--name <id>] [--project] [--auto|--manual] [--force] [--dry-run]
skillforge add https://github.com/owner/repo [--name <id>]
```

The source is cloned if it is a Git URL, validated, and copied. If the source contains several
skills, `--name` is required. The CLI never guesses.

### `validate <path>`

Check a skill folder before installing it.

```bash
skillforge validate ./skills/my-skill
skillforge validate ./skills/my-skill --json
```

Exit code is `1` when validation fails.

Checks include:

- `SKILL.md` exists and has a non-empty body
- frontmatter parses
- name is a portable ID and matches the folder
- relative links resolve inside the folder
- symlinks do not escape the folder
- size and file-count warnings

### `scaffold <name>`

Create a starter skill folder.

```bash
skillforge scaffold release-notes --dir ./skills [--force]
```

The folder name is the slugified skill name. Existing folders are not overwritten without
`--force`.

### `list`

List installed skills.

```bash
skillforge list [--project] [--json]
```

By default it scans the global scope and the current project. `--project` limits output to the
project.

### `doctor`

Check the environment.

```bash
skillforge doctor [--project] [--json]
```

Reports Node, Git, opencode version, config path, writability, command path, and installed skills.

## Global options

| Option | Meaning |
| --- | --- |
| `--project` | Use `./.opencode` instead of the global config |
| `--auto` | Advertise the skill to the model |
| `--manual` | Hide it from the model; invoke by name |
| `--name <id>` | Select one skill from a multi-skill source |
| `--force` | Replace an existing install |
| `--dry-run` | Show the plan without writing |
| `--json` | Machine-readable output for `validate`, `list`, `doctor` |
| `-h`, `--help` | Show help |
| `-v`, `--version` | Show the version |

## Exit codes

| Code | Meaning |
| --- | --- |
| `0` | Success |
| `1` | Validation failed or an error occurred |

## Environment variables

| Variable | Meaning |
| --- | --- |
| `OPENCODE_CONFIG_HOME` | Override the global opencode config directory |
| `SKILLFORGE_OPENCODE_VERSION` | Override the detected opencode version (useful in tests) |
| `NO_COLOR` | Disable ANSI color |

## Examples

```bash
node bin/skillforge.js doctor
node bin/skillforge.js validate ./skills/add-skill
node bin/skillforge.js add ./examples/hello-skill --manual
node bin/skillforge.js add https://github.com/owner/skill-repo --name release-notes --dry-run
node bin/skillforge.js scaffold my-skill --dir ./examples
node bin/skillforge.js list --json
```

## Related

- [Installation](installation.md)
- [Visibility](visibility.md)
- [Troubleshooting](troubleshooting.md)
