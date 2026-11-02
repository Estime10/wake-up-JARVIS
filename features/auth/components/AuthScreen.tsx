"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { AuthModal } from "@/features/auth/components/AuthModal";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { HudAmbient } from "@/components/ui/HudAmbient";
import { ROUTES } from "@/lib/routes";
import { t } from "@/lib/i18n";
import { VisuallyHidden } from "@/components/ui/VisuallyHidden";

/**
 * Page gate — splash → ici si anonyme → home après session.
 */
export function AuthScreen() {
  const router = useRouter();
  const { status } = useAuth();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(ROUTES.home);
    }
  }, [router, status]);

  function goHome() {
    router.replace(ROUTES.home);
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center bg-bg px-4 py-10 text-text">
      <HudAmbient />
      <VisuallyHidden>
        <h1>{t("auth.dialogLabel")}</h1>
      </VisuallyHidden>
      <div className="relative z-10 w-full max-w-md">
        {status === "loading" ? (
          <p className="t-body text-center text-text-muted" role="status">
            {t("auth.loading")}
          </p>
        ) : (
          <AuthModal onSuccess={goHome} />
        )}
      </div>
    </div>
  );
}
