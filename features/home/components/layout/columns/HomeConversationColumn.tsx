"use client";

import { ConversationEmptyState } from "@/features/home/components/ui/conversation/thread/ConversationEmptyState";
import { ConversationLoadState } from "@/features/home/components/ui/conversation/thread/ConversationLoadState";
import { ConversationThread } from "@/features/home/components/ui/conversation/thread/ConversationThread";
import type { MemoryLoadStatus } from "@/features/assistant/hooks/useAssistantSession";
import type { ConversationMessage } from "@/features/home/model/conversationMessage";
import { PANEL_CONTENT_MOTION_CLASS } from "@/features/home/model/panelContentMotion";
import { cn } from "@/lib/cn";

type HomeConversationColumnProps = {
  settled: boolean;
  obscured: boolean;
  memoryStatus: MemoryLoadStatus;
  messages: ConversationMessage[];
  hasMoreOlder: boolean;
  loadingOlder: boolean;
  onLoadOlder: () => void;
  onRetryMemory: () => void;
  onConfirmAction: (messageId: string) => void;
  onCancelAction: (messageId: string) => void;
};

/** Colonne gauche — fil de conversation (masqué si tiroir ouvert). */
export function HomeConversationColumn({
  settled,
  obscured,
  memoryStatus,
  messages,
  hasMoreOlder,
  loadingOlder,
  onLoadOlder,
  onRetryMemory,
  onConfirmAction,
  onCancelAction,
}: HomeConversationColumnProps) {
  const memoryBlocked = memoryStatus !== "ready";
  const conversationEmpty = memoryStatus === "ready" && messages.length === 0;
  const showThread = settled && !memoryBlocked && !conversationEmpty;

  return (
    <div
      className={cn(
        "relative flex min-h-0 min-w-0 flex-col pl-6 sm:pl-8",
        PANEL_CONTENT_MOTION_CLASS,
        obscured && "pointer-events-none opacity-0",
      )}
      aria-hidden={obscured || undefined}
    >
      {!settled ? null : memoryBlocked ? (
        <ConversationLoadState
          status={memoryStatus === "error" ? "error" : "loading"}
          onRetry={onRetryMemory}
        />
      ) : conversationEmpty ? (
        <ConversationEmptyState />
      ) : showThread ? (
        <div className="flex min-h-0 w-full flex-1 flex-col items-stretch justify-end">
          <ConversationThread
            messages={messages}
            onConfirmAction={onConfirmAction}
            onCancelAction={onCancelAction}
            scrollLock={obscured}
            animateEntrance
            hasMoreOlder={hasMoreOlder}
            loadingOlder={loadingOlder}
            onLoadOlder={onLoadOlder}
          />
        </div>
      ) : null}
    </div>
  );
}
