import { describe, expect, it } from "vitest";

import { TERMINAL_HOME } from "@/features/home/model/terminal/mockFs";
import {
  displayPath,
  getNode,
  isDir,
  listDir,
  normalizePath,
  readFile,
  resolvePath,
} from "@/features/home/model/terminal/pathUtils";

describe("normalizePath", () => {
  it("réduit . et ..", () => {
    expect(normalizePath("/Users/DevinChat/../DevinChat/Desktop/./x")).toBe(
      "/Users/DevinChat/Desktop/x",
    );
  });

  it("garde la racine", () => {
    expect(normalizePath("/")).toBe("/");
  });
});

describe("resolvePath", () => {
  it("résout ~ vers TERMINAL_HOME", () => {
    expect(resolvePath("/tmp", "~")).toBe(TERMINAL_HOME);
    expect(resolvePath("/tmp", "~/Desktop")).toBe(`${TERMINAL_HOME}/Desktop`);
  });

  it("résout relatif et absolu", () => {
    expect(resolvePath(TERMINAL_HOME, "Desktop")).toBe(
      `${TERMINAL_HOME}/Desktop`,
    );
    expect(resolvePath(TERMINAL_HOME, "/Users")).toBe("/Users");
  });
});

describe("displayPath", () => {
  it("abrège le home en ~", () => {
    expect(displayPath(TERMINAL_HOME)).toBe("~");
    expect(displayPath(`${TERMINAL_HOME}/Desktop`)).toBe("~/Desktop");
  });

  it("laisse les chemins hors home", () => {
    expect(displayPath("/tmp")).toBe("/tmp");
  });
});

describe("FS mock", () => {
  it("liste le home", () => {
    const entries = listDir(TERMINAL_HOME);
    expect(entries).toContain("Desktop");
    expect(entries).toContain("Documents");
  });

  it("détecte dossiers et fichiers", () => {
    expect(isDir(`${TERMINAL_HOME}/Desktop`)).toBe(true);
    expect(isDir(`${TERMINAL_HOME}/Desktop/notes.txt`)).toBe(false);
    expect(getNode(`${TERMINAL_HOME}/missing`)).toBeNull();
  });

  it("lit un fichier", () => {
    const content = readFile(`${TERMINAL_HOME}/Desktop/notes.txt`);
    expect(content).toContain("E.L.S.A.");
  });
});
