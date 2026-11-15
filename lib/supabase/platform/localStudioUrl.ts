/**
 * Studio CLI local (stack Docker du repo) — jamais le dashboard cloud prod.
 * Une seule stack = toujours `/project/default` ; le schéma `public` suit le sync.
 */
export const LOCAL_STUDIO_EDITOR_BASE =
  "http://127.0.0.1:54323/project/default/editor";

/**
 * URL navigateur : éditeur local + `jarvis` (project_ref) + `t` (cache-bust).
 */
export function localStudioBrowserUrl(projectRef: string): string {
  const ref = projectRef.trim();
  const url = new URL(LOCAL_STUDIO_EDITOR_BASE);
  if (ref.length > 0) {
    url.searchParams.set("jarvis", ref);
  }
  url.searchParams.set("t", String(Date.now()));
  return url.toString();
}
