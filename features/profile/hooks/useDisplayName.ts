"use client";

import { useEffect, useState } from "react";

import { usePorts } from "@/app/ports-context";
import { resolveDisplayName } from "@/features/profile/model/resolveDisplayName";
import { t } from "@/lib/i18n";

/**
 * Nom pour le salut / shell — `profiles.display_name` (puis username, puis i18n).
 */
export function useDisplayName(): string {
  const { profile } = usePorts();
  const [name, setName] = useState(() => t("user.displayName"));

  useEffect(() => {
    let cancelled = false;

    void profile
      .getProfile()
      .then((row) => {
        if (cancelled || !row) {
          return;
        }
        setName(resolveDisplayName(row.displayName, row.username));
      })
      .catch(() => {
        /* fallback i18n déjà en place */
      });

    return () => {
      cancelled = true;
    };
  }, [profile]);

  return name;
}
