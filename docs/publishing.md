# Publishing the repository and site

This page covers the GitHub setup for this project: the public repository, Pages, social preview,
and the launch checklist.

## 1. Create the repository

```bash
git init
git add .
git commit -m "Initial SkillForge release"
gh repo create M0-AR/skillforge --public --source=. --remote=origin --push
```

If `gh` is not authenticated, run `gh auth login` first.

Suggested repository description:

> Install, validate, scaffold, and learn opencode Agent Skills. Zero dependencies.

Suggested topics:

`opencode`, `agent-skills`, `ai-agents`, `developer-tools`, `cli`, `open-source`

## 2. Enable GitHub Pages from a branch

In the repository:

1. Open **Settings**.
2. Open **Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
4. Set the branch to `main` and the folder to `/ (root)`.
5. Save.

The site is served at:

```text
https://m0-ar.github.io/skillforge/
```

`index.html` is the entry point. `.nojekyll` is present so GitHub Pages serves the files as-is.

`preview.html` is generated from `index.html`:

```bash
npm run site
```

It mirrors the same site and is useful when a link needs a standalone preview file.

## 3. Verify the deployment

- Open the Pages URL in a private window.
- Confirm the hero 3D scene loads, or the CSS orb fallback appears.
- Press `Ctrl+K` / `Cmd+K` and jump to a section.
- Complete the builder and copy the Markdown.
- Check the quiz and the learning progress.
- Test at mobile width.
- Confirm `preview.html` loads.

If the page is blank, check **Actions** and the Pages settings. A root `index.html` and a valid
branch are the usual fixes.

## 4. Social preview

Upload a 1280×640 PNG under 1 MB in **Settings → General → Social preview**.

The source is `assets/og.html`. Render it at 1280×640 and save the result as
`assets/og.png`. Keep the file under 1 MB.

## 5. Launch checklist

- [ ] `npm test` passes.
- [ ] `npm run lint` passes.
- [ ] `npm run site` regenerates `preview.html`.
- [ ] README renders with the banner and demo.
- [ ] Pages URL loads in a private window.
- [ ] Social preview is set.
- [ ] Repository description and topics are set.
- [ ] License is visible.
- [ ] Security policy is visible.
- [ ] The install command works from a clean directory.
- [ ] The manual-only flow is verified against a real opencode install.

## 6. After launch

- Tag the release.
- Publish a short changelog.
- Watch issues for install failures.
- Keep the demo GIF current.
- Re-run the checklist before every release.
