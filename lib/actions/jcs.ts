/**
 * Sérialisation JCS simplifiée (RFC 8785) pour objets JSON plats / imbriqués.
 * Clés triées, pas d'espace — affichage carte de signature.
 */
export function jcsStringify(value: unknown): string {
  return stringifyValue(value);
}

function stringifyValue(value: unknown): string {
  if (value === null) {
    return "null";
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError("JCS: non-finite number");
    }
    return JSON.stringify(value);
  }
  if (typeof value === "string") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stringifyValue).join(",")}]`;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(
      ([a], [b]) => (a < b ? -1 : a > b ? 1 : 0),
    );
    return `{${entries
      .map(([k, v]) => `${JSON.stringify(k)}:${stringifyValue(v)}`)
      .join(",")}}`;
  }
  throw new TypeError(`JCS: unsupported type ${typeof value}`);
}
