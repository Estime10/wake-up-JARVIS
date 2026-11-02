import { createMockAction } from "@/adapters/mock/createMockAction";
import { createMockLlm } from "@/adapters/mock/createMockLlm";
import { createMockMail } from "@/adapters/mock/createMockMail";
import { createMockMemory } from "@/adapters/mock/createMockMemory";
import { createMockProfile } from "@/adapters/mock/createMockProfile";
import { createMockVoice } from "@/adapters/mock/createMockVoice";
import type { Ports } from "@/ports";

/** Compose tous les adapters mock (seul point de branchement V0). */
export function createMockPorts(): Ports {
  return {
    llm: createMockLlm(),
    voice: createMockVoice(),
    action: createMockAction(),
    memory: createMockMemory(),
    mail: createMockMail(),
    profile: createMockProfile(),
  };
}
