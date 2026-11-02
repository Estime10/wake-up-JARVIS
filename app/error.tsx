"use client";

import Link from "next/link";

import { Button } from "@/components/ui/Button";
import {
  BUTTON_SIZE_CLASS,
  BUTTON_VARIANT_CLASS,
} from "@/components/ui/Button/buttonVariants";
import { SystemNoticeScreen } from "@/features/system";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n";
import { ROUTES } from "@/lib/routes";

type ErrorPageProps = {
  error: unknown;
  retry: () => void;
};

/** Boundary segment — UI JARVIS, sans log secret. */
export default function ErrorPage({ retry }: ErrorPageProps) {
  return (
    <SystemNoticeScreen
      title={t("system.errorTitle")}
      body={t("system.errorBody")}
      action={
        <>
          <Button type="button" variant="hud" size="bare" onClick={retry}>
            {t("system.errorRetry")}
          </Button>
          <Link
            href={ROUTES.splash}
            className={cn(
              "inline-flex cursor-pointer items-center justify-center gap-2",
              BUTTON_VARIANT_CLASS.hud,
              BUTTON_SIZE_CLASS.bare,
            )}
          >
            {t("system.errorHome")}
          </Link>
        </>
      }
    />
  );
}
