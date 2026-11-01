import { describe, expect, it } from "vitest";

import { TERMINAL_HOME } from "@/features/home/model/terminal/mockFs";
import { runShellCommand } from "@/features/home/model/terminal/runShellCommand";

const session = { cwd: TERMINAL_HOME };

describe("runShellCommand", () => {
  it("pwd / whoami / clear", () => {
    expect(runShellCommand(session, "pwd").lines).toEqual([TERMINAL_HOME]);
    expect(runShellCommand(session, "whoami").lines[0]).toBeTruthy();
    expect(runShellCommand(session, "clear").clear).toBe(true);
  });

  it("cd change le cwd et refuse un fichier", () => {
    const ok = runShellCommand(session, "cd Desktop");
    expect(ok.cwd).toBe(`${TERMINAL_HOME}/Desktop`);
    expect(ok.lines).toEqual([]);

    const bad = runShellCommand(session, "cd Desktop/notes.txt");
    expect(bad.cwd).toBe(TERMINAL_HOME);
    expect(bad.lines[0]).toMatch(/not a directory/);
  });

  it("ls liste et cat lit", () => {
    const ls = runShellCommand(session, "ls");
    expect(ls.lines[0]).toContain("Desktop/");

    const cat = runShellCommand(
      { cwd: `${TERMINAL_HOME}/Desktop` },
      "cat notes.txt",
    );
    expect(cat.lines.join("\n")).toContain("JARVIS");
  });

  it("commande inconnue", () => {
    const result = runShellCommand(session, "foobar");
    expect(result.lines[0]).toContain("foobar");
  });

  it("ligne vide = no-op", () => {
    expect(runShellCommand(session, "   ")).toEqual({
      cwd: TERMINAL_HOME,
      lines: [],
    });
  });
});
