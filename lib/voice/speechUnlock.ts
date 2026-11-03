import { prefetchSpeechVoices } from "@/lib/voice/prefetchVoices";

const UNLOCK_KEY = "jarvis.speechUnlocked";

/** Ref forte anti-GC Chrome (utterance de déblocage). */
let unlockUtterance: SpeechSynthesisUtterance | null = null;

export function isSpeechUnlocked(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  // Ref lue volontairement (anti-GC Chrome).
  void unlockUtterance;
  try {
    return window.sessionStorage.getItem(UNLOCK_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * À appeler SYNCHRONEMENT dans un handler de geste (submit login, clic splash).
 * Chrome autorise ensuite `speechSynthesis.speak` sans nouveau geste (même document).
 */
export function unlockSpeechFromUserGesture(): void {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return;
  }

  prefetchSpeechVoices();

  try {
    window.sessionStorage.setItem(UNLOCK_KEY, "1");
  } catch {
    /* private mode */
  }

  const synth = window.speechSynthesis;
  // Utterance quasi silencieuse sous geste — débloque les speak() suivants (Chrome).
  const utterance = new SpeechSynthesisUtterance(" ");
  utterance.volume = 0.01;
  utterance.rate = 2;
  utterance.pitch = 1;
  utterance.lang = "fr-FR";
  unlockUtterance = utterance;

  utterance.onend = () => {
    unlockUtterance = null;
  };
  utterance.onerror = () => {
    unlockUtterance = null;
  };

  try {
    synth.speak(utterance);
    synth.resume();
  } catch {
    /* ignore */
  }
}
