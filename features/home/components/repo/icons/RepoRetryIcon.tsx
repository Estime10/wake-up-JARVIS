import type { RepoIconProps } from "@/features/home/components/repo/icons/RepoIconProps";

export function RepoRetryIcon({ className }: RepoIconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      aria-hidden
    >
      <path d="M3.5 8a4.5 4.5 0 1 0 1.3-3.2" strokeLinecap="round" />
      <path d="M3.5 3.5v3h3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
