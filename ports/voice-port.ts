export interface VoicePort {
  startListening(handlers: {
    onTranscript: (partial: string) => void;
    /** 0..1, ~30/s — jamais dans un state React. */
    onLevel: (level: number) => void;
  }): { stop: () => void };

  speak(
    text: string,
    handlers: {
      onLevel: (level: number) => void;
      /** Premier frame audio réel (anneau speaking). */
      onStart?: () => void;
    },
    signal: AbortSignal,
  ): Promise<void>;

  /** Mot de réveil simulé ; renvoie se désabonner. */
  onWakeWord(handler: () => void): () => void;
}
