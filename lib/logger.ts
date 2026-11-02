type LogLevel = "info" | "warn" | "error";

type LogFields = Record<string, string | number | boolean | null | undefined>;

function formatLine(
  level: LogLevel,
  scope: string,
  message: string,
  fields?: LogFields,
): string {
  const payload = {
    ts: new Date().toISOString(),
    level,
    scope,
    message,
    ...(fields ? { fields } : {}),
  };
  return JSON.stringify(payload);
}

function write(level: LogLevel, line: string): void {
  const stream = level === "error" ? process.stderr : process.stdout;
  stream.write(`${line}\n`);
}

/**
 * Logger serveur structuré (stdout/stderr) — jamais de secrets / tokens / PII.
 */
export function createLogger(scope: string) {
  return {
    info(message: string, fields?: LogFields): void {
      write("info", formatLine("info", scope, message, fields));
    },
    warn(message: string, fields?: LogFields): void {
      write("warn", formatLine("warn", scope, message, fields));
    },
    error(message: string, fields?: LogFields): void {
      write("error", formatLine("error", scope, message, fields));
    },
  };
}
