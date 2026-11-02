import type { ActionPort } from "@/ports/action-port";
import type { LlmPort } from "@/ports/llm-port";
import type { MailPort } from "@/ports/mail-port";
import type { MemoryPort } from "@/ports/memory-port";
import type { ProfilePort } from "@/ports/profile-port";
import type { VoicePort } from "@/ports/voice-port";

export type { ActionPort } from "@/ports/action-port";
export type { LlmChunk, LlmPort } from "@/ports/llm-port";
export type { MailPort } from "@/ports/mail-port";
export type { MemoryPort } from "@/ports/memory-port";
export type { ProfilePort } from "@/ports/profile-port";
export type { VoicePort } from "@/ports/voice-port";

/** Bundle injecté une seule fois via `app/providers.tsx`. */
export type Ports = {
  llm: LlmPort;
  voice: VoicePort;
  action: ActionPort;
  memory: MemoryPort;
  mail: MailPort;
  profile: ProfilePort;
};
