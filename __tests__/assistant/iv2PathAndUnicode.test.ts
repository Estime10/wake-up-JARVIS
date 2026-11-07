import { describe, expect, it } from "vitest";

import { parseAssistantIntent } from "@/features/assistant/model/parseAssistantIntent";
import {
  isUnsafePathCapture,
  normalizeIntentTextV2,
} from "@/features/assistant/model/intents/v2/routeIntentV2";

describe("IV2-03 path traversal", () => {
  it("détecte les captures dangereuses", () => {
    expect(isUnsafePathCapture("../../etc")).toBe(true);
    expect(isUnsafePathCapture("/etc/passwd")).toBe(true);
    expect(isUnsafePathCapture("Documents")).toBe(false);
  });

  it("refuse ouvre le dossier ../../etc", () => {
    const intent = parseAssistantIntent("ouvre le dossier ../../etc");
    expect(intent?.kind).toBe("refuse.write");
  });
});

describe("IV2-07 unicode / obfuscation", () => {
  it("normalise les espaces zero-width", () => {
    expect(normalizeIntentTextV2("ouvre la corbe\u200bille")).toBe(
      "ouvre la corbeille",
    );
  });

  it("refuse la corbeille même avec U+200B", () => {
    const intent = parseAssistantIntent("ouvre la corbe\u200bille");
    expect(intent?.kind).toBe("refuse.write");
  });

  it("refuse corbeille en homoglyphes cyrilliques", () => {
    // с о р → c o p… ; « сorbeille » avec с cyrillique
    const intent = parseAssistantIntent("ouvre la сorbeille");
    expect(intent?.kind).toBe("refuse.write");
  });

  it("refuse corbeille lettres espacées", () => {
    const intent = parseAssistantIntent("ouvre la c o r b e i l l e");
    expect(intent?.kind).toBe("refuse.write");
  });
});
