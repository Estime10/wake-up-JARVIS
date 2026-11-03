import { t } from "@/lib/i18n";

type WakeContinueHintProps = {
  visible: boolean;
};

/** Invite de réveil après l’anim splash — un geste débloque le TTS home. */
export function WakeContinueHint({ visible }: WakeContinueHintProps) {
  if (!visible) {
    return null;
  }

  return (
    <p
      className="absolute inset-x-0 bottom-28 z-20 px-6 text-center font-mono text-[11px] tracking-[0.18em] text-text-muted uppercase sm:bottom-32"
      role="status"
    >
      {t("intro.wakeContinue")}
    </p>
  );
}
