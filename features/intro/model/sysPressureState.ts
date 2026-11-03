import type { MessageKey } from "@/lib/i18n/types";

/** Pression CPU système (Compute Pressure) + fallback HUD. */
export type SysPressureState =
  "nominal" | "fair" | "serious" | "critical" | "unknown";

const LABEL_KEYS = {
  nominal: "intro.sysNominal",
  fair: "intro.sysFair",
  serious: "intro.sysSerious",
  critical: "intro.sysCritical",
  unknown: "intro.sysUnknown",
} as const satisfies Record<SysPressureState, MessageKey>;

const TONE_CLASS = {
  nominal: "text-success",
  fair: "text-accent",
  serious: "text-attention",
  critical: "text-danger",
  unknown: "text-text-muted",
} as const satisfies Record<SysPressureState, string>;

export function sysPressureLabelKey(state: SysPressureState): MessageKey {
  return LABEL_KEYS[state];
}

export function sysPressureToneClass(state: SysPressureState): string {
  return TONE_CLASS[state];
}

export function isPressureState(value: string): value is PressureState {
  return (
    value === "nominal" ||
    value === "fair" ||
    value === "serious" ||
    value === "critical"
  );
}
