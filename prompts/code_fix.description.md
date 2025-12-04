---
title: Fix bugs in existing code
---

Fixes bugs or incorrect behavior in existing code.

Use this tool when:

- There is a runtime error, failing test, or incorrect behavior
- A specific function, file, or snippet is known to be broken
- The goal is to correct behavior, not to refactor for style alone

Input fields:

- `goal`: short description of the bug, failure, or wrong behavior
- `code`: full code to fix
- `language` (optional): language name, for context
- `context` (optional): logs, examples of expected vs actual behavior, or
  constraints

The tool returns the full corrected code only. It does not return explanations,
diffs, or markdown formatting.
