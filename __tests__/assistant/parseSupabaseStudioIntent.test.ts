import { describe, expect, it, vi } from "vitest";

import { parseAssistantIntent } from "@/features/assistant/model/parseAssistantIntent";
import { applyAssistantUiIntent } from "@/features/assistant/services/applyAssistantUiIntent";

describe("parseAssistantIntent — supabase studio", () => {
  it.each([
    "lance le studio",
    "ouvre le studio",
    "lance studio",
    "/studio",
    "lance supabase studio",
  ])("demande le projet : %s", (phrase) => {
    expect(parseAssistantIntent(phrase)).toEqual({ kind: "supabase.studio" });
  });

  it.each([
    "stop studio",
    "arrête le studio",
    "ferme le studio",
    "coupe studio",
    "supabase stop",
  ])("arrête studio : %s", (phrase) => {
    expect(parseAssistantIntent(phrase)).toEqual({
      kind: "supabase.studio_stop",
    });
  });

  it("capture le nom de projet", () => {
    expect(parseAssistantIntent("lance le studio sur mon-app")).toEqual({
      kind: "supabase.studio",
      projectQuery: "mon-app",
    });
    expect(
      parseAssistantIntent("lance supabase studio sur wake-up jarvis"),
    ).toEqual({
      kind: "supabase.studio",
      projectQuery: "wake-up jarvis",
    });
  });
});

describe("applyAssistantUiIntent — pending studio", () => {
  const ui = {
    openTerminal: () => {},
    openGithubPanel: () => {},
    focusGithubRepo: () => {},
    onStudioLaunched: () => {},
    onStudioStopped: () => {},
  };

  it("force le follow-up même si le nom matche un intent chat", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ ok: false }), { status: 500 }),
      );

    const result = await applyAssistantUiIntent({
      text: "salut",
      intent: { kind: "chat.greeting" },
      pending: "supabase.studio",
      ui,
    });
    expect(result.intent).toEqual({
      kind: "supabase.studio",
      projectQuery: "salut",
    });
    expect(result.pending).toBeNull();
    expect(result.spokenReply).toBeTruthy();
    expect(result.spokenReply).not.toMatch(/Ça va/i);
    fetchMock.mockRestore();
  });

  it("laisse passer aide pendant le pending", async () => {
    const result = await applyAssistantUiIntent({
      text: "aide",
      intent: { kind: "help" },
      pending: "supabase.studio",
      ui,
    });
    expect(result.intent).toEqual({ kind: "help" });
    expect(result.pending).toBeNull();
  });
});
