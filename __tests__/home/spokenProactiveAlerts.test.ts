import { describe, expect, it } from "vitest";

import {
  spokenMailArrival,
  spokenSysPressureChange,
} from "@/features/home/model/spokenProactiveAlerts";

describe("spokenProactiveAlerts", () => {
  it("annonce un / plusieurs mails", () => {
    expect(spokenMailArrival([{ from: "Alice <a@b.c>" }])).toContain("Alice");
    expect(spokenMailArrival([{ from: "a@b.c" }, { from: "b@c.d" }])).toMatch(
      /2/,
    );
    expect(spokenMailArrival([])).toBeNull();
  });

  it("annonce les états CPU utiles", () => {
    expect(spokenSysPressureChange("critical")).toMatch(/critique/i);
    expect(spokenSysPressureChange("unknown")).toBeNull();
  });
});
