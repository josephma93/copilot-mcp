import { fromFileUrl } from "https://deno.land/std@0.224.0/path/from_file_url.ts";
import { dirname } from "https://deno.land/std@0.224.0/path/dirname.ts";
import { ensureDir } from "https://deno.land/std@0.224.0/fs/ensure_dir.ts";
import {
  ConsoleHandler,
  FileHandler,
  getLogger as stdGetLogger,
  setup,
} from "https://deno.land/std@0.224.0/log/mod.ts";
import { join } from "https://deno.land/std@0.224.0/path/join.ts";

export type LogLevel = "critical" | "error" | "warning" | "info" | "debug";
type LogMeta = Record<string, unknown> | string | undefined;

const __dirname = dirname(fromFileUrl(import.meta.url));

function resolveLogDir(): string {
  try {
    const envDir = Deno.env.get("LOG_DIR");
    if (envDir && envDir.trim().length > 0) {
      return envDir;
    }
  } catch {
    // ignore env permission errors
  }

  const home = (() => {
    try {
      return Deno.env.get("HOME");
    } catch {
      return undefined;
    }
  })();

  if (Deno.build.os === "darwin" && home) {
    return join(home, "Library", "Logs", "copilot-mcp");
  }

  if (Deno.build.os === "windows") {
    const appData = (() => {
      try {
        return Deno.env.get("LOCALAPPDATA") ?? Deno.env.get("APPDATA");
      } catch {
        return undefined;
      }
    })();
    if (appData) {
      return join(appData, "copilot-mcp", "logs");
    }
  }

  if (home) {
    const stateHome = (() => {
      try {
        return Deno.env.get("XDG_STATE_HOME");
      } catch {
        return undefined;
      }
    })();
    const base = stateHome && stateHome.trim().length > 0
      ? stateHome
      : join(home, ".local", "state");
    return join(base, "copilot-mcp", "logs");
  }

  return join(__dirname, "..", "logs");
}

const logDir = resolveLogDir();
const logFile = join(logDir, "server.log");

const logLevel: LogLevel = "info";
const stdLogLevel = "INFO" as const;

async function canUseFileLogs(path: string): Promise<boolean> {
  try {
    const [readStatus, writeStatus] = await Promise.all([
      Deno.permissions.query({ name: "read", path }),
      Deno.permissions.query({ name: "write", path }),
    ]);
    return readStatus.state === "granted" && writeStatus.state === "granted";
  } catch {
    return false;
  }
}

const fileLogsEnabled = await canUseFileLogs(logDir);

if (fileLogsEnabled) {
  await ensureDir(logDir);
}

await setup({
  handlers: fileLogsEnabled
    ? {
      file: new FileHandler("DEBUG", {
        filename: logFile,
      }),
    }
    : {
      console: new ConsoleHandler("DEBUG"),
    },
  loggers: {
    default: {
      level: stdLogLevel,
      handlers: fileLogsEnabled ? ["file"] : ["console"],
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
