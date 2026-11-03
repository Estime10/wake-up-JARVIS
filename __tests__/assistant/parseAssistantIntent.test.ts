import { describe, expect, it } from "vitest";

import { parseAssistantIntent } from "@/features/assistant/model/parseAssistantIntent";

describe("parseAssistantIntent", () => {
  it("priorise help puis github puis mail", () => {
    expect(parseAssistantIntent("aide")).toEqual({ kind: "help" });
    expect(parseAssistantIntent("liste mes repos")).toEqual({
      kind: "github.list_repos",
    });
    expect(parseAssistantIntent("mails label DEV")).toEqual({
      kind: "mail.list_by_label",
      label: "DEV",
    });
  });

  it("ne confond pas liste PR et liste repos", () => {
    expect(parseAssistantIntent("liste les PR sur foo")).toEqual({
      kind: "github.list_pulls",
      repoQuery: "foo",
    });
  });
});
