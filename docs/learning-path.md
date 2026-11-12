# Zero to pro: the SkillForge learning path

Six modules. Each one has a goal, an exercise, and a success check. Do them in order. By the end
you will know more than most interview candidates about Agent Skills, and you will have installed,
authored, reviewed, and taught a skill.

The whole path takes about two hours if you type the commands yourself. Faster if you only read.

> Let's work this out in a step-by-step way to be sure we have the right answer.

## Module 1 — The mental model

**Goal:** explain what a skill is without using the word “prompt”.

**Read:** [What is a skill?](what-is-a-skill.md)

**Exercise:** Draw the folder for a skill that writes release notes. Include `SKILL.md`, one
reference file, and one script. Label which files load at startup and which load on demand.

**Success check:** You can answer these without notes:

- What is the smallest unit of a skill?
- What does progressive disclosure save?
- Why is a skill not an MCP server?

## Module 2 — Read a skill

**Goal:** inspect a real skill and identify its parts.

**Exercise:** Open `skills/add-skill/SKILL.md` in this repository. List:

1. the frontmatter fields
2. the workflow steps
3. the companion files
4. the guardrails
5. the verification step

**Success check:** You can explain why the installer removes the description for a manual-only
install on opencode 1.x.

## Module 3 — Install one safely

**Goal:** complete the full install loop.

**Exercise:**

```bash
node bin/skillforge.js validate ./examples/hello-skill
node bin/skillforge.js add ./examples/hello-skill --manual
```

Restart opencode. Run `/hello-skill say hello`. Then verify:

```bash
opencode debug skill
```

**Success check:** The skill is registered, the command works, and you can explain why a restart
was required.

## Module 4 — Author your own

**Goal:** write a skill with a description that routes correctly.

**Exercise:** Scaffold a skill:

```bash
node bin/skillforge.js scaffold release-notes --dir ./skills
```

Edit `SKILL.md` so that:

- the description names the trigger and the output
- the workflow has four concrete steps
- the guardrails are explicit
- the verification step is observable

Validate it. Fix every warning you understand, and explain the ones you keep.

**Success check:** `skillforge validate` passes, and a teammate can tell when to use the skill
from the description alone.

## Module 5 — Review for risk

**Goal:** decide whether a third-party skill is safe to install.

**Read:** [Security](security.md)

**Exercise:** Take a skill you did not write. Answer:

1. What can it read?
2. What can it write?
3. What can it execute?
4. What can it send?
5. What can it hide?

Then decide: install, install manual-only, or reject. Write one paragraph explaining the choice.

**Success check:** Your decision names specific files and specific risks, not a vibe.

## Module 6 — Teach your team

**Goal:** make a skill reusable without making it invisible.

**Exercise:** Prepare a one-page handoff:

- the skill ID and purpose
- the exact invocation
- the install command
- the verification command
- the review notes
- the update policy

Add it to the repository next to the skill.

**Success check:** Someone else can install and invoke the skill using only your handoff.

## Final project

Build a skill that solves a real, repeated task in your work. It must have:

- a precise description
- a short workflow
- at least one companion reference
- explicit guardrails
- an observable verification step
- a review note with the five risk questions answered

Install it manual-only, use it once, then decide whether it has earned auto-advertising.

## Where you are now

You can explain:

- the folder shape and the discovery paths
- progressive disclosure and its context budget
- auto vs manual visibility on opencode 1.x and 2.x
- how to validate, install, verify, and uninstall
- how to review a skill for risk
- how to teach the workflow to someone else

That is the whole model. The rest is practice.

## Related

- [Authoring](authoring.md)
- [CLI reference](cli.md)
- [FAQ](faq.md)
