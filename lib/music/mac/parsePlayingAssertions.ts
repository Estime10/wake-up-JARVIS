import "server-only";

const PID_LINE_RE = /pid\s+(\d+)\(([^)]+)\)/;

export type PlayingAssertion = {
  pid: number;
  app: string;
};

/** Parse `pmset -g assertions` → apps qui déclarent "Playing audio". */
export function parsePlayingAssertions(raw: string): PlayingAssertion[] {
  const found = new Map<number, string>();
  for (const line of raw.split("\n")) {
    if (!line.includes("Playing audio")) {
      continue;
    }
    const match = line.match(PID_LINE_RE);
    if (!match?.[1] || !match[2]) {
      continue;
    }
    found.set(Number(match[1]), match[2]);
  }
  return [...found.entries()].map(([pid, app]) => ({ pid, app }));
}
