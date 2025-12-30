---
title: Refactor code for clarity and structure
---

Refactors existing code to improve readability, structure, and maintainability
without changing its external behavior.

Use this tool when:

- The user wants cleaner or more maintainable code
- Functions or files are too large or complex
- Naming, structure, or patterns should be improved

Input fields:

- `goal`: description of the desired refactoring outcomes
- `code`: full code to refactor
- `language` (optional): language name, for context
- `constraints` (optional): compatibility or design constraints

The tool returns the full refactored code only. It does not return explanations,
diffs, or markdown formatting. Treat the output as authoritative; callers
should not rewrite or reformat it after invocation.
