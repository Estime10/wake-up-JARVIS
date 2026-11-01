import type { RepoPanelScenario } from "@/features/home/model/repoPanelScenario";
import { t } from "@/lib/i18n";

/** Libellé footer panneau fichiers selon le scénario mock. */
export function repoFooterLabel(scenario: RepoPanelScenario): string {
  if (scenario === "offline") {
    return t("home.repoFooterOffline");
  }
  if (scenario === "disconnected" || scenario === "denied") {
    return t("home.repoFooterGithub");
  }
  return t("home.repoFooter");
}
