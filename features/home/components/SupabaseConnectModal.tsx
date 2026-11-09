"use client";

import { useId, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { HudModal } from "@/components/ui/HudModal";
import { HudOverlay } from "@/features/home/components/HudOverlay";
import {
  mainSectionBoxStyle,
  useMainSectionBox,
} from "@/features/home/hooks/useMainSectionBox";
import type { MessageKey } from "@/lib/i18n";
import { useScrollLock } from "@/lib/hooks/useScrollLock";
import { t } from "@/lib/i18n";

type SupabaseConnectModalProps = {
  open: boolean;
  submitting: boolean;
  errorKey: MessageKey | null;
  onClose: () => void;
  onConnect: (input: { token: string; accountLabel: string }) => Promise<void>;
};

const MIN_TOKEN_LENGTH = 20;

/**
 * Modale Connect — libellé compte + access token (1 token / compte Supabase).
 */
export function SupabaseConnectModal({
  open,
  submitting,
  errorKey,
  onClose,
  onConnect,
}: SupabaseConnectModalProps) {
  const idPrefix = useId();
  const box = useMainSectionBox(open);
  useScrollLock(open);
  const [accountLabel, setAccountLabel] = useState("");
  const [token, setToken] = useState("");

  if (!open) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const label = accountLabel.trim();
    const trimmed = token.trim();
    if (label.length === 0 || trimmed.length < MIN_TOKEN_LENGTH || submitting) {
      return;
    }
    await onConnect({ token: trimmed, accountLabel: label });
    setToken("");
    setAccountLabel("");
  }

  return (
    <>
      <HudOverlay visible className="z-[72]" />
      <Button
        type="button"
        variant="ghost"
        size="bare"
        aria-label={t("home.supabaseConnectClose")}
        className="pointer-events-auto fixed z-[72] block cursor-default rounded-none bg-transparent opacity-100"
        style={mainSectionBoxStyle(box)}
        onClick={onClose}
      >
        <span className="sr-only">{t("home.supabaseConnectClose")}</span>
      </Button>

      <div
        className="pointer-events-none fixed z-[73] flex items-center justify-center px-2 opacity-100"
        style={mainSectionBoxStyle(box)}
      >
        <HudModal
          aria-label={t("home.supabaseConnectTitle")}
          className="pointer-events-auto flex w-full max-w-md flex-col gap-4 p-4 sm:p-6"
          data-scroll-lock-allow="true"
        >
          <div className="flex items-start justify-between gap-3">
            <h2 className="t-mono text-sm tracking-wide text-text uppercase">
              {t("home.supabaseConnectTitle")}
            </h2>
            <Button type="button" variant="hud" size="bare" onClick={onClose}>
              {t("home.supabaseConnectClose")}
            </Button>
          </div>

          <p className="t-body text-sm text-text">
            {t("home.supabaseConnectHint")}
          </p>

          <form
            className="flex flex-col gap-3"
            onSubmit={(event) => {
              void handleSubmit(event);
            }}
          >
            <div className="flex flex-col gap-1">
              <label
                htmlFor={`${idPrefix}-label`}
                className="t-mono text-sm tracking-wide text-text uppercase"
              >
                {t("home.supabaseAccountLabel")}
              </label>
              <input
                id={`${idPrefix}-label`}
                name="supabase_account_label"
                type="text"
                autoComplete="off"
                required
                maxLength={80}
                disabled={submitting}
                value={accountLabel}
                onChange={(event) => setAccountLabel(event.target.value)}
                placeholder={t("home.supabaseAccountPlaceholder")}
                className="t-mono min-h-touch w-full rounded-md border border-line-subtle bg-surface-2/40 px-3 py-2 text-sm text-text outline-none focus-visible:border-accent"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor={`${idPrefix}-token`}
                className="t-mono text-sm tracking-wide text-text uppercase"
              >
                {t("home.supabaseTokenLabel")}
              </label>
              <input
                id={`${idPrefix}-token`}
                name="supabase_access_token"
                type="password"
                autoComplete="off"
                spellCheck={false}
                required
                minLength={MIN_TOKEN_LENGTH}
                disabled={submitting}
                value={token}
                onChange={(event) => setToken(event.target.value)}
                placeholder={t("home.supabaseTokenPlaceholder")}
                className="t-mono min-h-touch w-full rounded-md border border-line-subtle bg-surface-2/40 px-3 py-2 text-sm text-text outline-none focus-visible:border-accent"
              />
            </div>
            <p className="t-mono text-sm text-text">
              {t("home.supabaseTokenHint")}
            </p>
            {errorKey ? (
              <p className="t-mono text-sm text-danger" role="alert">
                {t(errorKey)}
              </p>
            ) : null}
            <Button
              type="submit"
              variant="bordered"
              size="md"
              disabled={
                submitting ||
                accountLabel.trim().length === 0 ||
                token.trim().length < MIN_TOKEN_LENGTH
              }
              className="self-center"
            >
              {submitting
                ? t("home.supabaseTokenSubmitting")
                : t("home.supabaseTokenSubmit")}
            </Button>
          </form>
        </HudModal>
      </div>
    </>
  );
}
