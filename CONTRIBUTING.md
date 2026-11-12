# Contributing to SkillForge

Thanks for helping make Agent Skills safer and easier to understand.

## Ground rules

- Be kind. Assume good intent.
- Keep changes small and focused.
- Add a test for behavior changes.
- Do not add a runtime dependency without a strong reason.
- Never commit secrets, tokens, or private data.
- Do not weaken the manual-only default or the review step.

## Development

```bash
git clone https://github.com/M0-AR/skillforge.git
cd skillforge
node --version    # 18 or newer
npm test
npm run lint
```

There are no runtime dependencies, so there is nothing to install for the CLI.

## What to work on

Good first contributions:

- improve a confusing error message
- add a validation check with a test
- fix a documentation link
- add an example skill
- improve the site’s accessibility

Larger changes should start with an issue so we can agree on the shape.

## Tests

Use Node’s built-in test runner.

```bash
npm test
npm run test:watch
```

Tests cover:

- frontmatter parsing and visibility helpers
- validation errors and warnings
- scaffolding
- install paths for opencode 1.x and 2.x
- local and project installs

If you fix a bug, add a test that fails before the fix.

## Code style

- ES modules, Node 18+.
- No runtime dependencies.
- Use the existing helpers in `src/utils.js`.
- Prefer explicit names over comments.
- Keep output readable in a terminal.
- Do not add comments that restate the code.

## Documentation

- Update the relevant file in `docs/`.
- Keep the README and docs consistent.
- Use relative links inside the repository.
- Test commands before documenting them.
- Do not describe features that do not exist.

## Site changes

- `index.html` is the source of truth.
- `styles.css` and `app.js` are shared.
- Regenerate `preview.html` with `npm run site`.
- Check the site at mobile and desktop widths.
- Respect `prefers-reduced-motion`.
- Keep the CSS orb fallback working when WebGL or the CDN is unavailable.
- Do not add a build step for the site.

## Commits

Write a short, imperative subject:

```text
Add validator warning for symlinks that leave the folder
Fix v2 command path in manual installs
Document manual-only behavior on opencode 1.x
```

One logical change per commit is ideal.

## Pull requests

Include:

- what changed
- why it changed
- how you tested it
- any user-facing behavior change
- screenshots for site changes

Keep the diff focused. Do not reformat unrelated files.

## Security

Do not open a public issue for a vulnerability. Follow [SECURITY.md](SECURITY.md).

## License

By contributing, you agree that your contribution is licensed under the MIT License.
