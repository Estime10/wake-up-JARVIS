"use client";

import { useId, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import type { MessageKey } from "@/lib/i18n";
import { t } from "@/lib/i18n";

type RepoGithubConnectFormProps = {
  submitting: boolean;
  errorKey: MessageKey | null;
  onSubmit: (input: { token: string; expiresAt?: string }) => Promise<void>;
};

/**
 * Formulaire PAT fine-grained — étape 1 ADR 0011.
 * Le token ne reste que dans l’état local du champ ; jamais loggé.
 */
export function RepoGithubConnectForm({
  submitting,
  errorKey,
  onSubmit,
}: RepoGithubConnectFormProps) {
  const idPrefix = useId();
  const [token, setToken] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = token.trim();
    if (trimmed.length < 20) {
      return;
    }
    await onSubmit({ token: trimmed });
    setToken("");
  }

  return (
    <form
      className="flex w-full max-w-sm flex-col gap-3 text-left"
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
    >
      <div className="flex flex-col gap-1">
        <label
          htmlFor={`${idPrefix}-token`}
          className="t-mono text-sm tracking-wide text-text-muted uppercase"
        >
          {t("home.repoPatLabel")}
        </label>
        <input
          id={`${idPrefix}-token`}
          name="github_pat"
          type="password"
          autoComplete="off"
          spellCheck={false}
          required
          minLength={20}
          disabled={submitting}
          value={token}
          onChange={(event) => setToken(event.target.value)}
          placeholder={t("home.repoPatPlaceholder")}
          className="t-mono min-h-touch w-full rounded-md border border-line-subtle bg-surface-2/40 px-3 py-2 text-sm text-text outline-none focus-visible:border-accent"
        />
      </div>
      <p className="t-mono text-sm text-text-muted">
        {t("home.repoPatPrivateHint")}
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
        disabled={submitting || token.trim().length < 20}
        className="self-center"
      >
        {submitting ? t("home.repoPatSubmitting") : t("home.repoPatSubmit")}
      </Button>
    </form>
  );
}
