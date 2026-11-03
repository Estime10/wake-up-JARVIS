import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import eslintConfigPrettier from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "react/no-danger": "error",
      "no-console": "error",
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/adapters", "@/adapters/**", "**/adapters/**"],
              message:
                "L'UI ne connaît que les ports (@/ports). Les adapters ne s'importent que dans app/providers.tsx.",
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      "app/providers.tsx",
      "app/api/**",
      "adapters/**",
      "__tests__/**",
      "**/*.test.ts",
      "**/*.test.tsx",
    ],
    rules: { "no-restricted-imports": "off" },
  },
  {
    files: ["scripts/**", "lib/logger.ts"],
    rules: { "no-console": "off" },
  },
  eslintConfigPrettier,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
