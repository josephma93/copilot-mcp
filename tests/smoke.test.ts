import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { Client } from "npm:@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "npm:@modelcontextprotocol/sdk/client/stdio.js";

const decoder = new TextDecoder();
const defaultCmd = "deno task dev";
const serverCmd = Deno.env.get("SERVER_CMD") ?? defaultCmd;
const env = {
  PATH: Deno.env.get("PATH") ?? "",
  HOME: Deno.env.get("HOME") ?? "",
  SHELL: Deno.env.get("SHELL") ?? "/bin/sh",
  LOG_DIR: Deno.env.get("LOG_DIR") ?? "",
};

async function runDenoCheck(): Promise<void> {
  const command = new Deno.Command("deno", {
    args: ["check", "src/index.ts"],
    stdout: "piped",
    stderr: "piped",
  });
  const { code, stdout, stderr } = await command.output();
  if (code !== 0) {
    const out = new TextDecoder().decode(stdout).trim();
    const err = new TextDecoder().decode(stderr).trim();
    throw new Error(
      `deno check failed for src/index.ts\n${err || out || "no output"}`,
    );
  }
}

let denoCheckPromise: Promise<void> | null = null;

function ensureDenoCheck(): Promise<void> {
  if (!denoCheckPromise) {
    const checkStart = Date.now();
    logStep("deno check src/index.ts start");
    denoCheckPromise = runDenoCheck().then(() => {
      logStep("deno check src/index.ts ok", checkStart);
    });
  }
  return denoCheckPromise;
}

function logStep(message: string, start?: number): void {
  const suffix = start ? ` (${Date.now() - start}ms)` : "";
  console.log(`[smoke] ${message}${suffix}`);
}

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`${label} timed out after ${ms}ms`)),
        ms,
      )
    ),
  ]);
}

function formatStderr(chunks: string[], maxChars = 4000): string {
  const combined = chunks.join("");
  if (combined.length <= maxChars) {
    return combined;
  }
  return combined.slice(-maxChars);
}

function attachStderr(transport: StdioClientTransport, chunks: string[]): void {
  const stderr = transport.stderr;
  if (!stderr || typeof stderr.on !== "function") {
    return;
  }
  stderr.on("data", (chunk: unknown) => {
    if (typeof chunk === "string") {
      chunks.push(chunk);
      return;
    }
    if (chunk instanceof Uint8Array) {
      chunks.push(decoder.decode(chunk));
      return;
    }
    chunks.push(String(chunk));
  });
  stderr.on("error", (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    chunks.push(`\n[stderr error] ${message}`);
  });
}

async function withClient(
  label: string,
  fn: (client: Client) => Promise<void>,
): Promise<void> {
  await ensureDenoCheck();
  const stderrChunks: string[] = [];
  const client = new Client({
    name: "smoke-test",
    version: "0.0.0",
  });
  const transport = new StdioClientTransport({
    command: "sh",
    args: ["-c", serverCmd],
    stderr: "pipe",
    env,
  });
  attachStderr(transport, stderrChunks);

  try {
    const connectStart = Date.now();
    logStep(`${label}: client.connect start (${serverCmd})`);
    await withTimeout(client.connect(transport), 20_000, "client.connect");
    logStep(`${label}: client.connect ok`, connectStart);
    await fn(client);
  } catch (error) {
    const stderrOutput = formatStderr(stderrChunks);
    if (stderrOutput.trim().length > 0) {
      console.error(
        `[smoke] ${label}: server stderr (tail):\n${stderrOutput.trim()}`,
      );
    }
    throw error;
  } finally {
    await client.close();
    await transport.close();
  }
}

Deno.test({
  name: "smoke: list tools",
  sanitizeResources: false,
  sanitizeOps: false,
}, async () => {
  await withClient("list tools", async (client) => {
    const listStart = Date.now();
    logStep("list tools: client.listTools start");
    const tools = await withTimeout(client.listTools(), 20_000, "listTools");
    logStep("list tools: client.listTools ok", listStart);
    assert(Array.isArray(tools.tools), "tools should be an array");
    assertEquals(tools.tools.length >= 5, true);
  });
});

Deno.test({
  name: "smoke: tool code_fix",
  sanitizeResources: false,
  sanitizeOps: false,
}, async () => {
  await withClient("code_fix", async (client) => {
    const callStart = Date.now();
    logStep("code_fix: client.callTool start");
    const resp = await withTimeout(
      client.callTool({
        name: "code_fix",
        arguments: {
          goal: "Fix returning undefined when input is empty",
          code:
            "function first(x){ if(!x || !x.length) return null; return x[0]; }",
          language: "javascript",
        },
      }),
      60_000,
      "callTool code_fix",
    );
    logStep("code_fix: client.callTool ok", callStart);
    assert(Array.isArray(resp.content), "tool call should return content array");
    const textItem = resp.content.find((c: { type: string }) =>
      c.type === "text"
    );
    assert(textItem, "tool call should include text content");
  });
});

Deno.test({
  name: "smoke: tool code_refactor",
  sanitizeResources: false,
  sanitizeOps: false,
}, async () => {
  await withClient("code_refactor", async (client) => {
    const callStart = Date.now();
    logStep("code_refactor: client.callTool start");
    const resp = await withTimeout(
      client.callTool({
        name: "code_refactor",
        arguments: {
          goal: "Improve readability",
          code: "function sum(a,b){return a+b}",
          language: "javascript",
        },
      }),
      60_000,
      "callTool code_refactor",
    );
    logStep("code_refactor: client.callTool ok", callStart);
    assert(Array.isArray(resp.content), "tool call should return content array");
    const textItem = resp.content.find((c: { type: string }) =>
      c.type === "text"
    );
    assert(textItem, "tool call should include text content");
  });
});

Deno.test({
  name: "smoke: tool code_generate",
  sanitizeResources: false,
  sanitizeOps: false,
}, async () => {
  await withClient("code_generate", async (client) => {
    const callStart = Date.now();
    logStep("code_generate: client.callTool start");
    const resp = await withTimeout(
      client.callTool({
        name: "code_generate",
        arguments: {
          spec: "Create a function that adds two numbers.",
          language: "javascript",
        },
      }),
      60_000,
      "callTool code_generate",
    );
    logStep("code_generate: client.callTool ok", callStart);
    assert(Array.isArray(resp.content), "tool call should return content array");
    const textItem = resp.content.find((c: { type: string }) =>
      c.type === "text"
    );
    assert(textItem, "tool call should include text content");
  });
});

Deno.test({
  name: "smoke: tool code_tests",
  sanitizeResources: false,
  sanitizeOps: false,
}, async () => {
  await withClient("code_tests", async (client) => {
    const callStart = Date.now();
    logStep("code_tests: client.callTool start");
    const resp = await withTimeout(
      client.callTool({
        name: "code_tests",
        arguments: {
          code: "function sum(a,b){ return a+b; }",
          language: "javascript",
          framework: "jest",
        },
      }),
      90_000,
      "callTool code_tests",
    );
    logStep("code_tests: client.callTool ok", callStart);
    assert(Array.isArray(resp.content), "tool call should return content array");
    const textItem = resp.content.find((c: { type: string }) =>
      c.type === "text"
    );
    assert(textItem, "tool call should include text content");
  });
});

Deno.test({
  name: "smoke: tool agent",
  sanitizeResources: false,
  sanitizeOps: false,
}, async () => {
  await withClient("agent", async (client) => {
    const callStart = Date.now();
    logStep("agent: client.callTool start");
    const resp = await withTimeout(
      client.callTool({
        name: "agent",
        arguments: {
          goal: "Summarize the add function behavior.",
          files: ["add.ts"],
        },
      }),
      60_000,
      "callTool agent",
    );
    logStep("agent: client.callTool ok", callStart);
    assert(Array.isArray(resp.content), "tool call should return content array");
    const textItem = resp.content.find((c: { type: string }) =>
      c.type === "text"
    );
    assert(textItem, "tool call should include text content");
  });
});
