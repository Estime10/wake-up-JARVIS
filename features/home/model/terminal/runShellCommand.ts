import {
  getNode,
  listDir,
  readFile,
  resolvePath,
} from "@/features/home/model/terminal/pathUtils";
import { TERMINAL_HOME } from "@/features/home/model/terminal/mockFs";
import { t } from "@/lib/i18n";

export type ShellSession = {
  cwd: string;
};

export type ShellResult = {
  cwd: string;
  lines: string[];
  clear?: boolean;
};

const BUILTINS = [
  "cd",
  "ls",
  "pwd",
  "clear",
  "echo",
  "cat",
  "whoami",
  "hostname",
  "date",
  "help",
] as const;

function tokenize(input: string): string[] {
  return input.trim().split(/\s+/).filter(Boolean);
}

function notADirectory(path: string): string {
  return `cd: not a directory: ${path}`;
}

function noSuchFile(command: string, path: string): string {
  return `${command}: ${path}: No such file or directory`;
}

/** Exécute une ligne façon zsh sur le FS mock. */
export function runShellCommand(
  session: ShellSession,
  input: string,
): ShellResult {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return { cwd: session.cwd, lines: [] };
  }

  const tokens = tokenize(trimmed);
  const command = tokens[0] ?? "";
  const args = tokens.slice(1);

  switch (command) {
    case "clear":
      return { cwd: session.cwd, lines: [], clear: true };
    case "pwd":
      return { cwd: session.cwd, lines: [session.cwd] };
    case "whoami":
      return { cwd: session.cwd, lines: [t("user.displayName")] };
    case "hostname":
      return { cwd: session.cwd, lines: [t("user.terminalHost")] };
    case "date":
      return { cwd: session.cwd, lines: [new Date().toString()] };
    case "help":
      return {
        cwd: session.cwd,
        lines: [`builtins: ${BUILTINS.join(" ")}`],
      };
    case "echo":
      return { cwd: session.cwd, lines: [args.join(" ")] };
    case "cd": {
      const target = args[0] ?? TERMINAL_HOME;
      const next = resolvePath(session.cwd, target);
      const node = getNode(next);
      if (!node) {
        return {
          cwd: session.cwd,
          lines: [noSuchFile("cd", args[0] ?? target)],
        };
      }
      if (node.kind !== "dir") {
        return { cwd: session.cwd, lines: [notADirectory(args[0] ?? target)] };
      }
      return { cwd: next, lines: [] };
    }
    case "ls": {
      const target = args[0] ?? ".";
      const path = resolvePath(session.cwd, target);
      const entries = listDir(path);
      if (!entries) {
        const node = getNode(path);
        if (node?.kind === "file") {
          const name = path.split("/").pop() ?? target;
          return { cwd: session.cwd, lines: [name] };
        }
        return {
          cwd: session.cwd,
          lines: [noSuchFile("ls", target)],
        };
      }
      const labeled = entries.map((name) => {
        const child = getNode(resolvePath(path, name));
        return child?.kind === "dir" ? `${name}/` : name;
      });
      return {
        cwd: session.cwd,
        lines: labeled.length === 0 ? [] : [labeled.join("  ")],
      };
    }
    case "cat": {
      if (args.length === 0) {
        return { cwd: session.cwd, lines: ["cat: missing file operand"] };
      }
      const output: string[] = [];
      for (const arg of args) {
        const path = resolvePath(session.cwd, arg);
        const content = readFile(path);
        if (content === null) {
          const node = getNode(path);
          if (node?.kind === "dir") {
            output.push(`cat: ${arg}: Is a directory`);
          } else {
            output.push(noSuchFile("cat", arg));
          }
          continue;
        }
        const parts = content.replace(/\n$/, "").split("\n");
        output.push(...parts);
      }
      return { cwd: session.cwd, lines: output };
    }
    default:
      return {
        cwd: session.cwd,
        lines: [t("home.terminalCommandNotFound", { command })],
      };
  }
}

export { BUILTINS };
