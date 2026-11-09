import type { AssistantEvent } from "@/features/home/model/assistantMachine";
import type { VoicePort } from "@/ports/voice-port";
import { markWelcomeSpeakPlayed } from "@/lib/voice/welcomeSpeak";

type SpeakRingDeps = {
  getVoice: () => VoicePort;
  getAssistantState: () => string;
  dispatch: (event: AssistantEvent) => void;
  abortRef: { current: AbortController | null };
  welcomeInFlightRef: { current: boolean };
  welcomeSpokenRef: { current: boolean };
  stopVoiceListen: () => void;
};

/**
 * Anneau vocal idle → speaking → idle (salut / alertes).
 */
export function createAssistantSpeakRing(deps: SpeakRingDeps) {
  async function speakRing(
    text: string,
    opts: { markWelcomePlayed: boolean },
  ): Promise<boolean> {
    const trimmed = text.trim();
    if (trimmed.length === 0) {
      return false;
    }
    if (deps.getAssistantState() !== "idle") {
      return false;
    }
    if (deps.welcomeInFlightRef.current) {
      return false;
    }

    deps.stopVoiceListen();
    const ac = new AbortController();
    deps.abortRef.current = ac;
    deps.welcomeInFlightRef.current = true;

    let ringStarted = false;

    try {
      await deps.getVoice().speak(
        trimmed,
        {
          onLevel: () => {},
          onStart: () => {
            if (ringStarted || ac.signal.aborted) {
              return;
            }
            ringStarted = true;
            deps.dispatch({ type: "SPEAK_START" });
          },
        },
        ac.signal,
      );
      if (ac.signal.aborted) {
        return false;
      }
      if (ringStarted) {
        if (opts.markWelcomePlayed) {
          deps.welcomeSpokenRef.current = true;
          markWelcomeSpeakPlayed();
        }
        return true;
      }
      return false;
    } finally {
      deps.welcomeInFlightRef.current = false;
      if (deps.abortRef.current === ac) {
        deps.abortRef.current = null;
      }
      if (ringStarted) {
        deps.dispatch({ type: "SPEAK_END" });
      }
    }
  }

  async function speakWelcome(text: string): Promise<boolean> {
    if (deps.welcomeSpokenRef.current) {
      return false;
    }
    const ok = await speakRing(text, { markWelcomePlayed: true });
    if (ok) {
      deps.welcomeSpokenRef.current = true;
    }
    return ok;
  }

  async function speakAlert(text: string): Promise<boolean> {
    return speakRing(text, { markWelcomePlayed: false });
  }

  return { speakWelcome, speakAlert };
}
