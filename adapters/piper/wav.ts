/**
 * Décode un buffer WAV PCM → AudioBuffer (Web Audio).
 */
export async function decodeWavToAudioBuffer(
  ctx: AudioContext,
  wav: ArrayBuffer,
): Promise<AudioBuffer> {
  return ctx.decodeAudioData(wav.slice(0));
}
