import type { MailAccountStatus } from "@/lib/schemas";

/** Transitions PATCH /status — OAuth seul sort de needs_reauth → active (DEV-6). */
export function canSetMailAccountStatus(
  current: MailAccountStatus,
  next: "active" | "disabled",
): boolean {
  return !(current === "needs_reauth" && next === "active");
}
