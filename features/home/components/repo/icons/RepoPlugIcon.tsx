import type { RepoIconProps } from "@/features/home/components/repo/icons/RepoIconProps";

export function RepoPlugIcon({ className }: RepoIconProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      aria-hidden
    >
      <path
        d="M12 6v6M20 6v6M10 12h12v4a6 6 0 0 1-12 0z"
        strokeLinejoin="round"
      />
      <path d="M16 22v4" strokeLinecap="round" />
    </svg>
  );
}
