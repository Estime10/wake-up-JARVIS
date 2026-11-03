"use client";

import { useEffect, useState } from "react";

import {
  getWelcomeSpeakText,
  isWelcomeSpeaking,
  startWelcomeSpeakWhenReady,
  waitWelcomeSpeakEnd,
} from "@/lib/voice/welcomeSpeak";

/**
 * Diagnostic TTS Chrome — `/dev/voice` (hors auth).
 * Auto-speak ~1.5s après mount, sans clic.
 */
export default function DevVoicePage() {
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    const lines: string[] = [];
    const push = (line: string) => {
      lines.push(line);
      setLog([...lines]);
    };

    let cancelled = false;

    void (async () => {
      push(`text: ${getWelcomeSpeakText()}`);
      push(`voices@0: ${window.speechSynthesis.getVoices().length}`);
      await new Promise<void>((r) => {
        window.setTimeout(r, 1500);
      });
      if (cancelled) {
        return;
      }
      push("start…");
      const ok = await startWelcomeSpeakWhenReady();
      push(`start returned: ${ok}`);
      push(`speaking: ${window.speechSynthesis.speaking}`);
      push(`pending: ${window.speechSynthesis.pending}`);
      push(`isWelcomeSpeaking: ${isWelcomeSpeaking()}`);
      await waitWelcomeSpeakEnd();
      if (cancelled) {
        return;
      }
      push("ended");
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="mx-auto max-w-lg p-8 font-mono text-sm text-text">
      <h1 className="mb-4 font-sans text-xl font-semibold">dev / voice</h1>
      <p className="mb-4 text-text-muted">
        Doit parler tout seul ~1,5 s après chargement (Chrome, sans clic).
      </p>
      <ol className="list-decimal space-y-1 pl-5">
        {log.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ol>
    </main>
  );
}
