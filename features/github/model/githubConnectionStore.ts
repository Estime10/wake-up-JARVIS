import type { GithubConnectionLoadStatus } from "@/features/github/model/githubConnectionStatus";
import type { GithubConnection } from "@/lib/schemas";

export type GithubConnectionSnapshot = {
  connection: GithubConnection | null;
  status: GithubConnectionLoadStatus;
  /** Incrémente pour forcer un refetch partagé. */
  attempt: number;
};

type Listener = () => void;

let snapshot: GithubConnectionSnapshot = {
  connection: null,
  status: "loading",
  attempt: 0,
};

const listeners = new Set<Listener>();

export function getGithubConnectionSnapshot(): GithubConnectionSnapshot {
  return snapshot;
}

export function subscribeGithubConnection(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function setGithubConnectionSnapshot(
  next: Partial<GithubConnectionSnapshot>,
): void {
  snapshot = { ...snapshot, ...next };
  emit();
}

export function bumpGithubConnectionAttempt(): void {
  snapshot = {
    ...snapshot,
    status: "loading",
    attempt: snapshot.attempt + 1,
  };
  emit();
}

export function initGithubConnectionStore(
  status: GithubConnectionLoadStatus,
): void {
  snapshot = {
    connection: null,
    status,
    attempt: status === "unavailable" ? 0 : snapshot.attempt,
  };
  emit();
}
