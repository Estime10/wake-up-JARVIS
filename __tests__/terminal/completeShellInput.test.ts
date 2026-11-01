import { describe, expect, it } from "vitest";

import { completeShellInput } from "@/features/home/model/terminal/completeShellInput";
import { TERMINAL_HOME } from "@/features/home/model/terminal/mockFs";

describe("completeShellInput", () => {
  it("complète une commande builtin unique", () => {
    const result = completeShellInput(TERMINAL_HOME, "pw");
    expect(result.draft).toBe("pwd ");
  });

  it("liste plusieurs builtins sur préfixe partagé", () => {
    const result = completeShellInput(TERMINAL_HOME, "c");
    expect(result.listing?.length).toBeGreaterThan(1);
    expect(result.listing).toEqual(
      expect.arrayContaining(["cat", "cd", "clear"]),
    );
  });

  it("complète un dossier pour cd", () => {
    const result = completeShellInput(TERMINAL_HOME, "cd De");
    expect(result.draft).toBe("cd Desktop/");
  });

  it("complète un fichier pour cat", () => {
    const result = completeShellInput(`${TERMINAL_HOME}/Desktop`, "cat notes");
    expect(result.draft).toBe("cat notes.txt ");
  });
});
