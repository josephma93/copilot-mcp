# Repository Guidelines

## Project Structure & Module Organization
- `src/`: Deno MCP server runtime (`index.ts`, `prompts.ts`, `logger.ts`).
- `prompts/`: Markdown prompt descriptions and templates consumed by the server.
- `tests/`: Deno tests, including the end-to-end smoke test.
- `scripts/`: Supporting scripts (if added), keep Deno-first.
- `logs/`: Optional log output when `LOG_DIR` is set to this path.

## Build, Test, and Development Commands
- `deno task dev` — Run the server locally over stdio with permissions for copilot + logging.
- `deno task compile` — Produce a standalone binary at `dist/copilot-mcp` with prompts bundled.
- `deno task smoke` — Start the server via stdio and exercise initialize, list tools, and all tool calls using the official MCP client.
- Direct run example (dev):  
  `deno run --allow-run=copilot --allow-read --allow-write --allow-env=LOG_DIR,HOME,LOCALAPPDATA,APPDATA,XDG_STATE_HOME src/index.ts`

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

## Release Automation
- **Workflow**: Pushing a tag `v*` triggers `.github/workflows/release.yml`.
- **Binaries**: The release workflow builds macOS binaries and uploads them to GitHub Releases with SHA256 checksums.
- **Homebrew**: After the release workflow succeeds, `.github/workflows/update-formula.yml` is triggered to update `Formula/copilot-mcp.rb` automatically.
- **Template**: The formula is generated from `.github/formula-template.rb`. Do not edit the formula directly for version bumps; let the automation handle it.

## Security & Configuration Tips
- Permissions: Keep `deno run`/`deno task` flags minimal while ensuring the server can write logs without prompting (copilot, read/write access, and env for log location).
- Copilot auth: Ensure `copilot auth login` succeeds (Keychain prompts are expected on macOS), or export `GITHUB_TOKEN`/`COPILOT_TOKEN` when running tests.
