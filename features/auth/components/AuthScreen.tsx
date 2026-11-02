"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { HudAmbient } from "@/components/ui/HudAmbient";
import { VisuallyHidden } from "@/components/ui/VisuallyHidden";
import { AuthModal } from "@/features/auth/components/AuthModal";
import { AuthSkeleton } from "@/features/auth/components/AuthSkeleton";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { t } from "@/lib/i18n";
import { ROUTES } from "@/lib/routes";

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
          <AuthSkeleton />
        ) : (
          <AuthModal onSuccess={goHome} />
        )}
      </div>
    </div>
  );
}
