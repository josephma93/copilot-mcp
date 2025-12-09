import { McpServer } from "npm:@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "npm:@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "npm:zod";
import {
  AllToolPrompts,
  loadAllToolPrompts,
  renderTemplate,
} from "./prompts.ts";
import { getLogger, truncate } from "./logger.ts";

const decoder = new TextDecoder();
const appLog = getLogger("server");
const copilotLog = getLogger("copilot");

interface CodeFixInput {
  goal: string;
  code: string;
  language?: string;
  context?: string;
}

interface CodeRefactorInput {
  goal: string;
  code: string;
  language?: string;
  constraints?: string;
}

interface CodeGenerateInput {
  spec: string;
  language: string;
  context?: string;
  style?: string;
}

interface CodeTestsInput {
  code: string;
  language: string;
  framework?: string;
  requirements?: string;
}

/**
 * Runs the copilot CLI with a single prompt and returns its textual output.
 */
async function runCopilotPrompt(prompt: string): Promise<string> {
  const start = Date.now();
  copilotLog.debug(
    {
      promptPreview: truncate(prompt),
      promptLength: prompt.length,
    },
    "Running copilot with prompt",
  );

  try {
    const copilot = new Deno.Command("copilot", {
      args: [
        "-p",
        prompt,
        "--allow-all-tools",
        "--allow-all-paths",
        "--add-dir",
        Deno.cwd(),
      ],
      stdin: "null",
      stdout: "piped",
      stderr: "piped",
    });

    const { code, stdout, stderr } = await copilot.output();
    const trimmedStdout = decoder.decode(stdout).trim();
    const trimmedStderr = decoder.decode(stderr).trim();

    if (code === 0) {
      if (trimmedStdout.length > 0) {
        copilotLog.info(
          {
            durationMs: Date.now() - start,
            outputPreview: truncate(trimmedStdout),
            outputLength: trimmedStdout.length,
          },
          "Copilot execution succeeded",
        );
        return trimmedStdout;
      }

      if (trimmedStderr.length > 0) {
        copilotLog.warn(
          {
            durationMs: Date.now() - start,
            outputPreview: truncate(trimmedStderr),
            outputLength: trimmedStderr.length,
          },
          "Copilot returned stderr output",
        );
        return trimmedStderr;
      }

      copilotLog.warn(
        { durationMs: Date.now() - start },
        "Copilot produced no output",
      );
      return "No output produced by copilot.";
    }

    const fallbackOutput = trimmedStderr || trimmedStdout;
    copilotLog.error(
      {
        durationMs: Date.now() - start,
        exitCode: code,
        outputPreview: truncate(fallbackOutput),
        outputLength: fallbackOutput.length,
      },
      "Copilot returned a non-zero exit code",
    );
    return `Copilot exited with code ${code}: ${fallbackOutput || "no output"}`;
  } catch (error) {
    copilotLog.error(
      {
        durationMs: Date.now() - start,
        error: error instanceof Error ? error.message : String(error),
      },
      "Copilot execution failed",
    );
    const message = error instanceof Error ? error.message : String(error);
    return `Error running copilot: ${message}`;
  }
}

/**
 * Creates and configures the MCP server instance.
 */
async function createServer(): Promise<McpServer> {
  const prompts: AllToolPrompts = await loadAllToolPrompts();

  const server = new McpServer({
    name: "copilot-mcp",
    version: "0.1.0",
  });

  server.registerTool(
    "code_fix",
    {
      title: prompts.codeFix.title,
      description: prompts.codeFix.description,
      inputSchema: z.object({
        goal: z.string().min(1),
        code: z.string().min(1),
        language: z.string().optional(),
        context: z.string().optional(),
      }),
    },
    async (input: CodeFixInput) => {
      const start = Date.now();
      const toolLog = getLogger("code_fix");
      toolLog.info(
        {
          goal: truncate(input.goal, 120),
          language: input.language,
          codeChars: input.code.length,
          contextChars: input.context?.length ?? 0,
        },
        "request received",
      );

      const finalPrompt = renderTemplate(prompts.codeFix.template, {
        goal: input.goal,
        code: input.code,
        language: input.language,
        context: input.context,
      });

      toolLog.debug(
        {
          promptPreview: truncate(finalPrompt),
          promptLength: finalPrompt.length,
        },
        "rendered prompt",
      );

      const output = await runCopilotPrompt(finalPrompt);

      toolLog.info(
        {
          durationMs: Date.now() - start,
          outputPreview: truncate(output),
          outputLength: output.length,
        },
        "completed",
      );

      return {
        content: [
          {
            type: "text" as const,
            text: output,
          },
        ],
      };
    },
  );

  server.registerTool(
    "code_refactor",
    {
      title: prompts.codeRefactor.title,
      description: prompts.codeRefactor.description,
      inputSchema: z.object({
        goal: z.string().min(1),
        code: z.string().min(1),
        language: z.string().optional(),
        constraints: z.string().optional(),
      }),
    },
    async (input: CodeRefactorInput) => {
      const start = Date.now();
      const toolLog = getLogger("code_refactor");
      toolLog.info(
        {
          goal: truncate(input.goal, 120),
          language: input.language,
          codeChars: input.code.length,
          constraintsChars: input.constraints?.length ?? 0,
        },
        "request received",
      );

      const finalPrompt = renderTemplate(prompts.codeRefactor.template, {
        goal: input.goal,
        code: input.code,
        language: input.language,
        constraints: input.constraints,
      });

      toolLog.debug(
        {
          promptPreview: truncate(finalPrompt),
          promptLength: finalPrompt.length,
        },
        "rendered prompt",
      );

      const output = await runCopilotPrompt(finalPrompt);

      toolLog.info(
        {
          durationMs: Date.now() - start,
          outputPreview: truncate(output),
          outputLength: output.length,
        },
        "completed",
      );

      return {
        content: [
          {
            type: "text" as const,
            text: output,
          },
        ],
      };
    },
  );

  server.registerTool(
    "code_generate",
    {
      title: prompts.codeGenerate.title,
      description: prompts.codeGenerate.description,
      inputSchema: z.object({
        spec: z.string().min(1),
        language: z.string().min(1),
        context: z.string().optional(),
        style: z.string().optional(),
      }),
    },
    async (input: CodeGenerateInput) => {
      const start = Date.now();
      const toolLog = getLogger("code_generate");
      toolLog.info(
        {
          spec: truncate(input.spec, 120),
          language: input.language,
          contextChars: input.context?.length ?? 0,
          styleChars: input.style?.length ?? 0,
        },
        "request received",
      );

      const finalPrompt = renderTemplate(prompts.codeGenerate.template, {
        spec: input.spec,
        language: input.language,
        context: input.context,
        style: input.style,
      });

      toolLog.debug(
        {
          promptPreview: truncate(finalPrompt),
          promptLength: finalPrompt.length,
        },
        "rendered prompt",
      );

      const output = await runCopilotPrompt(finalPrompt);

      toolLog.info(
        {
          durationMs: Date.now() - start,
          outputPreview: truncate(output),
          outputLength: output.length,
        },
        "completed",
      );

      return {
        content: [
          {
            type: "text" as const,
            text: output,
          },
        ],
      };
    },
  );

  server.registerTool(
    "code_tests",
    {
      title: prompts.codeTests.title,
      description: prompts.codeTests.description,
      inputSchema: z.object({
        code: z.string().min(1),
        language: z.string().min(1),
        framework: z.string().optional(),
        requirements: z.string().optional(),
      }),
    },
    async (input: CodeTestsInput) => {
      const start = Date.now();
      const toolLog = getLogger("code_tests");
      toolLog.info(
        {
          language: input.language,
          framework: input.framework,
          codeChars: input.code.length,
          requirementsChars: input.requirements?.length ?? 0,
        },
        "request received",
      );

      const finalPrompt = renderTemplate(prompts.codeTests.template, {
        code: input.code,
        language: input.language,
        framework: input.framework,
        requirements: input.requirements,
      });

      toolLog.debug(
        {
          promptPreview: truncate(finalPrompt),
          promptLength: finalPrompt.length,
        },
        "rendered prompt",
      );

      const output = await runCopilotPrompt(finalPrompt);

      toolLog.info(
        {
          durationMs: Date.now() - start,
          outputPreview: truncate(output),
          outputLength: output.length,
        },
        "completed",
      );

      return {
        content: [
          {
            type: "text" as const,
            text: output,
          },
        ],
      };
    },
  );

  return server;
}

if (import.meta.main) {
  const args = Deno.args;
  if (args.includes("-h") || args.includes("--help")) {
    console.log("copilot-mcp (MCP over stdio). Run with an MCP client; no CLI options.");
    Deno.exit(0);
  }
if (import.meta.main) {
  const args = Deno.args;
  if (args.includes("-h") || args.includes("--help")) {
    console.log(
      "copilot-mcp (MCP over stdio). Run with an MCP client; no CLI options.",
    );
    Deno.exit(0);
  }

  const transport = new StdioServerTransport();
  const server = await createServer();
  await server.connect(transport);
  appLog.info("copilot-mcp server is running over stdio");
}
}
