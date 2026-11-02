import { riskLabelKey, type RiskLevel } from "@/lib/actions/risk";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n";

type RiskBadgeProps = {
  risk: RiskLevel;
};

/** Niveau de risque — texte + icône (jamais la couleur seule). */
export function RiskBadge({ risk }: RiskBadgeProps) {
  const icon = risk === 1 ? "◎" : risk === 2 ? "✎" : "▲";
  return (
    <span
      className={cn(
        "t-label inline-flex items-center gap-1.5 text-sm",
        risk === 3 ? "text-danger" : "text-text-muted",
      )}
    >
      <span aria-hidden>{icon}</span>
      {t(riskLabelKey(risk))}
    </span>
  );
}
