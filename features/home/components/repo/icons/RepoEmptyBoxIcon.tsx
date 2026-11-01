import type { RepoIconProps } from "@/features/home/components/repo/icons/RepoIconProps";

export function RepoEmptyBoxIcon({ className }: RepoIconProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      aria-hidden
    >
      <rect x="6" y="8" width="20" height="16" rx="1.5" />
      <path d="M6 12h20M16 12v12" />
    </svg>
  );
}
