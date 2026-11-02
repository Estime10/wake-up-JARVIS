"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { AuthTextField } from "@/features/auth/components/AuthTextField";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { t } from "@/lib/i18n";
import {
  authCredentialsSchema,
  authRegisterSchema,
  type AuthCredentials,
} from "@/lib/schemas";

export type AuthMode = "login" | "register";

type AuthFormProps = {
  mode: AuthMode;
  onSuccess: () => void;
};

type FieldErrors = {
  email?: string;
  password?: string;
  confirmPassword?: string;
};

/**
 * Formulaire login / register — validation Zod avant appel AuthProvider.
 */
export function AuthForm({ mode, onSuccess }: AuthFormProps) {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});

    if (mode === "register") {
      const parsed = authRegisterSchema.safeParse({
        email,
        password,
        confirmPassword,
      });
      if (!parsed.success) {
        setFieldErrors(toFieldErrors(parsed.error.issues));
        return;
      }
      await runAuth({
        email: parsed.data.email,
        password: parsed.data.password,
      });
      return;
    }

    const parsed = authCredentialsSchema.safeParse({ email, password });
    if (!parsed.success) {
      setFieldErrors(toFieldErrors(parsed.error.issues));
      return;
    }
    await runAuth(parsed.data);
  }

  async function runAuth(credentials: AuthCredentials) {
    setPending(true);
    try {
      const result =
        mode === "login"
          ? await signIn(credentials)
          : await signUp(credentials);

      if (!result.ok) {
        setFormError(t(result.messageKey));
        return;
      }

      onSuccess();
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
      <AuthTextField
        id="auth-email"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        label={t("auth.email")}
        placeholder={t("auth.emailPlaceholder")}
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        error={fieldErrors.email}
        disabled={pending}
        required
      />
      <AuthTextField
        id="auth-password"
        name="password"
        type="password"
        autoComplete={mode === "login" ? "current-password" : "new-password"}
        label={t("auth.password")}
        placeholder={t("auth.passwordPlaceholder")}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        error={fieldErrors.password}
        disabled={pending}
        required
        minLength={8}
      />
      {/* Toujours monté : réserve la hauteur (login = register). */}
      <div
        className={mode === "register" ? undefined : "invisible"}
        aria-hidden={mode !== "register"}
      >
        <AuthTextField
          id="auth-confirm-password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          label={t("auth.confirmPassword")}
          placeholder={t("auth.confirmPasswordPlaceholder")}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          error={mode === "register" ? fieldErrors.confirmPassword : undefined}
          disabled={pending || mode !== "register"}
          required={mode === "register"}
          tabIndex={mode === "register" ? undefined : -1}
          minLength={8}
        />
      </div>

      <p
        className={
          formError
            ? "t-body text-sm text-danger"
            : "t-body invisible text-sm text-danger"
        }
        role={formError ? "alert" : undefined}
      >
        {formError ?? "\u00A0"}
      </p>

      <Button type="submit" variant="hud" size="bare" disabled={pending}>
        {pending
          ? t("auth.submitting")
          : mode === "login"
            ? t("auth.submitLogin")
            : t("auth.submitRegister")}
      </Button>
    </form>
  );
}

function toFieldErrors(
  issues: ReadonlyArray<{ path: PropertyKey[]; message: string }>,
): FieldErrors {
  const next: FieldErrors = {};

  for (const issue of issues) {
    const key = String(issue.path[0] ?? "");
    if (key === "email" && !next.email) {
      next.email = t("auth.errorInvalidEmail");
    }
    if (key === "password" && !next.password) {
      next.password = t("auth.errorWeakPassword");
    }
    if (key === "confirmPassword" && !next.confirmPassword) {
      next.confirmPassword =
        issue.message === "password_mismatch"
          ? t("auth.errorPasswordMismatch")
          : t("auth.errorWeakPassword");
    }
  }

  return next;
}
