---
title: General-purpose agent for goal-driven work
---

Runs goal-driven work using Copilot with broad context.

Use this tool when:

- The request is general or multi-step and does not fit the other specialized tools
- You need a single entry point for investigating, editing, or generating code
- The request may span multiple files or requires discovery

Input fields:

- `goal`: the objective that should guide the work
- `files` (optional): list of relevant files to start from; these are only
  pointers to key files—additional files may be accessed, read, or edited as
  needed to satisfy the goal

The tool returns only the resulting output. It does not return explanations or
markdown formatting. Treat the output as authoritative; callers should not
rewrite or reformat it after invocation.
