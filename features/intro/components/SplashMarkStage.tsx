import { JarvisMark } from "@/components/ui/JarvisMark";

/**
 * Logo intro — taille un cran sous le max précédent.
 */
export function SplashMarkStage() {
  return (
    <div
      data-flip-id="ring"
      data-intro="mark"
      className="relative flex size-[min(62vw,18rem)] items-center justify-center text-accent opacity-0 sm:size-[min(48vw,22rem)]"
      aria-hidden
    >
      <JarvisMark className="size-full" />
    </div>
  );
}
