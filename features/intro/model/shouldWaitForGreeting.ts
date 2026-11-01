/** Full motion : on attend le nœud greeting avant de monter la timeline. */
export function shouldWaitForGreeting(args: {
  mode: "full" | "short";
  reducedMotion: boolean;
  greetingReady: boolean;
  hasGreetingNode: boolean;
}): boolean {
  const { mode, reducedMotion, greetingReady, hasGreetingNode } = args;
  return mode === "full" && !reducedMotion && greetingReady && !hasGreetingNode;
}
