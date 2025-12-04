# Repository Guidelines

## Project Structure & Module Organization
- `src/`: Deno MCP server runtime (`index.ts`, `prompts.ts`, `logger.ts`).
- `prompts/`: Markdown prompt descriptions and templates consumed by the server.
- `tests/`: Deno tests, including the end-to-end smoke test.
- `scripts/`: Supporting scripts (if added), keep Deno-first.
- `logs/`: Runtime log output (appends to `server.log`).

## Build, Test, and Development Commands
- `deno task dev` — Run the server locally over stdio with minimal permissions (`copilot`, read prompts, write logs, env `LOG_LEVEL`).
- `deno task compile` — Produce a standalone binary at `dist/copilot-mcp` with prompts bundled.
- `deno task smoke` — Start the server via stdio and exercise initialize, list tools, and all tool calls using the official MCP client.
- Direct run example (dev):  
  `deno run --allow-run=copilot --allow-read=./prompts,./logs --allow-write=./logs --allow-env=LOG_LEVEL src/index.ts`

## Coding Style & Naming Conventions
- Language: TypeScript (Deno, ESM). Use explicit file extensions in imports.
- Indentation: 2 spaces, no tabs. Keep lines reasonably short.
- Logging: Use `getLogger` from `src/logger.ts`; keep messages concise and structured.
- Prompts: Store descriptions/templates in `prompts/*.md`; access via `Deno.readTextFile`.
- Imports: Prefer `npm:` specifiers for npm deps (e.g., `npm:@modelcontextprotocol/sdk/...`).

## Testing Guidelines
- Framework: Deno test runner.
- End-to-end: `deno task smoke` (requires `copilot` on PATH and authenticated).
- Add new tests under `tests/`, name files `*.test.ts`.
- For tests that spawn the server, prefer the MCP client (`@modelcontextprotocol/sdk/client`) over manual stdio parsing.

## Commit & Pull Request Guidelines
- Commits: Aim for clear, imperative subject lines (e.g., “Add Deno smoke test”). Group related changes; avoid noisy unrelated churn.
- PRs: Include what changed, why, and how to verify (commands/tests run). Link issues if applicable. Screenshots/terminal output only when they clarify behavior.
- Keep Deno-only expectations in mind: no Node build artifacts or npm scripts should reappear without discussion.

## Security & Configuration Tips
- Permissions: Keep `deno run`/`deno task` flags minimal (`--allow-run=copilot`, read prompts/logs, write logs, `--allow-env=LOG_LEVEL` for the server; smoke test uses additional env for the MCP client).
- Copilot auth: Ensure `copilot auth login` succeeds (Keychain prompts are expected on macOS), or export `GITHUB_TOKEN`/`COPILOT_TOKEN` when running tests.
