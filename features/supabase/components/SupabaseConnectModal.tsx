"use client";

import { useId, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/Button/Button";
import { HudModal } from "@/components/layout/HudModal/HudModal";
import type { MessageKey } from "@/lib/i18n/types";
import { useScrollLock } from "@/lib/hooks/useScrollLock";
import { t } from "@/lib/i18n/t";

type SupabaseConnectModalProps = {
  open: boolean;
  submitting: boolean;
  errorKey: MessageKey | null;
  onClose: () => void;
  onConnect: (input: { token: string; accountLabel: string }) => Promise<void>;
};

const MIN_TOKEN_LENGTH = 20;

/**
 * Modale Connect — plein viewport opaque (header / mask / composer masqués).
 * 1 libellé compte + 1 access token Management API.
 */
export function SupabaseConnectModal({
  open,
  submitting,
  errorKey,
  onClose,
  onConnect,
}: SupabaseConnectModalProps) {
  const idPrefix = useId();
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

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-bg px-2">
      <Button
        type="button"
        variant="ghost"
        size="bare"
        aria-label={t("home.supabaseConnectClose")}
        className="absolute inset-0 z-0 block cursor-default rounded-none bg-transparent opacity-100"
        onClick={onClose}
      >
        <span className="sr-only">{t("home.supabaseConnectClose")}</span>
      </Button>

      <HudModal
        aria-label={t("home.supabaseConnectTitle")}
        className="relative z-10 flex w-full max-w-md flex-col gap-4 p-4 sm:p-6"
        data-scroll-lock-allow="true"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="t-title text-text">
            {t("home.supabaseConnectTitle")}
          </h2>
          <Button type="button" variant="hud" size="bare" onClick={onClose}>
            {t("home.supabaseConnectClose")}
          </Button>
        </div>

        <p className="t-content text-base leading-snug">
          {t("home.supabaseConnectHint")}
        </p>

        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
        >
          <div className="flex flex-col gap-1">
            <label htmlFor={`${idPrefix}-label`} className="t-label text-text">
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
              className="t-content min-h-touch w-full rounded-md border border-line-subtle bg-surface-2/40 px-3 py-2 text-base leading-snug outline-none focus-visible:border-accent"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={`${idPrefix}-token`} className="t-label text-text">
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
              className="t-mono min-h-touch w-full rounded-md border border-line-subtle bg-surface-2/40 px-3 py-2 text-text outline-none focus-visible:border-accent"
            />
          </div>
          <p className="t-content text-base leading-snug text-text-muted">
            {t("home.supabaseTokenHint")}
          </p>
          {errorKey ? (
            <p
              className="t-content text-base leading-snug text-danger"
              role="alert"
            >
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
    </div>,
    document.body,
  );
}
