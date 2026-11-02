"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import {
  RepoFileIcon,
  RepoFolderIcon,
  RepoLockIcon,
} from "@/features/home/components/repo/icons";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n";
import type { RepoTreeNode } from "@/lib/schemas";

type RepoFileTreeProps = {
  nodes: RepoTreeNode[];
  depth?: number;
  pathPrefix?: string;
  selectedPath?: string | null;
  onSelectFile?: (path: string) => void;
};

/** Arbre fichiers — expand/collapse + sélection aperçu. */
export function RepoFileTree({
  nodes,
  depth = 0,
  pathPrefix = "",
  selectedPath = null,
  onSelectFile,
}: RepoFileTreeProps) {
  return (
    <ul className="flex flex-col" role={depth === 0 ? "tree" : "group"}>
      {nodes.map((node) => (
        <RepoTreeNode
          key={`${pathPrefix}${node.name}`}
          node={node}
          depth={depth}
          pathPrefix={pathPrefix}
          selectedPath={selectedPath}
          {...(onSelectFile ? { onSelectFile } : {})}
        />
      ))}
    </ul>
  );
}

function RepoTreeNode({
  node,
  depth,
  pathPrefix,
  selectedPath,
  onSelectFile,
}: {
  node: RepoTreeNode;
  depth: number;
  pathPrefix: string;
  selectedPath: string | null;
  onSelectFile?: (path: string) => void;
}) {
  const path = pathPrefix === "" ? node.name : `${pathPrefix}/${node.name}`;
  const [expanded, setExpanded] = useState(
    node.kind === "dir" &&
      (node.name === "features" ||
        node.name === "repo-panel" ||
        node.name === "components" ||
        node.name === "scripts" ||
        node.name === "public"),
  );

  if (node.kind === "file") {
    const selected = selectedPath === path;
    const isProtected =
      "protected" in node &&
      (node as { protected?: boolean }).protected === true;
    return (
      <li role="treeitem" aria-selected={selected}>
        <Button
          variant="ghost"
          size="bare"
          className={cn(
            "t-mono flex w-full items-center gap-1.5 py-1 pr-2 text-sm font-normal tracking-normal normal-case",
            selected
              ? "bg-surface-2 text-accent"
              : "text-text hover:bg-surface-2/60 hover:text-accent",
          )}
          style={{ paddingLeft: `${depth * 0.75 + 0.25}rem` }}
          aria-label={
            isProtected
              ? t("home.repoFileProtectedLabel", { name: node.name })
              : node.name
          }
          onClick={() => onSelectFile?.(path)}
        >
          <RepoFileIcon className="size-3.5 shrink-0 text-text-muted" />
          <span className="min-w-0 flex-1 truncate text-left">{node.name}</span>
          {isProtected ? (
            <RepoLockIcon className="size-3 shrink-0 text-text-muted" />
          ) : null}
        </Button>
      </li>
    );
  }

  return (
    <li
      className="flex flex-col"
      role="treeitem"
      aria-expanded={expanded}
      aria-selected={false}
    >
      <Button
        variant="ghost"
        size="bare"
        aria-expanded={expanded}
        className="t-mono w-full justify-start gap-1.5 py-1 text-sm font-normal tracking-normal normal-case text-text hover:text-accent"
        style={{ paddingLeft: `${depth * 0.75 + 0.25}rem` }}
        onClick={() => setExpanded((value) => !value)}
      >
        <span className="w-3 shrink-0 text-text-muted" aria-hidden>
          {expanded ? "▾" : "▸"}
        </span>
        <RepoFolderIcon className="size-3.5 shrink-0 text-text-muted" />
        <span className="truncate">{node.name}/</span>
      </Button>
      {expanded ? (
        <RepoFileTree
          nodes={node.children}
          depth={depth + 1}
          pathPrefix={path}
          selectedPath={selectedPath}
          {...(onSelectFile ? { onSelectFile } : {})}
        />
      ) : null}
    </li>
  );
}
