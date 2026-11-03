import { cn } from "@/lib/cn";

type AssistantMessageBodyProps = {
  text: string;
  streaming?: boolean;
};

/**
 * Corps bulle assistant — lignes `n. …` en uppercase bold (digest mails).
 */
export function AssistantMessageBody({
  text,
  streaming = false,
}: AssistantMessageBodyProps) {
  const lines = text.split("\n");

  return (
    <>
      {lines.map((line, index) => {
        const isMailTitle = /^\d+\.\s/.test(line);
        const isBlank = line.length === 0;
        return (
          <span
            key={`line-${index}`}
            className={cn(
              "block",
              isBlank && "h-3",
              isMailTitle && "font-semibold tracking-wide text-text",
              !isMailTitle && !isBlank && "text-text/90",
            )}
          >
            {isBlank ? "\u00A0" : line}
          </span>
        );
      })}
      {streaming ? (
        <span className="greeting-cursor ml-0.5 text-accent" aria-hidden>
          |
        </span>
      ) : null}
    </>
  );
}
