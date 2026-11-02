import { describe, expect, it } from "vitest";

import { mapAuthError } from "@/features/auth/model/mapAuthError";
import { authCredentialsSchema, authRegisterSchema } from "@/lib/schemas";

describe("authCredentialsSchema", () => {
  it("accepte un email/mot de passe valides", () => {
    expect(
      authCredentialsSchema.parse({
        email: "toi@exemple.com",
        password: "motdepasse1",
      }),
    ).toEqual({
      email: "toi@exemple.com",
      password: "motdepasse1",
    });
  });

  it("rejette un mot de passe trop court", () => {
    const result = authCredentialsSchema.safeParse({
      email: "toi@exemple.com",
      password: "court",
    });
    expect(result.success).toBe(false);
  });
});

describe("authRegisterSchema", () => {
  it("rejette une confirmation différente", () => {
    const result = authRegisterSchema.safeParse({
      email: "toi@exemple.com",
      password: "motdepasse1",
      confirmPassword: "motdepasse2",
    });
    expect(result.success).toBe(false);
  });
});

describe("mapAuthError", () => {
  it("mappe les credentials invalides", () => {
    expect(mapAuthError("Invalid login credentials")).toBe(
      "auth.errorInvalidCredentials",
    );
  });
});
