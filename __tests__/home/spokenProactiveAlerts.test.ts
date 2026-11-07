import { describe, expect, it } from "vitest";

import {
  formatMailFromList,
  spokenMailArrival,
  spokenSysPressureChange,
} from "@/features/home/model/spokenProactiveAlerts";

describe("spokenProactiveAlerts", () => {
  it("formate la liste d’expéditeurs", () => {
    expect(formatMailFromList(["Paul"])).toBe("de Paul");
    expect(formatMailFromList(["Paul", "Kozy"])).toBe("de Paul et de Kozy");
    expect(formatMailFromList(["A", "B", "C"])).toBe("de A, de B et de C");
  });

  it("annonce un / plusieurs mails avec noms, sans snippet", () => {
    expect(spokenMailArrival([{ from: "Alice <a@b.c>" }])).toContain("Alice");
    const many = spokenMailArrival([
      { from: "Paul <p@x.com>" },
      { from: "Kozy <k@y.com>" },
    ]);
    expect(many).toContain("2");
    expect(many).toContain("Paul");
    expect(many).toContain("Kozy");
    expect(spokenMailArrival([])).toBeNull();
  });

  it("n’annonce la CPU qu’en hausse, jamais en nominal", () => {
    expect(spokenSysPressureChange("nominal")).toBeNull();
    expect(spokenSysPressureChange("nominal", "serious")).toBeNull();
    expect(spokenSysPressureChange("fair", "nominal")).toMatch(/modérée/i);
    expect(spokenSysPressureChange("serious", "fair")).toMatch(/élevée/i);
    expect(spokenSysPressureChange("critical", "serious")).toMatch(/critique/i);
    expect(spokenSysPressureChange("fair", "serious")).toBeNull();
    expect(spokenSysPressureChange("unknown")).toBeNull();
  });
});
