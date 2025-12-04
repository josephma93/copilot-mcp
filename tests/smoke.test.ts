import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { Client } from "npm:@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "npm:@modelcontextprotocol/sdk/client/stdio.js";

// Prefer the dev task from deno.json if not overridden.
const defaultCmd = "deno task dev";
const serverCmd = Deno.env.get("SERVER_CMD") ?? defaultCmd;

Deno.test({
  name: "smoke: initialize, list tools, and call each tool",
  sanitizeResources: false,
  sanitizeOps: false,
}, async () => {
  const client = new Client({
    name: "smoke-test",
    version: "0.0.0",
  });

  // Provide a minimal env so we don't need broad --allow-env.
  const env = {
    PATH: Deno.env.get("PATH") ?? "",
    HOME: Deno.env.get("HOME") ?? "",
    SHELL: Deno.env.get("SHELL") ?? "/bin/sh",
    LOG_LEVEL: Deno.env.get("LOG_LEVEL") ?? "info",
  };

  const transport = new StdioClientTransport({
    command: "sh",
    args: ["-c", serverCmd],
    stderr: "pipe",
    env,
  });

  await client.connect(transport);

  try {
    const tools = await client.listTools();
    assert(Array.isArray(tools.tools), "tools should be an array");
    assertEquals(tools.tools.length >= 4, true);

    const calls = [
      {
        name: "code_fix",
        arguments: {
          goal: "Fix returning undefined when input is empty",
          code:
            "function first(x){ if(!x || !x.length) return null; return x[0]; }",
          language: "javascript",
        },
      },
      {
        name: "code_refactor",
        arguments: {
          goal: "Improve readability",
          code: "function sum(a,b){return a+b}",
          language: "javascript",
        },
      },
      {
        name: "code_generate",
        arguments: {
          spec: "Create a function that adds two numbers.",
          language: "javascript",
        },
      },
      {
        name: "code_tests",
        arguments: {
          code: "function sum(a,b){ return a+b; }",
          language: "javascript",
          framework: "jest",
        },
      },
    ];

    for (const call of calls) {
      const resp = await client.callTool(call);
      assert(
        Array.isArray(resp.content),
        "tool call should return content array",
      );
      const textItem = resp.content.find((c: { type: string }) =>
        c.type === "text"
      );
      assert(textItem, "tool call should include text content");
    }
  } finally {
    await client.close();
    await transport.close();
  }
});
