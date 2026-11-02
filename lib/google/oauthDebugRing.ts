import "server-only";

export type OAuthDebugEvent = {
  ts: string;
  step: string;
  detail?: string;
};

const MAX_EVENTS = 40;
const events: OAuthDebugEvent[] = [];

/** Ring buffer process-local — debug OAuth (dev). Pas de tokens / emails. */
export function pushOAuthDebug(step: string, detail?: string): void {
  events.push({
    ts: new Date().toISOString(),
    step,
    ...(detail ? { detail } : {}),
  });
  if (events.length > MAX_EVENTS) {
    events.splice(0, events.length - MAX_EVENTS);
  }
}

export function listOAuthDebugEvents(): readonly OAuthDebugEvent[] {
  return events.slice();
}
