"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { t } from "@/lib/i18n";

type CopyButtonProps = {
  text: string;
};

/** Bouton Copier 44 px — presse-papiers (point d'entrée client). */
export function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="md"
      className="min-h-touch min-w-touch"
      onClick={() => {
        void handleCopy();
      }}
    >
      {copied ? t("actions.copied") : t("actions.copy")}
    </Button>
  );
}
