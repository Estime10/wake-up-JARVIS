import { prefetchSpeechVoices } from "@/lib/voice/prefetchVoices";

const UNLOCK_KEY = "jarvis.speechUnlocked";

/** Ref forte anti-GC Chrome (utterance de déblocage). */
let unlockUtterance: SpeechSynthesisUtterance | null = null;

/** AudioContext créé sous geste — Piper / Web Audio sans clic dédié. */
let unlockedAudioContext: AudioContext | null = null;

/** Source silencieuse : empêche Chrome de re-suspendre le ctx pendant le splash. */
let keepaliveSource: AudioBufferSourceNode | null = null;
let keepaliveGain: GainNode | null = null;

let opportunisticInstalled = false;
const unlockWaiters = new Set<() => void>();

export function isSpeechUnlocked(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  void unlockUtterance;
  try {
    return window.sessionStorage.getItem(UNLOCK_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * AudioContext partagé (créé sous geste login / pointer).
 * Piper réutilise ce contexte pour jouer sans nouveau geste.
 */
export function getUnlockedAudioContext(): AudioContext | null {
  return unlockedAudioContext;
}

export function isAudioPlaybackReady(): boolean {
  return unlockedAudioContext?.state === "running";
}

function notifyUnlockWaiters(): void {
  const waiters = [...unlockWaiters];
  unlockWaiters.clear();
  for (const waiter of waiters) {
    waiter();
  }
}

/**
 * Boucle silencieuse (1 sample, gain 0) — Chrome ne re-suspend plus le ctx
 * pendant les ~6 s de splash muet ; le greeting home part seul.
 */
function startAudioKeepalive(ctx: AudioContext): void {
  if (keepaliveSource) {
    return;
  }
  try {
    const buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start(0);
    keepaliveSource = source;
    keepaliveGain = gain;
  } catch {
    /* Web Audio partiel */
  }
}

/** Coupe le keepalive (session finie / tests). Idempotent. */
export function stopAudioKeepalive(): void {
  if (keepaliveSource) {
    try {
      keepaliveSource.stop();
    } catch {
      /* already stopped */
    }
    try {
      keepaliveSource.disconnect();
    } catch {
      /* ignore */
    }
    keepaliveSource = null;
  }
  if (keepaliveGain) {
    try {
      keepaliveGain.disconnect();
    } catch {
      /* ignore */
    }
    keepaliveGain = null;
  }
}

function resumeExistingContext(): void {
  if (!unlockedAudioContext) {
    return;
  }
  void unlockedAudioContext.resume().then(() => {
    if (unlockedAudioContext?.state === "running") {
      startAudioKeepalive(unlockedAudioContext);
      notifyUnlockWaiters();
    }
  });
  if (unlockedAudioContext.state === "running") {
    startAudioKeepalive(unlockedAudioContext);
    notifyUnlockWaiters();
  }
}

/**
 * À appeler SYNCHRONEMENT dans un handler de geste (submit login, pointer).
 * Débloque AudioContext (Piper) — speechSynthesis unlock à volume 0 (pas de clic audible).
 */
export function unlockSpeechFromUserGesture(): void {
  if (typeof window === "undefined") {
    return;
  }

  prefetchSpeechVoices();

  try {
    window.sessionStorage.setItem(UNLOCK_KEY, "1");
  } catch {
    /* private mode */
  }

  try {
    if (!unlockedAudioContext) {
      unlockedAudioContext = new AudioContext();
    }
    resumeExistingContext();
  } catch {
    /* Web Audio indisponible */
  }

  if (!window.speechSynthesis) {
    return;
  }

  const synth = window.speechSynthesis;
  const utterance = new SpeechSynthesisUtterance(" ");
  // Volume 0 : débloque la file speechSynthesis sans bruit Mac.
  utterance.volume = 0;
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

/**
 * Filet unlock-only (splash ou home) — aucun TTS ici.
 * Idempotent.
 */
export function installOpportunisticAudioUnlock(): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }
  if (opportunisticInstalled) {
    return () => {};
  }
  opportunisticInstalled = true;

  const onGesture = () => {
    unlockSpeechFromUserGesture();
  };

  window.addEventListener("pointerdown", onGesture, {
    capture: true,
    passive: true,
  });
  window.addEventListener("keydown", onGesture, {
    capture: true,
    passive: true,
  });

  return () => {
    opportunisticInstalled = false;
    window.removeEventListener("pointerdown", onGesture, { capture: true });
    window.removeEventListener("keydown", onGesture, { capture: true });
  };
}

/**
 * Attend un AudioContext `running` (geste déjà passé ou prochain pointer).
 * Ne crée pas de nouveau contexte hors geste (évite suspended → repli Mac).
 * @returns false si timeout / abort.
 */
export function waitForAudioUnlock(
  timeoutMs: number,
  signal?: AbortSignal,
): Promise<boolean> {
  if (typeof window === "undefined") {
    return Promise.resolve(false);
  }
  if (isAudioPlaybackReady()) {
    return Promise.resolve(true);
  }

  // Reprend un ctx déjà créé sous geste (login / clic splash) — pas de new AudioContext.
  resumeExistingContext();
  if (isAudioPlaybackReady()) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) {
        return;
      }
      settled = true;
      unlockWaiters.delete(onUnlock);
      window.clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      resolve(ok);
    };

    const onUnlock = () => {
      if (isAudioPlaybackReady()) {
        finish(true);
      }
    };
    const onAbort = () => {
      finish(false);
    };

    unlockWaiters.add(onUnlock);
    const timer = window.setTimeout(() => {
      finish(isAudioPlaybackReady());
    }, timeoutMs);

    if (signal?.aborted) {
      finish(false);
      return;
    }
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}
