import {
  MOCK_FS,
  TERMINAL_HOME,
  type FsNode,
} from "@/features/home/model/terminal/mockFs";

/** Normalise un chemin absolu (`/a/b/../c` → `/a/c`). */
export function normalizePath(path: string): string {
  const parts = path
    .split("/")
    .filter((part) => part.length > 0 && part !== ".");
  const stack: string[] = [];
  for (const part of parts) {
    if (part === "..") {
      stack.pop();
      continue;
    }
    stack.push(part);
  }
  return `/${stack.join("/")}`;
}

/** Résout `target` depuis `cwd` (`~`, chemins relatifs / absolus). */
export function resolvePath(cwd: string, target: string): string {
  const trimmed = target.trim();
  if (trimmed.length === 0 || trimmed === ".") {
    return normalizePath(cwd);
  }
  if (trimmed === "~" || trimmed.startsWith("~/")) {
    const rest = trimmed === "~" ? "" : trimmed.slice(2);
    return normalizePath(`${TERMINAL_HOME}/${rest}`);
  }
  if (trimmed.startsWith("/")) {
    return normalizePath(trimmed);
  }
  return normalizePath(`${cwd}/${trimmed}`);
}

export function displayPath(cwd: string): string {
  if (cwd === TERMINAL_HOME) {
    return "~";
  }
  if (cwd.startsWith(`${TERMINAL_HOME}/`)) {
    return `~${cwd.slice(TERMINAL_HOME.length)}`;
  }
  return cwd;
}

export function getNode(absolutePath: string): FsNode | null {
  const normalized = normalizePath(absolutePath);
  if (normalized === "/") {
    return MOCK_FS;
  }
  const parts = normalized.split("/").filter(Boolean);
  let current: FsNode = MOCK_FS;
  for (const part of parts) {
    if (current.kind !== "dir") {
      return null;
    }
    const next: FsNode | undefined = current.children[part];
    if (!next) {
      return null;
    }
    current = next;
  }
  return current;
}

export function listDir(absolutePath: string): string[] | null {
  const node = getNode(absolutePath);
  if (!node || node.kind !== "dir") {
    return null;
  }
  return Object.keys(node.children).sort((a, b) => a.localeCompare(b));
}

export function isDir(absolutePath: string): boolean {
  const node = getNode(absolutePath);
  return node?.kind === "dir";
}

export function readFile(absolutePath: string): string | null {
  const node = getNode(absolutePath);
  if (!node || node.kind !== "file") {
    return null;
  }
  return node.content;
}
