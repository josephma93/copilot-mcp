import { ensureDir } from "https://deno.land/std@0.224.0/fs/ensure_dir.ts";
import {
  FileHandler,
  getLogger as stdGetLogger,
  setup,
} from "https://deno.land/std@0.224.0/log/mod.ts";
import { join } from "https://deno.land/std@0.224.0/path/join.ts";

export type LogLevel = "critical" | "error" | "warning" | "info" | "debug";
type LogMeta = Record<string, unknown> | string | undefined;

const logDir = join(Deno.cwd(), "logs");
const logFile = join(logDir, "server.log");

function resolveLogLevel(): LogLevel {
  try {
    return (Deno.env.get("LOG_LEVEL") as LogLevel | undefined) ?? "info";
  } catch {
    return "info";
  }
}

const logLevel = resolveLogLevel();

await ensureDir(logDir);
await setup({
  handlers: {
    file: new FileHandler("DEBUG", {
      filename: logFile,
    }),
  },
  loggers: {
    default: {
      level: "DEBUG",
      handlers: ["file"],
    },
  },
});

export function getLogger(scope: string) {
  const base = stdGetLogger("default");
  const write = (level: LogLevel) => (meta?: LogMeta, message?: string) => {
    const isStringMeta = typeof meta === "string";
    const payload = isStringMeta ? {} : meta ?? {};
    const msg = isStringMeta ? message ?? meta : message ?? "";
    const entry = {
      level,
      time: new Date().toISOString(),
      msg,
      scope,
      ...payload,
    };
    // @ts-ignore dynamic method name on std logger
    base[level](JSON.stringify(entry));
  };

  return {
    critical: write("critical"),
    error: write("error"),
    warn: write("warning"),
    info: write("info"),
    debug: write("debug"),
  };
}

export function truncate(value: string, max = 400): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max)}… (truncated, ${value.length} chars total)`;
}

export const logger = getLogger("server");
