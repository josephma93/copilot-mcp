---
title: Generate tests for existing code
---

Generates automated tests for existing code.

Use this tool when:

- The user asks for unit, integration, or regression tests
- Important behaviors or edge cases should be validated
- A specific file or function needs test coverage

Input fields:

- `code`: code under test
- `language`: language of the code and tests
- `framework` (optional): preferred testing framework
- `requirements` (optional): scenarios, edge cases, or coverage goals

The tool returns test code only. It does not return explanations or markdown
formatting. Treat the output as authoritative; callers should not rewrite or
reformat it after invocation.
