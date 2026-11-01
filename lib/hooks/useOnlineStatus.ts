"use client";

import { useSyncExternalStore } from "react";

function subscribe(onStoreChange: () => void): () => void {
  window.addEventListener("online", onStoreChange);
  window.addEventListener("offline", onStoreChange);
  return () => {
    window.removeEventListener("online", onStoreChange);
    window.removeEventListener("offline", onStoreChange);
  };
}

function readOnlineClient(): boolean {
  return navigator.onLine;
}

function readOnlineServer(): boolean {
  return true;
}

/** Connexion navigateur — `true` / `false` après hydratation. */
export function useOnlineStatus(): boolean {
  return useSyncExternalStore(subscribe, readOnlineClient, readOnlineServer);
}
