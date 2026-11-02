import { ActionCardsBlock } from "@/features/dev/components/ActionCardsBlock";
import { TokensBlock } from "@/features/dev/components/TokensBlock";
import { t } from "@/lib/i18n";

/** Galerie des états — Server + îlots client (actions). */
export function DevStatesGallery() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-16 px-6 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="t-title text-2xl text-accent">{t("dev.statesTitle")}</h1>
        <p className="t-body text-text-muted">{t("dev.statesDescription")}</p>
      </header>
      <TokensBlock />
      <ActionCardsBlock />
    </main>
  );
}
