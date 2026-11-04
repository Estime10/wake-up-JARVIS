/** Arborescence mock façon home macOS (UI only — pas le vrai disque). */

export type FsFile = { kind: "file"; content: string };
export type FsDir = { kind: "dir"; children: Record<string, FsNode> };
export type FsNode = FsFile | FsDir;

export const TERMINAL_HOME = "/Users/DevinChat";

export const MOCK_FS: FsDir = {
  kind: "dir",
  children: {
    Users: {
      kind: "dir",
      children: {
        DevinChat: {
          kind: "dir",
          children: {
            Desktop: {
              kind: "dir",
              children: {
                "notes.txt": {
                  kind: "file",
                  content: "E.L.S.A. — notes locales\n",
                },
              },
            },
            Documents: { kind: "dir", children: {} },
            Downloads: { kind: "dir", children: {} },
            Repositories: {
              kind: "dir",
              children: {
                CREATIVITY: {
                  kind: "dir",
                  children: {
                    "wake-up-JARVIS": {
                      kind: "dir",
                      children: {
                        "package.json": {
                          kind: "file",
                          content: '{\n  "name": "wake-up-jarvis"\n}\n',
                        },
                        "README.md": {
                          kind: "file",
                          content: "# wake-up-JARVIS\n",
                        },
                        "AGENTS.md": {
                          kind: "file",
                          content: "# Agent rules\n",
                        },
                      },
                    },
                  },
                },
              },
            },
            ".zshrc": {
              kind: "file",
              content: "# zsh config (mock)\n",
            },
          },
        },
      },
    },
  },
};
