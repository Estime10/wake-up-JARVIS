import {
  getWelcomeSpeakText,
  isWelcomeSpeaking,
  resetWelcomeSpeakSession,
  startWelcomeSpeakWhenReady,
  waitWelcomeSpeakEnd,
  wasWelcomeSpeakPlayed,
} from "@/lib/voice/welcomeSpeak";

let inFlight = false;

/** Remise à zéro à chaque entrée home — un salut par lancement. */
export function resetHomeWelcomeSchedule(): void {
  inFlight = false;
  resetWelcomeSpeakSession();
}

/**
 * Lance le salut. Si le speak est rejeté, `inFlight` est relâché pour retry.
 */
export function scheduleHomeWelcomeSpeak(): void {
  if (wasWelcomeSpeakPlayed() || isWelcomeSpeaking() || inFlight) {
    return;
  }
  inFlight = true;

  void (async () => {
    try {
      const started = await startWelcomeSpeakWhenReady(getWelcomeSpeakText());
      if (!started) {
        inFlight = false;
        return;
      }
      await waitWelcomeSpeakEnd();
      if (!wasWelcomeSpeakPlayed()) {
        inFlight = false;
      }
    } catch {
      inFlight = false;
    }
  })();
}
