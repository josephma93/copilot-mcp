export interface ToolPromptPair {
  title: string;
  description: string;
  template: string;
}

export interface AllToolPrompts {
  codeFix: ToolPromptPair;
  codeRefactor: ToolPromptPair;
  codeGenerate: ToolPromptPair;
  codeTests: ToolPromptPair;
  agent: ToolPromptPair;
}

interface PromptFile {
  title: string;
  body: string;
}

/**
 * Loads a markdown file with YAML front matter:
 * ---
 * title: My Title
 * ---
 * <markdown body>
 */
async function loadPromptFile(relativeName: string): Promise<PromptFile> {
  const url = new URL(`../prompts/${relativeName}`, import.meta.url);
  const content = await Deno.readTextFile(url);
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    throw new Error(
      `${relativeName}: missing required front matter block with title (--- title: ...)`,
    );
  }
  const [, frontMatter, body] = match;
  const titleMatch = frontMatter.match(/title\s*:\s*(.+)/);
  const title = titleMatch ? titleMatch[1].trim() : "";
  if (!title) {
    throw new Error(`${relativeName}: front matter missing title`);
  }
  return { title, body: body.trim() };
}

/**
 * Loads all tool descriptions and templates from markdown files.
 */
export async function loadAllToolPrompts(): Promise<AllToolPrompts> {
  const [
    codeFixDescription,
    codeFixTemplate,
    codeRefactorDescription,
    codeRefactorTemplate,
    codeGenerateDescription,
    codeGenerateTemplate,
    codeTestsDescription,
    codeTestsTemplate,
    agentDescription,
    agentTemplate,
  ] = await Promise.all([
    loadPromptFile("code_fix.description.md"),
    Deno.readTextFile(
      new URL("../prompts/code_fix.template.md", import.meta.url),
    ),
    loadPromptFile("code_refactor.description.md"),
    Deno.readTextFile(
      new URL("../prompts/code_refactor.template.md", import.meta.url),
    ),
    loadPromptFile("code_generate.description.md"),
    Deno.readTextFile(
      new URL("../prompts/code_generate.template.md", import.meta.url),
    ),
    loadPromptFile("code_tests.description.md"),
    Deno.readTextFile(
      new URL("../prompts/code_tests.template.md", import.meta.url),
    ),
    loadPromptFile("agent.description.md"),
    Deno.readTextFile(
      new URL("../prompts/agent.template.md", import.meta.url),
    ),
  ]);

  return {
    codeFix: {
      title: codeFixDescription.title,
      description: codeFixDescription.body,
      template: codeFixTemplate.trim(),
    },
    codeRefactor: {
      title: codeRefactorDescription.title,
      description: codeRefactorDescription.body,
      template: codeRefactorTemplate.trim(),
    },
    codeGenerate: {
      title: codeGenerateDescription.title,
      description: codeGenerateDescription.body,
      template: codeGenerateTemplate.trim(),
    },
    codeTests: {
      title: codeTestsDescription.title,
      description: codeTestsDescription.body,
      template: codeTestsTemplate.trim(),
    },
    agent: {
      title: agentDescription.title,
      description: agentDescription.body,
      template: agentTemplate.trim(),
    },
  };
}

/**
 * Renders a template by replacing {{placeholders}} with provided values.
 */
export function renderTemplate(
  template: string,
  variables: Record<string, string | undefined>,
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const safeValue = value ?? "";
    const pattern = new RegExp(`{{\\s*${key}\\s*}}`, "g");
    result = result.replace(pattern, safeValue);
  }
  return result;
}
