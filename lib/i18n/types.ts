import type { FrMessages } from "@/lib/i18n/messages/fr";

type Join<K, P> = K extends string
  ? P extends string
    ? `${K}.${P}`
    : never
  : never;

type Leaves<T> =
  T extends Record<string, unknown>
    ? {
        [K in keyof T & string]: T[K] extends Record<string, unknown>
          ? Join<K, Leaves<T[K]>>
          : K;
      }[keyof T & string]
    : never;

/** Clés de traduction typées (`app.name`, `intro.wordmark`…). */
export type MessageKey = Leaves<FrMessages>;

export type MessageParams = Record<string, string | number>;
