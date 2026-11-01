import type { RepoIconProps } from "@/features/home/components/repo/icons/RepoIconProps";

export function RepoCommitIcon({ className }: RepoIconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      aria-hidden
    >
      <circle cx="8" cy="8" r="2.25" />
      <path d="M8 2.5v3.25M8 10.25V13.5" strokeLinecap="round" />
    </svg>
  );
}
