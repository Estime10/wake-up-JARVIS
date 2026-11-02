import type { RepoTreeDir, RepoTreeNode } from "@/lib/schemas";
import { formatBytesLabel } from "@/lib/github/formatBytesLabel";

export type GithubTreeEntry = {
  path: string;
  type: "blob" | "tree" | string;
  size?: number;
};

type MutableDir = {
  kind: "dir";
  name: string;
  children: Map<string, MutableNode>;
};

type MutableFile = {
  kind: "file";
  name: string;
  size?: number;
};

type MutableNode = MutableDir | MutableFile;

function toRepoNodes(map: Map<string, MutableNode>): RepoTreeNode[] {
  const nodes: RepoTreeNode[] = [];
  const sorted = [...map.values()].sort((a, b) => {
    if (a.kind !== b.kind) {
      return a.kind === "dir" ? -1 : 1;
    }
    return a.name.localeCompare(b.name, "fr");
  });
  for (const node of sorted) {
    if (node.kind === "dir") {
      const dir: RepoTreeDir = {
        kind: "dir",
        name: node.name,
        children: toRepoNodes(node.children),
      };
      nodes.push(dir);
    } else {
      nodes.push({
        kind: "file",
        name: node.name,
        ...(node.size !== undefined
          ? { sizeLabel: formatBytesLabel(node.size) }
          : {}),
      });
    }
  }
  return nodes;
}

/**
 * Transforme le tree GitHub plat (`path`) en arbre imbriqué UI.
 */
export function buildRepoTree(
  entries: readonly GithubTreeEntry[],
): RepoTreeNode[] {
  const root = new Map<string, MutableNode>();

  for (const entry of entries) {
    if (!entry.path || (entry.type !== "blob" && entry.type !== "tree")) {
      continue;
    }
    const parts = entry.path.split("/").filter(Boolean);
    if (parts.length === 0) {
      continue;
    }

    let cursor = root;
    for (let index = 0; index < parts.length; index += 1) {
      const part = parts[index]!;
      const isLeaf = index === parts.length - 1;

      if (isLeaf) {
        if (entry.type === "tree") {
          if (!cursor.has(part)) {
            cursor.set(part, { kind: "dir", name: part, children: new Map() });
          }
        } else {
          cursor.set(part, {
            kind: "file",
            name: part,
            ...(entry.size !== undefined ? { size: entry.size } : {}),
          });
        }
        break;
      }

      let next = cursor.get(part);
      if (!next || next.kind !== "dir") {
        next = { kind: "dir", name: part, children: new Map() };
        cursor.set(part, next);
      }
      cursor = next.children;
    }
  }

  return toRepoNodes(root);
}
