type LogLevel = "debug" | "info" | "warn" | "error";

export type LogFields = Record<
  string,
  string | number | boolean | null | undefined
>;

const isDev = process.env.NODE_ENV !== "production";

function formatJson(
  level: LogLevel,
  scope: string,
  message: string,
  fields?: LogFields,
): string {
  return JSON.stringify({
    ts: new Date().toISOString(),
    level,
    scope,
    message,
    ...(fields ? { fields } : {}),
  });
}

function formatDev(
  level: LogLevel,
  scope: string,
  message: string,
  fields?: LogFields,
): string {
  const tag =
    level === "error"
      ? "ERR"
      : level === "warn"
        ? "WRN"
        : level === "debug"
          ? "DBG"
          : "INF";
  const extra =
    fields && Object.keys(fields).length > 0
      ? ` ${JSON.stringify(fields)}`
      : "";
  return `[${tag}] ${scope} — ${message}${extra}`;
}

function write(
  level: LogLevel,
  scope: string,
  message: string,
  fields?: LogFields,
): void {
  // Dev : ligne lisible. Prod : JSON structuré.
  const line = isDev
    ? formatDev(level, scope, message, fields)
    : formatJson(level, scope, message, fields);

  if (level === "error") {
    console.error(line);
    return;
  }
  if (level === "warn") {
    console.warn(line);
    return;
  }
  if (level === "debug" && !isDev) {
    return;
  }
  console.log(line);
}

/**
 * Logger serveur — jamais de secrets / tokens / PII.
 * En dev : format lisible console ; en prod : JSON.
 */
export function createLogger(scope: string) {
  return {
    debug(message: string, fields?: LogFields): void {
      write("debug", scope, message, fields);
    },
    info(message: string, fields?: LogFields): void {
      write("info", scope, message, fields);
    },
    warn(message: string, fields?: LogFields): void {
      write("warn", scope, message, fields);
    },
    error(message: string, fields?: LogFields): void {
      write("error", scope, message, fields);
    },
  };
}
