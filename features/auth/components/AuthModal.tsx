"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { HudModal } from "@/components/ui/HudModal";
import { AuthForm, type AuthMode } from "@/features/auth/components/AuthForm";
import { t } from "@/lib/i18n";

type AuthModalProps = {
  onSuccess: () => void;
};

/** Auth — même HudModal que le terminal ; hauteur stable login ↔ register. */
export function AuthModal({ onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>("login");

  return (
    <HudModal
      aria-labelledby="auth-title"
      aria-describedby="auth-subtitle"
      className="relative w-full max-w-md"
    >
      <div className="relative z-10 flex flex-col gap-5 px-5 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-2">
          <p id="auth-title" className="t-title text-text">
            {t("auth.title")}
          </p>
          <p id="auth-subtitle" className="t-body text-sm text-text-muted">
            {t("auth.subtitle")}
          </p>
        </div>

        <div
          className="flex gap-6 border-b border-line-subtle"
          role="tablist"
          aria-label={t("auth.dialogLabel")}
        >
          <Button
            type="button"
            variant="tab"
            size="tab"
            role="tab"
            aria-selected={mode === "login"}
            onClick={() => setMode("login")}
          >
            {t("auth.loginTab")}
          </Button>
          <Button
            type="button"
            variant="tab"
            size="tab"
            role="tab"
            aria-selected={mode === "register"}
            onClick={() => setMode("register")}
          >
            {t("auth.registerTab")}
          </Button>
        </div>

        <AuthForm mode={mode} onSuccess={onSuccess} />
      </div>
    </HudModal>
  );
}
