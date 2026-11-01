export type AssistantState =
  "idle" | "listening" | "thinking" | "speaking" | "error" | "offline";

export type AssistantEvent =
  | { type: "START_LISTEN" }
  | { type: "STOP_LISTEN" }
  | { type: "SUBMIT" }
  | { type: "REPLY_START" }
  | { type: "REPLY_DONE" }
  | { type: "SPEAK_END" }
  | { type: "INTERRUPT" }
  | { type: "FAIL" }
  | { type: "DISMISS" };

/** Transition pure — domaine assistant (PLAN-UI §2.3). */
export function transition(
  state: AssistantState,
  event: AssistantEvent,
): AssistantState {
  if (event.type === "FAIL" && state !== "offline") {
    return "error";
  }

  switch (state) {
    case "idle":
      if (event.type === "START_LISTEN") {
        return "listening";
      }
      if (event.type === "SUBMIT") {
        return "thinking";
      }
      return state;
    case "listening":
      if (event.type === "STOP_LISTEN") {
        return "idle";
      }
      if (event.type === "SUBMIT") {
        return "thinking";
      }
      return state;
    case "thinking":
      if (event.type === "REPLY_START") {
        return "speaking";
      }
      if (event.type === "REPLY_DONE" || event.type === "INTERRUPT") {
        return "idle";
      }
      return state;
    case "speaking":
      if (event.type === "SPEAK_END" || event.type === "INTERRUPT") {
        return "idle";
      }
      return state;
    case "error":
      if (event.type === "DISMISS") {
        return "idle";
      }
      return state;
    case "offline":
      return state;
  }
}
