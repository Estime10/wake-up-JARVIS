import type { RepoIconProps } from "@/features/home/components/repo/icons/RepoIconProps";

export function RepoKeyBrokenIcon({ className }: RepoIconProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      aria-hidden
    >
      <circle cx="11" cy="14" r="4" />
      <path
        d="M14.5 16.5 24 26M21 23l3 3M22.5 20.5l3 3"
        strokeLinecap="round"
      />
    </svg>
  );
}
