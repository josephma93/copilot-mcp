# Copilot MCP Server

### _A multi-tool Model Context Protocol server powered by the GitHub Copilot CLI (but backend-agnostic by design)_

This project provides an **MCP (Model Context Protocol)** server that exposes a
set of **high-quality, specialized coding tools**—each backed by a
prompt-engineered wrapper around the GitHub Copilot CLI.

From the perspective of an MCP client (Claude Desktop, ChatGPT Apps, etc.), this
server provides **clean, deterministic, high-value tools** for:

- 🔧 Bug fixing (`code_fix`)
- 🧹 Code refactoring (`code_refactor`)
- 🏗 Code generation (`code_generate`)
- 🧪 Test generation (`code_tests`)

Each tool is powered by prompt template and description, stored externally in
Markdown files for easy editing, iteration, and customization.

The implementation **does not expose Copilot directly**, meaning you can replace
the backend in the future without breaking tool semantics. To the user (the IA
calling), these tools simply behave like specialized coding assistants.

# ✨ Why this exists

I like Codex over copilot but the company pays for copilot so why not make use
of those free tokens 🤷. MCP makes it possible to combine these tools in a
clean, controlled, structured way.

This server aims to:

### Provide high-quality code transformations through specialized tools

Each tool has a **narrow, well-defined job**, improving reliability and output
quality.

### Hide backend complexity

Consumers of the MCP tool don’t need to know it’s using the Copilot CLI.

### Support prompt-engineering iteration

All prompt templates and tool descriptions live in external `.md` files—modify
them as you learn what works best.

### Be simple, hackable, and easy to extend

Written in strong-typed TypeScript with minimal abstractions.

### Allow any LLM to delegate code work to a second “coding engine”

Perfect for workflows where your primary model manages reasoning while Copilot
(or another engine) specializes in code output.

# 🧩 Architecture Overview

```
┌────────────────────────────┐
│         MCP Client         │
│ (Claude Desktop, ChatGPT…) │
└──────────────┬─────────────┘
               │  JSON-RPC
               ▼
┌────────────────────────────┐
│      MCP Tools (this)      │
│  code_fix / code_refactor  │
│  code_generate / code_tests│
└──────────────┬─────────────┘
               │
               ▼
┌────────────────────────────┐
│  Prompt templates (.md)    │
│  Tool descriptions (.md)   │
└──────────────┬─────────────┘
               │
               ▼
┌────────────────────────────┐
│      GitHub Copilot CLI    │
│ (replaceable backend API)  │
└────────────────────────────┘
```

Every tool:

1. Loads its markdown **description** (shown to the LLM)
2. Loads its markdown **prompt template**
3. Interpolates inputs into the template
4. Sends the final prompt to the **Copilot CLI**
5. Returns Copilot’s output _verbatim_ to the MCP client

# 📦 Features

### ✔ Four specialized tools

- `code_fix` → Fix broken code
- `code_refactor` → Improve quality without changing behavior
- `code_generate` → Create new code based on a spec
- `code_tests` → Generate tests for existing code

### ✔ All prompts and descriptions live in Markdown files

Developers can update templates and tuning data without touching TypeScript.

### ✔ Strong typing everywhere

Each tool has its own input schema using `zod`.

### ✔ Clean architecture

No hidden magic. No side effects. Easy to understand and extend.

### ✔ Backend-agnostic design

Today: GitHub Copilot CLI Tomorrow: Anything that accepts text input Tools do
not expose backend branding.

# 🚀 Quick Start (install or build)

### Install via Homebrew (recommended)

This repo can be tapped directly (explicit URL) and installed:

```bash
brew tap josephma93/copilot-mcp https://github.com/josephma93/copilot-mcp
brew install josephma93/copilot-mcp/copilot-mcp
copilot-mcp
```

Add to your MCP client (example `~/.codex/config.toml`):

```toml
[mcp_servers.copilot-mcp]
command = "/opt/homebrew/bin/copilot-mcp"
```

Upgrade an existing install:

```bash
brew reinstall josephma93/copilot-mcp/copilot-mcp && copilot-mcp --help
```

Prerequisite: GitHub Copilot CLI (`copilot`) must be installed and authenticated. See https://github.com/github/copilot-cli for installation and login steps, then ensure `copilot` is on your `PATH`.

### Run from source (development)

## 1. Install prerequisites

### Deno

Install [Deno](https://docs.deno.com/runtime/manual) (2.5+). TypeScript is
supported out of the box—no npm install needed.

### GitHub Copilot CLI

This project assumes `copilot` is installed and available in `$PATH`.

## 2. Start the MCP server (development)

```bash
deno task dev
```

This grants the permissions the server needs (including log access at a stable
location):

- `--allow-run=copilot` (to invoke the CLI)
- `--allow-read` (to load templates and access the log directory)
- `--allow-write` (to persist logs without polluting stdio)
- `--allow-env=LOG_DIR,HOME,LOCALAPPDATA,APPDATA,XDG_STATE_HOME`
  (to resolve log location)

The server runs over **stdio**, the standard and recommended MCP transport.

Logs default to an OS-stable location (macOS: `~/Library/Logs/copilot-mcp`,
Linux: `~/.local/state/copilot-mcp/logs`, Windows: `%LOCALAPPDATA%\copilot-mcp\logs`).
Override with `LOG_DIR=/path/to/logs` if needed.

## 3. Build a single binary

```bash
deno task compile
```

The resulting executable lives at `dist/copilot-mcp` and bundles the markdown
prompts via `--include=./prompts`.

## 4. Smoke test (start, handshake, stop)

Run a quick initialize + list_tools round trip using Deno's built-in test
runner. The task starts the server, performs the handshake, calls every tool
once, prints responses, then shuts the server down (requires `copilot` on PATH):

```bash
deno task smoke
```

Override the command with (e.g. to use the compiled binary):

```bash
SERVER_CMD="./dist/copilot-mcp" deno task smoke
```

Expect two `[smoke]` lines with parsed JSON responses. Notes:

- The smoke task spins up the server with the same dev command and drives it
  using the official MCP client over stdio.
- Copilot CLI must be installed and authenticated; if macOS prompts for Keychain
  access, allow it (or sign in once via `copilot auth login` or export
  `GITHUB_TOKEN`/`COPILOT_TOKEN`).

## 5. Add to your MCP client (example: Claude Desktop)

Open:

**Settings → Developer → Model Context Protocol**

Add a new server:

```json
{
  "name": "copilot-mcp",
  "command": "./dist/copilot-mcp"
}
```

For local development (without compiling), you can point to:

```json
{
  "name": "copilot-mcp",
  "command": "deno",
  "args": [
    "run",
    "--allow-run=copilot",
    "--allow-read",
    "--allow-write",
    "--allow-env=LOG_DIR,HOME,LOCALAPPDATA,APPDATA,XDG_STATE_HOME",
    "src/index.ts"
  ]
}
```

Claude will automatically discover the available tools:

- `code_fix`
- `code_refactor`
- `code_generate`
- `code_tests`
- `agent`

## Tasks

- `deno task dev` — run the MCP server locally (stdio).
- `deno task smoke` — run the smoke test (starts the server with `deno task dev` by default; override with `SERVER_CMD`).
- `deno task compile` — build a standalone binary at `dist/copilot-mcp`.

## Release process (end-to-end)

1. Ensure your branch is up to date: `git pull --rebase`.
2. Make changes, then stage and commit with a clear message.
3. If CI or automation has pushed commits, rebase again: `git pull --rebase`.
4. Push the commit: `git push`.
5. Create the release tag: `git tag vX.Y.Z`.
6. Push the tag to trigger the release workflow: `git push origin vX.Y.Z`.

## Homebrew packaging and Release Automation

The release process is fully automated via GitHub Actions:

1. **Tag a release**: When you push a new tag (e.g., `v0.1.12`), the `release` workflow is triggered.
2. **Build and Artifacts**: The workflow builds macOS binaries (`arm64` and `x86_64`), tars them, calculates SHA256 hashes, and uploads everything to a new GitHub Release.
3. **Formula Update**: Once the release workflow finishes, the `update-formula` workflow automatically:
    - Downloads the new SHA256 hashes.
    - Updates `Formula/copilot-mcp.rb` using `.github/formula-template.rb`.
    - Commits and pushes the update back to `main`.

Users can install or upgrade via Homebrew:
```bash
brew update
brew upgrade josephma93/copilot-mcp/copilot-mcp
```

Or install for the first time:
```bash
brew tap josephma93/copilot-mcp https://github.com/josephma93/copilot-mcp
brew install josephma93/copilot-mcp/copilot-mcp
```

# 🛠 Usage Examples

Below are examples of how an MCP client may call these tools.

### Fix a bug

```json
{
  "goal": "The function returns undefined when input is empty.",
  "code": "function foo(x) { if (!x.length) return; return x[0]; }",
  "language": "JavaScript"
}
```

### Refactor code

```json
{
  "goal": "Improve readability and break into smaller functions.",
  "code": "<big complicated file>"
}
```

### Generate new code

```json
{
  "spec": "Create a TypeScript class that wraps Redis with get/set/del methods.",
  "language": "TypeScript"
}
```

### Generate tests

```json
{
  "code": "function sum(a,b){ return a+b }",
  "language": "JavaScript",
  "framework": "jest"
}
```

### General-purpose agent

```json
{
  "goal": "Update the logger to include request IDs in every entry.",
  "files": ["src/logger.ts"]
}
```

The MCP client handles routing — this server simply executes.

# 🔍 How templates work

Templates use simple placeholder interpolation:

```md
Fix the bug described below: {{goal}}

Code: {{code}}
```

In TypeScript, placeholders are replaced via:

```ts
renderTemplate(template, {
  goal: input.goal,
  code: input.code,
});
```

This keeps the system:

- Transparent
- Hackable
- Easy to tune

Markdown files act as your **prompt-engineering surface area**.

# ➕ Adding Your Own Tools

1. Create two files:

```
prompts/my_tool.description.md
prompts/my_tool.template.md
```

2. Add entries to `prompts.ts`
3. Register a new MCP tool in `index.ts`
4. Ship it

You can create:

- A code reviewer
- A documentation generator
- A security analyzer
- A type migrator (e.g., JS → TS)
- A whole custom workflow

MCP + Copilot CLI makes this nearly trivial.

# 🔄 Backend Replacement

Although this project currently uses:

```
copilot -p "<prompt>" --silent --allow-all-tools
```

The code does **not** depend on branding or unique features of Copilot.

You can replace the backend with:

- A local LLM
- A remote API
- A containerized compiler-assistant
- A chain of tools
- Even your own fine-tuned model

As long as it accepts a prompt and returns text, this architecture holds.

# 🤝 Contributing

PRs welcome!

Areas especially open to contribution:

- Prompt improvements
- Backend abstractions (swap Copilot CLI for an API)

# 📄 License

MIT — do whatever you like, just don’t remove yourself from the credits.
