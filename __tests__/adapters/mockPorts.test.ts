import { describe, expect, it } from "vitest";

import { createMockPorts } from "@/adapters/mock";

describe("createMockPorts", () => {
  it("expose les six ports", () => {
    const ports = createMockPorts();
    expect(ports.llm).toBeDefined();
    expect(ports.voice).toBeDefined();
    expect(ports.action).toBeDefined();
    expect(ports.memory).toBeDefined();
    expect(ports.mail).toBeDefined();
    expect(ports.profile).toBeDefined();
  });

  it("MemoryPort démarre sans seed mock", async () => {
    const { memory } = createMockPorts();
    expect(await memory.listMessages()).toHaveLength(0);
  });

  it("MailPort mock est vide (données = Gmail live)", async () => {
    const { mail } = createMockPorts();
    expect(await mail.listRecent(3)).toHaveLength(0);
    expect(await mail.listFlagged(3)).toHaveLength(0);
    expect(await mail.listByLabel("DEV", 3)).toHaveLength(0);
    expect(await mail.listSentByLabel("DEV", 3)).toHaveLength(0);
    expect(await mail.listSent(3)).toHaveLength(0);
  });

  it("LlmPort mail-aware répond pour un label (liste vide en mock)", async () => {
    const { llm } = createMockPorts();
    const ac = new AbortController();
    const chunks: string[] = [];
    for await (const chunk of llm.reply(
      { text: "donne-moi les mails label DEV" },
      ac.signal,
    )) {
      if (chunk.type === "text") {
        chunks.push(chunk.text);
      }
    }
    expect(chunks.join("")).toMatch(/Aucun mail/i);
  });

  it("LlmPort streame une réponse texte puis done", async () => {
    const { llm } = createMockPorts();
    const ac = new AbortController();
    const chunks: string[] = [];
    let done = false;
    for await (const chunk of llm.reply({ text: "salut" }, ac.signal)) {
      if (chunk.type === "text") {
        chunks.push(chunk.text);
      }
      if (chunk.type === "done") {
        done = true;
      }
    }
    expect(chunks.join("").length).toBeGreaterThan(10);
    expect(done).toBe(true);
  });

  it("LlmPort #erreur échoue", async () => {
    const { llm } = createMockPorts();
    const ac = new AbortController();
    await expect(async () => {
      for await (const chunk of llm.reply({ text: "#erreur" }, ac.signal)) {
        void chunk;
      }
    }).rejects.toThrow(/#erreur/);
  });

  it("LlmPort #action propose une action niveau 1", async () => {
    const { llm } = createMockPorts();
    const ac = new AbortController();
    let proposalRisk: number | undefined;
    for await (const chunk of llm.reply({ text: "voir #action" }, ac.signal)) {
      if (chunk.type === "action-proposal") {
        proposalRisk = chunk.proposal.risk;
      }
    }
    expect(proposalRisk).toBe(1);
  });
});
