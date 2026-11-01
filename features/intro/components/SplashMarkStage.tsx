import { JarvisMark } from "@/components/ui/JarvisMark";

/** Logo intro — taille calée sur la maquette 01-intro. */
export function SplashMarkStage() {
  return (
    <div
      data-flip-id="ring"
      data-intro="mark"
      className="relative flex size-[min(72vw,22rem)] items-center justify-center text-accent opacity-0 sm:size-[min(52vw,28rem)]"
      aria-hidden
    >
      <JarvisMark className="size-full" />
    </div>
  );
}
