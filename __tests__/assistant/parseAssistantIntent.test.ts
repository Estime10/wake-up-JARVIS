import { describe, expect, it } from "vitest";

import { parseAssistantIntent } from "@/features/assistant/model/parseAssistantIntent";

describe("parseAssistantIntent — registre phrases v2", () => {
  it("help / chat / refus", () => {
    expect(parseAssistantIntent("aide")).toEqual({ kind: "help" });
    expect(parseAssistantIntent("what can you do")).toEqual({ kind: "help" });
    expect(parseAssistantIntent("bonjour jarvis")).toEqual({
      kind: "chat.greeting",
    });
    expect(parseAssistantIntent("comment tu vas")).toEqual({
      kind: "chat.how_are_you",
    });
    expect(parseAssistantIntent("ça va")).toEqual({
      kind: "chat.how_are_you",
    });
    expect(parseAssistantIntent("how are you")).toEqual({
      kind: "chat.how_are_you",
    });
    expect(parseAssistantIntent("merci beaucoup")).toEqual({
      kind: "chat.thanks",
    });
    expect(parseAssistantIntent("supprime tous mes mails")).toMatchObject({
      kind: "refuse.write",
    });
    expect(parseAssistantIntent("force push")).toMatchObject({
      kind: "refuse.write",
    });
  });

  it("mails", () => {
    expect(parseAssistantIntent("mes derniers mails")).toEqual({
      kind: "mail.list_recent",
    });
    expect(parseAssistantIntent("montre moi tout")).toEqual({
      kind: "mail.overview",
    });
    expect(parseAssistantIntent("combien de mails")).toEqual({
      kind: "mail.count",
    });
    expect(parseAssistantIntent("combien de mails dans DEV")).toEqual({
      kind: "mail.count",
      label: "dev",
    });
    expect(parseAssistantIntent("mails du label DEV")).toEqual({
      kind: "mail.list_by_label",
      label: "dev",
    });
    expect(parseAssistantIntent("donne moi les mails label DEV")).toEqual({
      kind: "mail.list_by_label",
      label: "dev",
    });
    expect(parseAssistantIntent("mes mails envoyés")).toEqual({
      kind: "mail.list_sent",
    });
    expect(parseAssistantIntent("ce que j'ai répondu en DEV")).toEqual({
      kind: "mail.list_sent_by_label",
      label: "dev",
    });
    expect(parseAssistantIntent("mails importants")).toEqual({
      kind: "mail.list_flagged",
    });
  });

  it("github", () => {
    expect(parseAssistantIntent("statut github")).toEqual({
      kind: "github.status",
    });
    expect(parseAssistantIntent("liste mes repos")).toEqual({
      kind: "github.list_repos",
    });
    expect(parseAssistantIntent("pr ouvertes sur wake-up-JARVIS")).toEqual({
      kind: "github.list_pulls",
      repoQuery: "wake-up-jarvis",
    });
    expect(parseAssistantIntent("commits sur foo/bar")).toEqual({
      kind: "github.list_commits",
      repoQuery: "foo/bar",
    });
    expect(parseAssistantIntent("branches de mon-repo")).toEqual({
      kind: "github.list_branches",
      repoQuery: "mon-repo",
    });
    expect(parseAssistantIntent("mes pr")).toEqual({
      kind: "github.list_pulls",
    });
  });

  it("terminal / fichiers lecture seule", () => {
    expect(parseAssistantIntent("ouvre un terminal")).toEqual({
      kind: "terminal.open",
    });
    expect(parseAssistantIntent("lance terminal")).toEqual({
      kind: "terminal.open",
    });
    expect(parseAssistantIntent("lance le terminal")).toEqual({
      kind: "terminal.open",
    });
    expect(parseAssistantIntent("ouvre un terminal dans Desktop")).toEqual({
      kind: "terminal.open",
      folder: "desktop",
    });
    expect(parseAssistantIntent("va dans le dossier Documents")).toEqual({
      kind: "files.goto",
      folder: "documents",
    });
    expect(parseAssistantIntent("trouve le fichier notes.txt")).toEqual({
      kind: "files.find",
      query: "notes.txt",
    });
    expect(parseAssistantIntent("ouvre le fichier facture.pdf")).toEqual({
      kind: "files.open",
      query: "facture.pdf",
    });
    expect(
      parseAssistantIntent("montre le fichier notes.pdf dans le finder"),
    ).toEqual({
      kind: "files.open",
      query: "notes.pdf",
      revealInFinder: true,
    });
    expect(parseAssistantIntent("ouvre le premier")).toEqual({
      kind: "files.open",
    });
    expect(parseAssistantIntent("ouvre le dossier Documents")).toEqual({
      kind: "files.goto",
      folder: "documents",
    });
  });

  it("nouveaux intents locaux v2", () => {
    expect(parseAssistantIntent("au revoir")).toEqual({
      kind: "v2.local",
      id: "chat.goodbye",
      slots: {},
    });
    expect(parseAssistantIntent("quelle heure est-il")).toEqual({
      kind: "v2.local",
      id: "time.now",
      slots: {},
    });
    expect(parseAssistantIntent("aide mails")).toEqual({
      kind: "v2.local",
      id: "help.mail",
      slots: {},
    });
  });
});
