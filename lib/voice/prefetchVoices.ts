/** Précharge la liste des voix (async navigateur). */
export function prefetchSpeechVoices(): void {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return;
  }
  void window.speechSynthesis.getVoices();
  window.speechSynthesis.addEventListener(
    "voiceschanged",
    () => {
      void window.speechSynthesis.getVoices();
    },
    { once: true },
  );
}
