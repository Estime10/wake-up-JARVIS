import Link from "next/link";

import {
  BUTTON_SIZE_CLASS,
  BUTTON_VARIANT_CLASS,
} from "@/components/ui/Button/buttonVariants";
import { SystemNoticeScreen } from "@/features/system";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n";
import { ROUTES } from "@/lib/routes";

export default function NotFoundPage() {
  return (
    <SystemNoticeScreen
      title={t("system.notFoundTitle")}
      body={t("system.notFoundBody")}
      action={
        <Link
          href={ROUTES.splash}
          className={cn(
            "inline-flex cursor-pointer items-center justify-center gap-2",
            BUTTON_VARIANT_CLASS.hud,
            BUTTON_SIZE_CLASS.bare,
          )}
        >
          {t("system.notFoundAction")}
        </Link>
      }
    />
  );
}
