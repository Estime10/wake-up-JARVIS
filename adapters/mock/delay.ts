/** Promise interruptible — mocks latence réseau. */
export function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }

    const id = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    function onAbort(): void {
      clearTimeout(id);
      reject(new DOMException("Aborted", "AbortError"));
    }

    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}
