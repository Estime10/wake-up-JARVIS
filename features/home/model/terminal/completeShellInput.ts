import { BUILTINS } from "@/features/home/model/terminal/runShellCommand";
import {
  isDir,
  listDir,
  resolvePath,
} from "@/features/home/model/terminal/pathUtils";

export type CompletionResult = {
  /** Nouvelle valeur du draft. */
  draft: string;
  /** Si plusieurs matches : les afficher dans le terminal (style zsh). */
  listing?: string[];
};

function commonPrefix(values: string[]): string {
  if (values.length === 0) {
    return "";
  }
  let prefix = values[0] ?? "";
  for (const value of values.slice(1)) {
    while (!value.startsWith(prefix) && prefix.length > 0) {
      prefix = prefix.slice(0, -1);
    }
  }
  return prefix;
}

function completeFrom(candidates: string[], partial: string): string[] {
  return candidates.filter((name) => name.startsWith(partial));
}

/**
 * Complétion Tab — commandes builtins + chemins du FS mock.
 */
export function completeShellInput(
  cwd: string,
  draft: string,
): CompletionResult {
  const hasTrailingSpace = /\s$/.test(draft);
  const tokens = draft.trimStart().split(/\s+/);
  const isFirstToken =
    !hasTrailingSpace && (tokens.length <= 1 || draft.trim().length === 0);

  if (isFirstToken) {
    const partial = tokens[0] ?? "";
    const matches = completeFrom([...BUILTINS], partial);
    if (matches.length === 0) {
      return { draft };
    }
    if (matches.length === 1) {
      return { draft: `${matches[0]} ` };
    }
    const shared = commonPrefix(matches);
    return {
      draft: shared.length > partial.length ? shared : draft,
      listing: matches,
    };
  }

  const command = tokens[0] ?? "";
  const pathToken = hasTrailingSpace ? "" : (tokens[tokens.length - 1] ?? "");
  const pathCommands = new Set(["cd", "ls", "cat"]);
  if (!pathCommands.has(command)) {
    return { draft };
  }

  const slash = pathToken.lastIndexOf("/");
  const dirPart = slash >= 0 ? pathToken.slice(0, slash + 1) : "";
  const namePart = slash >= 0 ? pathToken.slice(slash + 1) : pathToken;
  const baseDir = resolvePath(cwd, dirPart === "" ? "." : dirPart);
  const entries = listDir(baseDir);
  if (!entries) {
    return { draft };
  }

  const matches = completeFrom(entries, namePart).map((name) => {
    const absolute = resolvePath(baseDir, name);
    const suffix = isDir(absolute) ? "/" : " ";
    return `${dirPart}${name}${suffix}`;
  });

  if (matches.length === 0) {
    return { draft };
  }

  const prefix = draft.slice(0, draft.length - pathToken.length);

  if (matches.length === 1) {
    return { draft: `${prefix}${matches[0]}` };
  }

  const shared = commonPrefix(matches);
  const listing = matches.map((match) => match.trimEnd());
  return {
    draft: shared.length > pathToken.length ? `${prefix}${shared}` : draft,
    listing,
  };
}
