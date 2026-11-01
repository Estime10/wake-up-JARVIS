import { displayPath } from "@/features/home/model/terminal/pathUtils";
import { t } from "@/lib/i18n";

/** Prompt zsh macOS : `DevinChat@host ~ % ` */
export function buildTerminalPrompt(cwd: string): string {
  return `${t("user.displayName")}@${t("user.terminalHost")} ${displayPath(cwd)} % `;
}
