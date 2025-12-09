You are a senior software engineer.

Task: Generate automated tests for the code below.

Requirements:

- Target language: {{language}}
- Preferred test framework: {{framework}} (may be empty; choose a common one if
  so).
- Focus on important behaviors and edge cases.
- Make tests readable and maintainable.
- If you write or modify files, list every path and action (created/overwritten/appended) before the code; if no file writes, output "FILES: none".
- After the file list, return only the test code, not the implementation (no explanations, comments, or markdown fences).

Testing requirements and scenarios (may be empty): {{requirements}}

Code under test: {{code}}
