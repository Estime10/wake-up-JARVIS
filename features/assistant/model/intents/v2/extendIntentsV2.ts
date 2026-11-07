import {
  INTENTS_V2,
  type IntentV2,
} from "@/features/assistant/model/intents/v2/index.v2";

/**
 * Phrases manquantes / régressions vs app @03cf47e — patch local léger
 * (le générateur v2 reste la source ; ne pas éditer les *.v2.ts à la main).
 */
const EXTRA_PHRASES: Readonly<Record<string, readonly string[]>> = {
  help: [
    "que peux-tu faire",
    "que peux tu faire",
    "qu'est-ce que tu peux faire",
  ],
  "mail.label": [
    "donne moi les mails label {label}",
    "les mails label {label}",
    "mails label {label}",
    "montre mes mails {label}",
    "affiche les mails {label}",
    "mails en {label}",
    "show emails labeled {label}",
  ],
  "mail.sent_by_label": [
    "ce que j'ai repondu en {label}",
    "ce que j'ai répondu en {label}",
    "mes reponses dans {label}",
    "mes réponses dans {label}",
  ],
  "github.commits": ["commits sur {repo}", "commits on {repo}"],
  "github.status": ["compte github", "statut github", "github status"],
  "github.repos": ["my github projects"],
};

export function intentsV2WithOverlays(): readonly IntentV2[] {
  return INTENTS_V2.map((intent) => {
    const extra = EXTRA_PHRASES[intent.id];
    if (!extra || extra.length === 0) {
      return intent;
    }
    return {
      ...intent,
      phrases: [...intent.phrases, ...extra],
    };
  });
}
