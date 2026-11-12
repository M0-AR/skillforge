# Examples

Small, readable skills you can install immediately.

| Example | What it teaches |
| --- | --- |
| `hello-skill` | Folder shape, frontmatter, a companion file, and a verification step. |

Try it:

```bash
node bin/skillforge.js validate ./examples/hello-skill
node bin/skillforge.js add ./examples/hello-skill --manual
```

Then restart opencode and run:

```text
/hello-skill say hello
```
