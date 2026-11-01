import type { RepoIconProps } from "@/features/home/components/repo/icons/RepoIconProps";

export function RepoWarningIcon({ className }: RepoIconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      aria-hidden
    >
      <path d="M8 2.5 14 13.5H2z" strokeLinejoin="round" />
      <path d="M8 6.5v3.5M8 11.5v.5" strokeLinecap="round" />
    </svg>
  );
}
