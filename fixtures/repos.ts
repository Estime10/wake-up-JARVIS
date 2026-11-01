/** Repos GitHub mock — UI only (pas d’API GitHub). */

import type { RepoPreviewKind } from "@/features/home/model/repoPanelScenario";

export type MockRepoFile = {
  kind: "file";
  name: string;
  /** Fichier sensible — cadenas + aperçu protégé. */
  protected?: boolean;
  /** Détermine l’état d’aperçu à l’ouverture. */
  preview?: RepoPreviewKind;
  sizeLabel?: string;
  linesLabel?: string;
  /** Contenu texte brut (aperçu nominal / masqué). */
  content?: string;
};

export type MockRepoDir = {
  kind: "dir";
  name: string;
  children: MockRepoNode[];
};

export type MockRepoNode = MockRepoFile | MockRepoDir;

export type MockRepoCommit = {
  id: string;
  sha: string;
  message: string;
  author: string;
  relativeTime: string;
};

export type MockRepo = {
  id: string;
  name: string;
  branch: string;
  tree: MockRepoNode[];
  commits: MockRepoCommit[];
};

const REPO_TREE_SAMPLE = `import { useId, useRef, useState } from "react";

type Props = {
  nodes: RepoNode[];
  onSelect: (path: string) => void;
};

export function RepoTree({ nodes, onSelect }: Props) {
  const id = useId();
  const rootRef = useRef<HTMLUListElement | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(["features", "repo-panel"]),
  );

  return (
    <ul ref={rootRef} id={id} role="tree">
      {/* … */}
    </ul>
  );
}
`;

const DEPLOY_SCRIPT = `#!/usr/bin/env bash
set -euo pipefail

# Deploy preview — valeurs sensibles masquées dans JARVIS
export RESEND_API_KEY=re_live_xxxxxxxxxxxxxxxx
pnpm build
vercel deploy --prebuilt
`;

export const MOCK_REPOS: MockRepo[] = [
  {
    id: "wake-up-jarvis",
    name: "wake-up-JARVIS",
    branch: "feat/home",
    tree: [
      {
        kind: "dir",
        name: "app",
        children: [
          { kind: "file", name: "layout.tsx", preview: "nominal" },
          { kind: "file", name: "page.tsx", preview: "nominal" },
        ],
      },
      {
        kind: "dir",
        name: "design",
        children: [{ kind: "file", name: "README.md", preview: "nominal" }],
      },
      {
        kind: "dir",
        name: "features",
        children: [
          {
            kind: "dir",
            name: "repo-panel",
            children: [
              {
                kind: "dir",
                name: "components",
                children: [
                  {
                    kind: "file",
                    name: "repo-tree.tsx",
                    preview: "nominal",
                    sizeLabel: "1,3 Ko",
                    linesLabel: "48 lignes",
                    content: REPO_TREE_SAMPLE,
                  },
                  {
                    kind: "file",
                    name: "use-repo-data.ts",
                    preview: "loading",
                    sizeLabel: "0,8 Ko",
                    linesLabel: "32 lignes",
                  },
                ],
              },
            ],
          },
          {
            kind: "dir",
            name: "home",
            children: [
              {
                kind: "file",
                name: "HomeScreen.tsx",
                preview: "error",
                sizeLabel: "4,2 Ko",
                linesLabel: "160 lignes",
              },
            ],
          },
        ],
      },
      {
        kind: "dir",
        name: "lib",
        children: [{ kind: "file", name: "cn.ts", preview: "nominal" }],
      },
      {
        kind: "dir",
        name: "public",
        children: [
          {
            kind: "file",
            name: "logo-jarvis.png",
            preview: "binary",
            sizeLabel: "48 Ko",
          },
          {
            kind: "file",
            name: "bundle.wasm",
            preview: "tooLarge",
            sizeLabel: "3,4 Mo",
          },
          { kind: "file", name: "favicon.ico", preview: "binary" },
        ],
      },
      {
        kind: "dir",
        name: "scripts",
        children: [
          {
            kind: "file",
            name: "deploy-preview.sh",
            preview: "masked",
            sizeLabel: "0,4 Ko",
            linesLabel: "12 lignes",
            content: DEPLOY_SCRIPT,
          },
          {
            kind: "file",
            name: "offline-note.md",
            preview: "offline",
            sizeLabel: "0,2 Ko",
            linesLabel: "6 lignes",
          },
        ],
      },
      { kind: "file", name: ".gitignore", preview: "nominal" },
      {
        kind: "file",
        name: ".npmrc",
        protected: true,
        preview: "protected",
        sizeLabel: "0,1 Ko",
      },
      { kind: "file", name: "package.json", preview: "nominal" },
      { kind: "file", name: "PLAN-UI.md", preview: "nominal" },
      { kind: "file", name: "README.md", preview: "nominal" },
      { kind: "file", name: "tsconfig.json", preview: "nominal" },
    ],
    commits: [
      {
        id: "c1",
        sha: "3f9c2a1",
        message: "feat(home): add repo panel skeleton",
        author: "DevinChat",
        relativeTime: "il y a 12 min",
      },
      {
        id: "c2",
        sha: "a81e0c4",
        message: "feat(home): mock zsh terminal with sequenced mark close",
        author: "PIXEL",
        relativeTime: "il y a 1 h",
      },
      {
        id: "c3",
        sha: "7d6a6c0",
        message: "feat(home): live geo HUD, text Terminal CTA",
        author: "DevinChat",
        relativeTime: "il y a 3 h",
      },
      {
        id: "c4",
        sha: "c4e91b2",
        message: "chore(design): repo-panel states board",
        author: "SKETCH",
        relativeTime: "il y a 5 h",
      },
    ],
  },
  {
    id: "jarvis-notes",
    name: "jarvis-notes",
    branch: "main",
    tree: [
      { kind: "file", name: "README.md", preview: "nominal" },
      { kind: "file", name: "notes.md", preview: "nominal" },
    ],
    commits: [],
  },
];

export type MockRepoFileHit = {
  path: string;
  file: MockRepoFile;
};

/** Recherche un fichier par chemin relatif (`features/repo-panel/…`). */
export function findMockRepoFile(
  nodes: MockRepoNode[],
  path: string,
): MockRepoFile | null {
  const parts = path.split("/").filter(Boolean);
  let current: MockRepoNode[] = nodes;

  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index];
    if (!part) {
      return null;
    }
    const node = current.find((item) => item.name === part);
    if (!node) {
      return null;
    }
    if (index === parts.length - 1) {
      return node.kind === "file" ? node : null;
    }
    if (node.kind !== "dir") {
      return null;
    }
    current = node.children;
  }

  return null;
}
