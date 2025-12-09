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

Once a release is published to the tap, install with:

```bash
brew install josephma93/tap/copilot-mcp
```

Then run:

```bash
copilot-mcp
```

Prerequisite: GitHub Copilot CLI (`copilot`) must be installed and authenticated. See https://github.com/github/copilot-cli for installation and login steps, then ensure `copilot` is on your `PATH`.

### Run from source (development)

## 1. Install prerequisites

### Deno

Install [Deno](https://docs.deno.com/runtime/manual) (2.2+). TypeScript is
supported out of the box—no npm install needed.

### GitHub Copilot CLI

This project assumes `copilot` is installed and available in `$PATH`.

## 2. Start the MCP server (development)

```bash
deno task dev
```

This grants only the permissions the server needs:

- `--allow-run=copilot` (to invoke the CLI)
- `--allow-read=./prompts,./logs` (to load templates and create/check the log
  folder)
- `--allow-write=./logs` (to persist logs without polluting stdio)

The server runs over **stdio**, the standard and recommended MCP transport.

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
    "--allow-read=./prompts,./logs",
    "--allow-write=./logs",
    "--allow-env=LOG_LEVEL",
    "src/index.ts"
  ]
}
```

Claude will automatically discover the available tools:

- `code_fix`
- `code_refactor`
- `code_generate`
- `code_tests`

## Tasks

- `deno task dev` — run the MCP server locally (stdio).
- `deno task smoke` — run the smoke test (starts the server with `deno task dev` by default; override with `SERVER_CMD`).
- `deno task compile` — build a standalone binary at `dist/copilot-mcp`.

## Homebrew packaging

1. Tag a release (e.g., `v0.1.0`). The `release` GitHub Action builds macOS arm64/x86_64 binaries, tars them, and attaches artifacts plus `.sha256` files to the GitHub release.
2. In your tap repo (e.g., `josephma93/homebrew-tap`), copy `homebrew/copilot-mcp.rb.example` to `Formula/copilot-mcp.rb` and replace `__VERSION__`, `__SHA_ARM64__`, and `__SHA_X64__` with the values from the release assets.
3. Users can install with:
   ```bash
   brew install josephma93/tap/copilot-mcp
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
