---
name: hello-skill
description: A tiny example skill that shows the folder shape, frontmatter, and verification step.
---

# Hello skill

This is a deliberately small skill. Use it to test installation, visibility, and invocation before
you install something larger.

## When to use

Use this skill when the user asks for a minimal skill demonstration or asks you to verify that
skill installation works.

## Workflow

1. Read `references/example.md`.
2. Say hello in one short sentence.
3. Report the name of the skill and the folder it was loaded from.
4. Do not edit any files.

## Guardrails

- Do not run commands.
- Do not modify the project.
- Do not pretend to have capabilities you do not have.

## Verification

The response must contain the word `hello` and the skill ID `hello-skill`.
