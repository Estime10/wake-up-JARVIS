import type { RepoIconProps } from "@/features/home/components/repo/icons/RepoIconProps";

export function RepoBranchIcon({ className }: RepoIconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      aria-hidden
    >
      <circle cx="4.5" cy="4" r="1.5" />
      <circle cx="4.5" cy="12" r="1.5" />
      <circle cx="11.5" cy="8" r="1.5" />
      <path d="M4.5 5.5v5M4.5 8h5.5" strokeLinecap="round" />
    </svg>
  );
}
