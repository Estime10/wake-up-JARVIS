import { spokenGreeting } from "@/lib/greeting";
import { t } from "@/lib/i18n";

/**
 * Salut TTS partagé — déclenché après l’entrée home (sans geste requis).
 *
 * Chrome GC : il FAUT garder une ref module-level sur l’utterance jusqu’à
 * onend/onerror, sinon speak() est silencieux (utterance collectée).
 */

let cachedText = spokenGreeting(new Date().getHours(), t("user.displayName"));
/** Incrémenté à chaque nouveau speak — ignore les callbacks périmés. */
let generation = 0;
let active = false;
let playedOk = false;
/** Ref forte anti-GC Chrome. */
let currentUtterance: SpeechSynthesisUtterance | null = null;

function pickThomasFr(
  voices: SpeechSynthesisVoice[],
): SpeechSynthesisVoice | null {
  return (
    voices.find(
      (voice) =>
        voice.name.toLowerCase().includes("thomas") &&
        voice.lang.toLowerCase().startsWith("fr"),
    ) ??
    voices.find((voice) => voice.lang.toLowerCase() === "fr-fr") ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith("fr")) ??
    null
  );
}

function loadVoices(): SpeechSynthesisVoice[] {
  return window.speechSynthesis.getVoices();
}

function buildUtterance(text: string): SpeechSynthesisUtterance {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "fr-FR";
  utterance.volume = 1;
  utterance.rate = 1;
  utterance.pitch = 1;

  const voice = pickThomasFr(loadVoices());
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang || "fr-FR";
  }

  return utterance;
}

/** Attend le catalogue voix (async sur Chrome). */
export function waitForSpeechVoices(
  timeoutMs = 1500,
): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return Promise.resolve([]);
  }

  const existing = loadVoices();
  if (existing.length > 0) {
    return Promise.resolve(existing);
  }

  return new Promise((resolve) => {
    const synth = window.speechSynthesis;
    const done = () => {
      window.clearTimeout(timer);
      synth.removeEventListener("voiceschanged", onChange);
      resolve(loadVoices());
    };
    const onChange = () => {
      if (loadVoices().length > 0) {
        done();
      }
    };
    const timer = window.setTimeout(done, timeoutMs);
    synth.addEventListener("voiceschanged", onChange);
  });
}

export function setWelcomeSpeakText(text: string): void {
  const trimmed = text.trim();
  if (trimmed.length > 0) {
    cachedText = trimmed;
  }
}

export function getWelcomeSpeakText(): string {
  return cachedText;
}

export function isWelcomeSpeaking(): boolean {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return active;
  }
  // `currentUtterance` lu volontairement (ref anti-GC Chrome).
  return (
    active ||
    currentUtterance !== null ||
    window.speechSynthesis.speaking ||
    window.speechSynthesis.pending
  );
}

export function wasWelcomeSpeakPlayed(): boolean {
  return playedOk;
}

/** Nouvelle entrée home — autorise un nouveau salut à chaque lancement. */
export function resetWelcomeSpeakSession(): void {
  playedOk = false;
  active = false;
  generation += 1;
  currentUtterance = null;
  try {
    window.speechSynthesis?.cancel();
  } catch {
    /* ignore */
  }
}

type StartWelcomeSpeakOptions = {
  onStart?: () => void;
};

/**
 * Démarre le salut (idempotent si déjà en cours).
 * @returns true si `speak()` a été appelé.
 */
export function startWelcomeSpeak(
  text: string = cachedText,
  options: StartWelcomeSpeakOptions = {},
): boolean {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return false;
  }

  const trimmed = text.trim() || cachedText;
  if (trimmed.length === 0) {
    return false;
  }

  const synth = window.speechSynthesis;
  const { onStart } = options;

  if (active) {
    onStart?.();
    return true;
  }

  const myGen = ++generation;
  cachedText = trimmed;

  let settled = false;
  let started = false;

  const stillCurrent = () => myGen === generation;

  const markStarted = () => {
    if (!stillCurrent() || started || settled) {
      return;
    }
    started = true;
    onStart?.();
  };

  const finish = (ok: boolean) => {
    if (!stillCurrent() || settled) {
      return;
    }
    settled = true;
    if (ok) {
      playedOk = true;
    }
    active = false;
    currentUtterance = null;
  };

  const bind = (utterance: SpeechSynthesisUtterance) => {
    utterance.onstart = markStarted;
    utterance.onend = () => finish(true);
    utterance.onerror = () => finish(false);
    currentUtterance = utterance;
    synth.speak(utterance);
    try {
      synth.resume();
    } catch {
      /* ignore */
    }
  };

  active = true;
  bind(buildUtterance(trimmed));

  // Chrome : parfois pending=false speaking=false juste après speak — relance.
  window.setTimeout(() => {
    if (!stillCurrent() || settled) {
      return;
    }
    if (synth.speaking || synth.pending) {
      markStarted();
      return;
    }
    bind(buildUtterance(trimmed));
  }, 300);

  // Filet anti speaking fantôme.
  window.setTimeout(
    () => {
      if (!stillCurrent() || settled) {
        return;
      }
      if (!synth.speaking && !synth.pending) {
        finish(false);
      }
    },
    Math.min(20_000, Math.max(5_000, trimmed.length * 90)),
  );

  return true;
}

/**
 * Variante async : attend les voix puis speak (préférée hors call stack GSAP).
 */
export async function startWelcomeSpeakWhenReady(
  text: string = cachedText,
  options: StartWelcomeSpeakOptions = {},
): Promise<boolean> {
  await waitForSpeechVoices();
  return startWelcomeSpeak(text, options);
}

export function waitWelcomeSpeakEnd(): Promise<void> {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const synth = window.speechSynthesis;
    const tick = () => {
      if (!active && !synth.speaking && !synth.pending) {
        window.clearInterval(id);
        resolve();
        return;
      }
      if (synth.paused) {
        try {
          synth.resume();
        } catch {
          /* ignore */
        }
      }
    };
    const id = window.setInterval(tick, 100);
    tick();
  });
}
