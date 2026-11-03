export type PiperSynthesizeRequest = {
  text: string;
};

export type PiperTransport = {
  /** Synthèse WAV (ArrayBuffer). Throw si indisponible. */
  synthesize(text: string, signal: AbortSignal): Promise<ArrayBuffer>;
};
