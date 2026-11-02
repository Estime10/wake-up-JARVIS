import type { RiskLevel } from "@/lib/schemas";

export type { RiskLevel };

export type ActionFocusTarget = "execute" | "cancel";

/** Niveaux 2 et 3 : signature Touch ID / mot de passe requise. */
export function requiresSignature(risk: RiskLevel): boolean {
  return risk >= 2;
}

/** Niveau 1 → Exécuter ; ≥ 2 → Annuler (Entrée ne lance rien). */
export function initialFocusTarget(risk: RiskLevel): ActionFocusTarget {
  return requiresSignature(risk) ? "cancel" : "execute";
}

/** Entrée lance uniquement le niveau 1 (lecture). */
export function enterSubmits(risk: RiskLevel): boolean {
  return risk === 1;
}

export function riskLabelKey(
  risk: RiskLevel,
): "actions.riskRead" | "actions.riskModify" | "actions.riskDanger" {
  if (risk === 1) {
    return "actions.riskRead";
  }
  if (risk === 2) {
    return "actions.riskModify";
  }
  return "actions.riskDanger";
}
