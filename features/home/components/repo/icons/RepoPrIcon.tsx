import type { RepoIconProps } from "@/features/home/components/repo/icons/RepoIconProps";

export function RepoPrIcon({ className }: RepoIconProps) {
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
      <circle cx="11.5" cy="12" r="1.5" />
      <path
        d="M4.5 5.5v5M11.5 10.5V7.5A3 3 0 0 0 8.5 4.5H6"
        strokeLinecap="round"
      />
    </svg>
  );
}
