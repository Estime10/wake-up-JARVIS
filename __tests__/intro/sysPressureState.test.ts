import { describe, expect, it } from "vitest";

import {
  isPressureState,
  sysPressureLabelKey,
  sysPressureToneClass,
} from "@/features/intro/model/sysPressureState";

describe("sysPressureState", () => {
  it("mappe libellés et tons", () => {
    expect(sysPressureLabelKey("nominal")).toBe("intro.sysNominal");
    expect(sysPressureLabelKey("fair")).toBe("intro.sysFair");
    expect(sysPressureLabelKey("serious")).toBe("intro.sysSerious");
    expect(sysPressureLabelKey("critical")).toBe("intro.sysCritical");
    expect(sysPressureLabelKey("unknown")).toBe("intro.sysUnknown");

    expect(sysPressureToneClass("nominal")).toBe("text-success");
    expect(sysPressureToneClass("fair")).toBe("text-accent");
    expect(sysPressureToneClass("serious")).toBe("text-attention");
    expect(sysPressureToneClass("critical")).toBe("text-danger");
    expect(sysPressureToneClass("unknown")).toBe("text-text-muted");
  });

  it("valide les états Pressure API", () => {
    expect(isPressureState("nominal")).toBe(true);
    expect(isPressureState("critical")).toBe(true);
    expect(isPressureState("hot")).toBe(false);
  });
});
