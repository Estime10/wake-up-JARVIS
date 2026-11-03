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
 * Gate login — après succès → splash `/` (jamais home direct).
 */
export function AuthScreen() {
  const router = useRouter();
  const { status } = useAuth();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(ROUTES.splash);
    }
  }, [router, status]);

  function goSplash() {
    router.replace(ROUTES.splash);
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
          <AuthModal onSuccess={goSplash} />
        )}
      </div>
    </div>
  );
}
